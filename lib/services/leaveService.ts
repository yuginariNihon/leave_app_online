import { LeaveStatus, ApprovalStatus, Prisma, EmploymentStatus } from "@/lib/generated/prisma/client";
import type { ApproverType } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { LeaveFormOptions } from "@/lib/TypeSchema";
import { randomBytes } from "crypto";
import { toDateOnly, countInclusiveDays, hashPassword } from "@/lib/utils";
import { checkApproverExists, APPROVER_TYPE_LABELS } from "@/lib/services/approverUtils";
import { updateUsedDaysOnApproval } from "@/lib/services/approvalService";

export type CreateLeaveRequestInput = {
  staffId: string;
  leaveTypeId: string;
  leaveCaseId: string;
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
  totalDays?: number;
};

/**
 * Get all active leave types and leave cases.
 */
export async function getActiveLeaveOptions(): Promise<LeaveFormOptions> {
  const [leaveTypes, leaveCases] = await Promise.all([
    prisma.leaveType.findMany({
      where: { is_active: true },
      select: {
        leave_type_id: true,
        leave_type_name: true,
      },
      orderBy: { leave_type_name: "asc" },
    }),
    prisma.leaveCase.findMany({
      where: { is_active: true },
      select: {
        leave_case_id: true,
        leave_type_id: true,
        case_name: true,
      },
      orderBy: [{ leave_type_id: "asc" }, { case_name: "asc" }],
    }),
  ]);

  return {
    leaveTypes: leaveTypes.map((item) => ({
      id: item.leave_type_id,
      label: item.leave_type_name,
    })),
    leaveCases: leaveCases.map((item) => ({
      id: item.leave_case_id,
      label: item.case_name,
      leaveTypeId: item.leave_type_id,
    })),
  };
}

/**
 * Validates that staff, leave type, and leave case exist, are active,
 * and that the leave case belongs to the leave type.
 */
export async function validateLeaveRequestDetails(
  staffId: string,
  leaveTypeId: string,
  leaveCaseId: string,
) {
  const [staff, leaveType, leaveCase] = await Promise.all([
    prisma.staffInfo.findFirst({
      where: { staff_id: staffId, is_active: true },
      select: { staff_id: true },
    }),
    prisma.leaveType.findFirst({
      where: { leave_type_id: leaveTypeId, is_active: true },
      select: { leave_type_id: true },
    }),
    prisma.leaveCase.findFirst({
      where: {
        leave_case_id: leaveCaseId,
        leave_type_id: leaveTypeId,
        is_active: true,
      },
      select: { leave_case_id: true },
    }),
  ]);

  return {
    isStaffValid: !!staff,
    isLeaveTypeValid: !!leaveType,
    isLeaveCaseValid: !!leaveCase,
  };
}

/**
 * Creates a leave request record in the database.
 */
export async function createLeaveRequest(input: CreateLeaveRequestInput) {
  const startDate = toDateOnly(input.startDate);
  const endDate = toDateOnly(input.endDate);
  const totalDays = input.totalDays ?? countInclusiveDays(startDate, endDate);

  // 1. Get staff info for position & department
  const staff = await prisma.staffInfo.findUnique({
    where: { staff_id: input.staffId },
    select: { position_id: true, department_id: true },
  });

  if (!staff) throw new Error("Staff not found.");

  // 2. Find workflow by position (1-to-1 schema)
  const workflow = await prisma.leaveWorkflow.findFirst({
    where: {
      position_id: staff.position_id,
      is_active: true,
    },
    include: { steps: { orderBy: { approval_level: "asc" } } },
  });

  if (!workflow) {
    throw new Error("No active workflow found for your position.");
  }

  // 3. Determine auto-skip for each step (sequential: stop after first pending)
  const stepStatuses = await Promise.all(
    workflow.steps.map(async (step) => {
      const hasApprover = await checkApproverExists(
        input.staffId,
        staff.department_id,
        step.approver_type,
      );
      return {
        step,
        hasApprover,
        isAutoApproved: false,
      };
    }),
  );

  // 4. Force steps after first pending to not auto-skip
  let firstPendingLevel: number | null = null;
  let foundPending = false;

  for (const item of stepStatuses) {
    if (!item.hasApprover && !foundPending) {
      item.isAutoApproved = true;
    } else {
      item.isAutoApproved = false;
      if (!foundPending) {
        firstPendingLevel = item.step.approval_level;
        foundPending = true;
      }
    }
  }

  const allAutoApproved = !foundPending;

  // 5-7. Create leave, approvals, and update used days in a single transaction
  const leave = await prisma.$transaction(async (tx) => {
    const created = await tx.dataLeave.create({
      data: {
        staff_id: input.staffId,
        leave_type_id: input.leaveTypeId,
        leave_case_id: input.leaveCaseId,
        start_date: startDate,
        end_date: endDate,
        total_days: new Prisma.Decimal(totalDays),
        reason: input.reason,
        leave_status: allAutoApproved
          ? LeaveStatus.approved
          : LeaveStatus.pending,
        current_approval_level: firstPendingLevel ?? 1,
      },
    });

    await Promise.all(
      stepStatuses.map((item) =>
        tx.leaveApproval.create({
          data: {
            leave_id: created.leave_id,
            approver_id: null,
            approval_level: item.step.approval_level,
            approval_status: item.isAutoApproved
              ? ApprovalStatus.approved
              : ApprovalStatus.pending,
            approval_comment: item.isAutoApproved
              ? `Auto-approved: No valid approver found for ${item.step.approver_type} step`
              : null,
            acted_at: item.isAutoApproved ? new Date() : null,
          },
        })
      ),
    );

    if (allAutoApproved) {
      await updateUsedDaysOnApproval(created.leave_id, tx);
    }

    return created;
  });

  return leave;
}

export type UpdateLeaveRequestInput = {
  leaveTypeId: string;
  leaveCaseId: string;
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
  totalDays?: number;
};

/**
 * Updates a pending leave request record in the database.
 */
export async function updateLeaveRequest(
  leaveId: string,
  staffId: string,
  input: UpdateLeaveRequestInput,
) {
  const leave = await prisma.dataLeave.findFirst({
    where: {
      leave_id: leaveId,
      staff_id: staffId,
      leave_status: LeaveStatus.pending,
    },
    select: { leave_id: true },
  });

  if (!leave) {
    throw new Error(
      "Leave not found, not owned by you, or is not in pending status.",
    );
  }

  const startDate = toDateOnly(input.startDate);
  const endDate = toDateOnly(input.endDate);
  const totalDays = input.totalDays ?? countInclusiveDays(startDate, endDate);

  return prisma.dataLeave.update({
    where: { leave_id: leaveId },
    data: {
      leave_type_id: input.leaveTypeId,
      leave_case_id: input.leaveCaseId,
      start_date: startDate,
      end_date: endDate,
      total_days: new Prisma.Decimal(totalDays),
      reason: input.reason,
      updated_at: new Date(),
    },
  });
}

export async function cancelLeaveRequest(leaveId: string, staffId: string) {
  const leave = await prisma.dataLeave.findFirst({
    where: {
      leave_id: leaveId,
      staff_id: staffId,
      leave_status: LeaveStatus.pending,
    },
    select: { leave_id: true },
  });

  if (!leave) {
    throw new Error(
      "Leave not found, not owned by you, or already processed.",
    );
  }

  const [updatedLeave] = await prisma.$transaction([
    prisma.dataLeave.update({
      where: { leave_id: leaveId },
      data: {
        leave_status: LeaveStatus.cancelled,
        cancelled_at: new Date(),
        updated_at: new Date(),
      },
    }),
    prisma.leaveApproval.updateMany({
      where: {
        leave_id: leaveId,
        approval_status: ApprovalStatus.pending,
      },
      data: {
        approval_status: ApprovalStatus.cancelled,
        acted_at: new Date(),
      },
    }),
  ]);

  return updatedLeave;
}

// ══════════════════════════════════════════════
// Query functions (merged from leaveQueryService)
// ══════════════════════════════════════════════

// ──────────────────────────────────────────────
// Leave History
// ──────────────────────────────────────────────

export type LeaveHistoryFilters = {
  search?: string;
  status?: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export type LeaveHistoryItem = {
  leaveId: string;
  leaveTypeName: string;
  leaveCaseName: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: string | null;
  reason: string | null;
  status: string;
  createdAt: string;
};

export type LeaveHistoryResult = {
  data: LeaveHistoryItem[];
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  cancelled: number;
  page: number;
  totalPages: number;
  limit: number;
};

export async function getLeaveHistoryByStaffId(
  staffId: string,
  filters: LeaveHistoryFilters,
): Promise<LeaveHistoryResult> {
  const {
    search,
    status,
    leaveTypeId,
    startDate,
    endDate,
    page = 1,
    limit,
  } = filters;

  const where: Prisma.DataLeaveWhereInput = {
    staff_id: staffId,
  };

  if (status && status !== "all") {
    where.leave_status = status as LeaveStatus;
  }

  if (leaveTypeId) {
    where.leave_type_id = leaveTypeId;
  }

  if (search) {
    where.OR = [
      { reason: { contains: search, mode: "insensitive" } },
      { leaveType: { leave_type_name: { contains: search, mode: "insensitive" } } },
      { leaveCase: { case_name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (startDate) {
    where.start_date = {
      gte: new Date(`${startDate}T00:00:00.000Z`),
    };
  }

  if (endDate) {
    where.end_date = {
      lte: new Date(`${endDate}T00:00:00.000Z`),
    };
  }

  const [data, countGroup] = await Promise.all([
    prisma.dataLeave.findMany({
      where,
      include: {
        leaveType: { select: { leave_type_name: true } },
        leaveCase: { select: { case_name: true } },
      },
      orderBy: { created_at: "desc" },
      ...(limit ? { skip: (page - 1) * limit, take: limit } : {}),
    }),
    prisma.dataLeave.groupBy({
      by: ["leave_status"],
      where,
      _count: true,
    }),
  ]);

  const total = countGroup.reduce((sum, g) => sum + g._count, 0);
  const approved = countGroup.find((g) => g.leave_status === LeaveStatus.approved)?._count ?? 0;
  const pending = countGroup.find((g) => g.leave_status === LeaveStatus.pending)?._count ?? 0;
  const rejected = countGroup.find((g) => g.leave_status === LeaveStatus.rejected)?._count ?? 0;
  const cancelled = countGroup.find((g) => g.leave_status === LeaveStatus.cancelled)?._count ?? 0;

  return {
    data: data.map((item) => ({
      leaveId: item.leave_id,
      leaveTypeName: item.leaveType.leave_type_name,
      leaveCaseName: item.leaveCase.case_name,
      startDate: item.start_date?.toISOString() ?? null,
      endDate: item.end_date?.toISOString() ?? null,
      totalDays: item.total_days?.toString() ?? null,
      reason: item.reason,
      status: item.leave_status,
      createdAt: item.created_at.toISOString(),
    })),
    total,
    approved,
    pending,
    rejected,
    cancelled,
    page,
    totalPages: limit ? Math.ceil(total / limit) : 1,
    limit: limit ?? total,
  };
}

// ──────────────────────────────────────────────
// Leave Detail
// ──────────────────────────────────────────────

export type LeaveApprovalItem = {
  approvalId: string;
  approverName: string;
  approverRole: string;
  level: number;
  status: string;
  comment: string | null;
  approvedAt: string | null;
};

export type LeaveAttachmentItem = {
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
};

export type LeaveDetailResponse = {
  leaveId: string;
  referenceId: string;
  status: string;
  reason: string | null;
  totalDays: number;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  leaveTypeId: string;
  leaveCaseId: string;
  leaveTypeName: string;
  leaveCaseName: string;
  staffId: string;
  staffName: string;
  staffCode: string;
  departmentName: string | null;
  positionName: string | null;
  approvals: LeaveApprovalItem[];
  attachments: LeaveAttachmentItem[];
  supervisor: { name: string; role: string } | null;
  quota: { remaining: number; total: number; percent: number } | null;
};

export async function getLeaveDetailById(
  leaveId: string,
): Promise<LeaveDetailResponse | null> {
  const leave = await prisma.dataLeave.findUnique({
    where: { leave_id: leaveId },
    include: {
      leaveType: { select: { leave_type_name: true } },
      leaveCase: { select: { case_name: true } },
      staff: {
        select: {
          staff_id: true,
          name: true,
          staff_code: true,
          department_id: true,
          position_id: true,
          department: { select: { department_name: true } },
          position: { select: { position_name: true } },
          supervisors: {
            take: 1,
            select: {
              supervisor: {
                select: {
                  name: true,
                  position: { select: { position_name: true } },
                },
              },
            },
          },
        },
      },
      approvals: {
        include: {
          approver: {
            select: {
              name: true,
              position: { select: { position_name: true } },
            },
          },
        },
        orderBy: { approval_level: "asc" },
      },
      attachments: {
        where: { archived_at: null },
        select: {
          file_name: true,
          file_size: true,
          mime_type: true,
        },
      },
    },
  });

  if (!leave) return null;

  // Fetch workflow steps to get position names for pending approvals
  const workflow = await prisma.leaveWorkflow.findFirst({
    where: { position_id: leave.staff.position_id, is_active: true },
    include: { steps: { select: { approval_level: true, approver_type: true } } },
  });

  const currentYear = new Date().getFullYear();
  const leaveLimit = await prisma.userLeaveLimit.findUnique({
    where: {
      staff_id_leave_type_id_year: {
        staff_id: leave.staff_id,
        leave_type_id: leave.leave_type_id,
        year: currentYear,
      },
    },
    select: { max_days: true, used_days: true },
  });

  return {
    leaveId: leave.leave_id,
    referenceId: `#LV-${leave.leave_id.slice(0, 8).toUpperCase()}`,
    status: leave.leave_status,
    reason: leave.reason,
    totalDays: Number(leave.total_days ?? 0),
    createdAt: leave.created_at.toISOString(),
    startDate: leave.start_date?.toISOString() ?? null,
    endDate: leave.end_date?.toISOString() ?? null,
    leaveTypeId: leave.leave_type_id,
    leaveCaseId: leave.leave_case_id,
    leaveTypeName: leave.leaveType.leave_type_name,
    leaveCaseName: leave.leaveCase.case_name,
    staffId: leave.staff.staff_id,
    staffName: leave.staff.name,
    staffCode: leave.staff.staff_code,
    departmentName: leave.staff.department?.department_name ?? null,
    positionName: leave.staff.position?.position_name ?? null,
    approvals: leave.approvals.map((a) => {
      let autoSkipRole = "";
      if (!a.approver && a.approval_status === "approved" && a.approval_comment?.startsWith("Auto-approved")) {
        const parsed = a.approval_comment.replace("Auto-approved: No valid approver found for ", "").replace(" step", "");
        if (parsed !== "this") autoSkipRole = APPROVER_TYPE_LABELS[parsed] ?? parsed;
      }

      // Get workflow step for this approval level
      const approvalStep = workflow?.steps.find(s => s.approval_level === a.approval_level);

      // Get position name from workflow step for pending steps
      const pendingRole = (!a.approver && a.approval_status === "pending" && approvalStep)
        ? (APPROVER_TYPE_LABELS[approvalStep.approver_type] ?? approvalStep.approver_type)
        : "";

      // For HR steps, always show "HR" as role regardless of approver's StaffInfo position
      const isHRStep = approvalStep?.approver_type === "HR";

      const approverRole = isHRStep
        ? (APPROVER_TYPE_LABELS["HR"] ?? "HR")
        : (a.approver?.position?.position_name ?? (autoSkipRole || pendingRole));

      return {
        approvalId: a.approval_id,
        approverName:
          a.approver?.name ??
          (a.approval_status === "approved"
            ? "Auto-Skip"
            : "รอดำเนินการ"),
        approverRole,
        level: a.approval_level,
        status: a.approval_status,
        comment: a.approval_comment,
        approvedAt: a.acted_at?.toISOString() ?? null,
      };
    }),
    attachments: leave.attachments.map((a) => ({
      fileName: a.file_name,
      fileSize: a.file_size,
      mimeType: a.mime_type,
    })),
    supervisor: leave.staff.supervisors[0]?.supervisor
      ? {
          name: leave.staff.supervisors[0].supervisor.name,
          role: leave.staff.supervisors[0].supervisor.position?.position_name ?? "",
        }
      : null,
    quota: leaveLimit
      ? {
          remaining: Number(leaveLimit.max_days) - Number(leaveLimit.used_days),
          total: Number(leaveLimit.max_days),
          percent: Math.round(
            (Number(leaveLimit.used_days) / Number(leaveLimit.max_days)) * 100,
          ),
        }
      : null,
  };
}

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────

export type StaffProfile = {
  name: string;
  staffCode: string;
  positionName: string | null;
  departmentName: string | null;
  employmentTypeName: string | null;
  employmentStatus: string;
};

export async function getStaffProfile(
  staffId: string,
): Promise<StaffProfile | null> {
  const staff = await prisma.staffInfo.findUnique({
    where: { staff_id: staffId },
    select: {
      name: true,
      staff_code: true,
      employment_status: true,
      department: { select: { department_name: true } },
      position: { select: { position_name: true } },
      employmentType: { select: { name: true, thainame: true } },
    },
  });

  if (!staff) return null;

  return {
    name: staff.name,
    staffCode: staff.staff_code,
    positionName: staff.position?.position_name ?? null,
    departmentName: staff.department?.department_name ?? null,
    employmentTypeName: staff.employmentType?.thainame ?? staff.employmentType?.name ?? null,
    employmentStatus: staff.employment_status,
  };
}

export type DashboardLeaveStats = {
  totalRemainingDays: number;
  pending: number;
  approved: number;
  rejectedCancelled: number;
};

export async function getDashboardLeaveStats(
  staffId: string,
): Promise<DashboardLeaveStats> {
  const [leaveLimits, pending, approved, rejected, cancelled] =
    await Promise.all([
      prisma.userLeaveLimit.findMany({
        where: { staff_id: staffId, year: new Date().getFullYear() },
        select: { max_days: true, used_days: true },
      }),
      prisma.dataLeave.count({
        where: { staff_id: staffId, leave_status: LeaveStatus.pending },
      }),
      prisma.dataLeave.count({
        where: { staff_id: staffId, leave_status: LeaveStatus.approved },
      }),
      prisma.dataLeave.count({
        where: { staff_id: staffId, leave_status: LeaveStatus.rejected },
      }),
      prisma.dataLeave.count({
        where: { staff_id: staffId, leave_status: LeaveStatus.cancelled },
      }),
    ]);

  const totalRemainingDays = leaveLimits.reduce(
    (sum, l) => sum + (Number(l.max_days) - Number(l.used_days)),
    0,
  );

  return {
    totalRemainingDays,
    pending,
    approved,
    rejectedCancelled: rejected + cancelled,
  };
}

export type LeaveRightItem = {
  leaveTypeId: string;
  leaveTypeName: string;
  usedDays: number;
  maxDays: number;
};

export async function getLeaveRightsByStaffId(
  staffId: string,
  year: number = new Date().getFullYear(),
): Promise<LeaveRightItem[]> {
  const limits = await prisma.userLeaveLimit.findMany({
    where: { staff_id: staffId, year },
    select: {
      leave_type_id: true,
      max_days: true,
      used_days: true,
      leaveType: { select: { leave_type_name: true } },
    },
    orderBy: { leaveType: { leave_type_name: "asc" } },
  });

  return limits.map((l) => ({
    leaveTypeId: l.leave_type_id,
    leaveTypeName: l.leaveType.leave_type_name,
    usedDays: Number(l.used_days),
    maxDays: Number(l.max_days),
  }));
}

export type RecentLeaveItem = {
  leaveId: string;
  leaveTypeName: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: string | null;
  status: string;
  createdAt: string;
};

export async function getRecentLeavesByStaffId(
  staffId: string,
  limit: number = 5,
): Promise<RecentLeaveItem[]> {
  const leaves = await prisma.dataLeave.findMany({
    where: { staff_id: staffId },
    include: {
      leaveType: { select: { leave_type_name: true } },
    },
    orderBy: { created_at: "desc" },
    take: limit,
  });

  return leaves.map((item) => ({
    leaveId: item.leave_id,
    leaveTypeName: item.leaveType.leave_type_name,
    startDate: item.start_date?.toISOString() ?? null,
    endDate: item.end_date?.toISOString() ?? null,
    totalDays: item.total_days?.toString() ?? null,
    status: item.leave_status,
    createdAt: item.created_at.toISOString(),
  }));
}

// ──────────────────────────────────────────────
// Staff List (HR)
// ──────────────────────────────────────────────

export type StaffListItem = {
  staffId: string;
  staffCode: string;
  name: string;
  departmentName: string | null;
  positionName: string | null;
  employmentTypeName: string | null;
  employmentStatus: string;
  isActive: boolean;
};

export type StaffListFilters = {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export async function getStaffList(
  filters: StaffListFilters,
): Promise<{ data: StaffListItem[]; total: number; totalPages: number }> {
  const { search, departmentId, status, page = 1, limit = 10 } = filters;

  const where: Prisma.StaffInfoWhereInput = {};

  if (search) {
    where.staff_code = { contains: search, mode: "insensitive" };
  }

  if (departmentId) {
    where.department_id = departmentId;
  }

  if (status === "active") {
    where.is_active = true;
  } else if (status === "inactive") {
    where.is_active = false;
  }

  // exclude SUPER_ADMIN from staff list
  where.NOT = {
    staffRoles: {
      some: {
        role: { role_name: "SUPER_ADMIN" },
      },
    },
  };

  const [total, staff] = await Promise.all([
    prisma.staffInfo.count({ where }),
    prisma.staffInfo.findMany({
      where,
      include: {
        department: { select: { department_name: true } },
        position: { select: { position_name: true } },
      employmentType: { select: { name: true, thainame: true } },
      },
      orderBy: [{ is_active: "desc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: staff.map((s) => ({
      staffId: s.staff_id,
      staffCode: s.staff_code,
      name: s.name,
      departmentName: s.department?.department_name ?? null,
      positionName: s.position?.position_name ?? null,
      employmentTypeName: s.employmentType?.thainame ?? s.employmentType?.name ?? null,
      employmentStatus: s.employment_status,
      isActive: s.is_active,
    })),
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ──────────────────────────────────────────────
// Staff Master Data & Detail (HR Edit)
// ──────────────────────────────────────────────

export type StaffMasterData = {
  departments: Array<{ id: string; name: string }>;
  positions: Array<{ id: string; name: string }>;
  sections: Array<{ id: string; departmentId: string; name: string }>;
  employmentTypes: Array<{ id: string; name: string; thainame: string | null }>;
};

export type StaffDetailData = {
  staffId: string;
  staffCode: string;
  name: string;
  departmentId: string;
  departmentName: string | null;
  positionId: string;
  positionName: string | null;
  sectionId: string | null;
  sectionName: string | null;
  employmentTypeId: string | null;
  employmentTypeName: string | null;
  phoneNumber: string | null;
  email: string | null;
  dateOfBirth: string | null;
  startDate: string | null;
  employmentStatus: string;
  isActive: boolean;
};

export async function getStaffMasterData(): Promise<StaffMasterData> {
  const [departments, positions, sections, employmentTypes] = await Promise.all([
    prisma.department.findMany({
      where: { is_active: true },
      select: { department_id: true, department_name: true },
      orderBy: { department_name: "asc" },
    }),
    prisma.position.findMany({
      where: { is_active: true },
      select: { position_id: true, position_name: true },
      orderBy: { position_name: "asc" },
    }),
    prisma.section.findMany({
      where: { is_active: true },
      select: { section_id: true, section_name: true, department_id: true },
      orderBy: { section_name: "asc" },
    }),
    prisma.employmentType.findMany({
      where: { is_active: true },
      select: { employment_type_id: true, name: true, thainame: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    departments: departments.map((d) => ({ id: d.department_id, name: d.department_name })),
    positions: positions.map((p) => ({ id: p.position_id, name: p.position_name })),
    sections: sections.map((s) => ({ id: s.section_id, departmentId: s.department_id, name: s.section_name })),
    employmentTypes: employmentTypes.map((e) => ({ id: e.employment_type_id, name: e.name, thainame: e.thainame })),
  };
}

export async function getStaffDetail(id: string): Promise<StaffDetailData | null> {
  const staff = await prisma.staffInfo.findUnique({
    where: { staff_id: id },
    include: {
      department: { select: { department_id: true, department_name: true } },
      position: { select: { position_id: true, position_name: true } },
      section: { select: { section_id: true, section_name: true } },
      employmentType: { select: { employment_type_id: true, name: true, thainame: true } },
      user: { select: { email: true } },
    },
  });

  if (!staff) return null;

  return {
    staffId: staff.staff_id,
    staffCode: staff.staff_code,
    name: staff.name,
    departmentId: staff.department_id,
    departmentName: staff.department?.department_name ?? null,
    positionId: staff.position_id,
    positionName: staff.position?.position_name ?? null,
    sectionId: staff.section_id ?? null,
    sectionName: staff.section?.section_name ?? null,
    employmentTypeId: staff.employment_type_id ?? null,
    employmentTypeName: staff.employmentType?.thainame ?? staff.employmentType?.name ?? null,
    phoneNumber: staff.phoneNumber ?? null,
    email: staff.user?.email ?? null,
    dateOfBirth: staff.date_of_birth ? toDateOnly(staff.date_of_birth).toISOString().split("T")[0] : null,
    startDate: staff.start_date ? toDateOnly(staff.start_date).toISOString().split("T")[0] : null,
    employmentStatus: staff.employment_status,
    isActive: staff.is_active,
  };
}

export async function updateStaff(
  id: string,
  data: {
    name: string;
    departmentId: string;
    positionId: string;
    sectionId?: string | null;
    employmentTypeId?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
    startDate?: string | null;
    employmentStatus?: string;
  },
): Promise<StaffDetailData> {
  const updateData: Prisma.StaffInfoUpdateInput = {
    name: data.name,
    department: { connect: { department_id: data.departmentId } },
    position: { connect: { position_id: data.positionId } },
    updated_at: new Date(),
  };

  if (data.sectionId !== undefined) {
    updateData.section = data.sectionId
      ? { connect: { section_id: data.sectionId } }
      : { disconnect: true };
  }

  if (data.employmentTypeId !== undefined) {
    updateData.employmentType = data.employmentTypeId
      ? { connect: { employment_type_id: data.employmentTypeId } }
      : { disconnect: true };
  }

  if (data.phoneNumber !== undefined) {
    updateData.phoneNumber = data.phoneNumber || null;
  }

  if (data.dateOfBirth !== undefined) {
    updateData.date_of_birth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  }

  if (data.startDate !== undefined) {
    updateData.start_date = data.startDate ? new Date(data.startDate) : null;
  }

  if (data.employmentStatus !== undefined) {
    updateData.employment_status = data.employmentStatus as EmploymentStatus;
  }

  const staff = await prisma.staffInfo.update({
    where: { staff_id: id },
    data: updateData,
    include: {
      department: { select: { department_id: true, department_name: true } },
      position: { select: { position_id: true, position_name: true } },
      section: { select: { section_id: true, section_name: true } },
      employmentType: { select: { employment_type_id: true, name: true, thainame: true } },
      user: { select: { email: true } },
    },
  });

  if (data.email !== undefined) {
    if (staff.user) {
      await prisma.user.update({
        where: { staff_id: id },
        data: { email: data.email || null },
      });
    } else if (data.email) {
      const passwordHash = await hashPassword(staff.phoneNumber || randomBytes(5).toString("hex"));
      await prisma.user.create({
        data: {
          staff_id: id,
          email: data.email,
          password_hash: passwordHash,
        },
      });
    }
  }

  return {
    staffId: staff.staff_id,
    staffCode: staff.staff_code,
    name: staff.name,
    departmentId: staff.department_id,
    departmentName: staff.department?.department_name ?? null,
    positionId: staff.position_id,
    positionName: staff.position?.position_name ?? null,
    sectionId: staff.section_id ?? null,
    sectionName: staff.section?.section_name ?? null,
    employmentTypeId: staff.employment_type_id ?? null,
    employmentTypeName: staff.employmentType?.thainame ?? staff.employmentType?.name ?? null,
    phoneNumber: staff.phoneNumber ?? null,
    email: staff.user?.email ?? null,
    dateOfBirth: staff.date_of_birth ? toDateOnly(staff.date_of_birth).toISOString().split("T")[0] : null,
    startDate: staff.start_date ? toDateOnly(staff.start_date).toISOString().split("T")[0] : null,
    employmentStatus: staff.employment_status,
    isActive: staff.is_active,
  };
}

export async function createStaff(
  data: {
    staffCode: string;
    name: string;
    departmentId: string;
    positionId: string;
    sectionId?: string | null;
    employmentTypeId?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    dateOfBirth?: string | null;
    startDate?: string | null;
    employmentStatus?: string;
  },
): Promise<StaffDetailData> {
  const existing = await prisma.staffInfo.findUnique({
    where: { staff_code: data.staffCode },
    select: { staff_id: true },
  });
  if (existing) {
    throw new Error("รหัสพนักงานนี้มีอยู่ในระบบแล้ว");
  }

  const staff = await prisma.staffInfo.create({
    data: {
      staff_code: data.staffCode,
      name: data.name,
      department: { connect: { department_id: data.departmentId } },
      position: { connect: { position_id: data.positionId } },
      section: data.sectionId ? { connect: { section_id: data.sectionId } } : undefined,
      employmentType: data.employmentTypeId ? { connect: { employment_type_id: data.employmentTypeId } } : undefined,
      phoneNumber: data.phoneNumber || null,
      date_of_birth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      start_date: data.startDate ? new Date(data.startDate) : null,
      employment_status: (data.employmentStatus as EmploymentStatus) ?? "active",
    },
    include: {
      department: { select: { department_id: true, department_name: true } },
      position: { select: { position_id: true, position_name: true } },
      section: { select: { section_id: true, section_name: true } },
      employmentType: { select: { employment_type_id: true, name: true, thainame: true } },
      user: { select: { email: true } },
    },
  });

  // Default role based on position
  const posName = staff.position?.position_name?.toLowerCase() || "";
  const isApproverPos = ["general manager", "manager", "senior supervisor", "supervisor", "director"].includes(posName);
  const isEmployeePos = posName === "operator" || posName === "staff";
  const defaultRoleName = isApproverPos ? "APPROVER" : isEmployeePos ? "Employee" : "STAFF";
  let staffRole = await prisma.role.findUnique({
    where: { role_name: defaultRoleName },
    select: { role_id: true },
  });
  if (!staffRole) {
    const fallbacks: Record<string, string[]> = {
      APPROVER: ["STAFF", "Employee"],
      Employee: ["STAFF"],
      STAFF: ["Employee"],
    };
    for (const fallback of fallbacks[defaultRoleName] ?? []) {
      staffRole = await prisma.role.findUnique({
        where: { role_name: fallback },
        select: { role_id: true },
      });
      if (staffRole) break;
    }
  }
  if (staffRole) {
    await prisma.staffRole.create({
      data: { staff_id: staff.staff_id, role_id: staffRole.role_id },
    });
  }

  if (data.email && data.phoneNumber) {
    const passwordHash = await hashPassword(data.phoneNumber || randomBytes(5).toString("hex"));
    await prisma.user.upsert({
      where: { staff_id: staff.staff_id },
      create: {
        staff_id: staff.staff_id,
        email: data.email,
        password_hash: passwordHash,
      },
      update: { email: data.email },
    });
  }

  const activeLeaveTypes = await prisma.leaveType.findMany({
    where: { is_active: true },
    select: { leave_type_id: true, max_days_per_year: true },
  });
  const currentYear = new Date().getFullYear();
  for (const lt of activeLeaveTypes) {
    await prisma.userLeaveLimit.upsert({
      where: {
        staff_id_leave_type_id_year: {
          staff_id: staff.staff_id,
          leave_type_id: lt.leave_type_id,
          year: currentYear,
        },
      },
      create: {
        staff_id: staff.staff_id,
        leave_type_id: lt.leave_type_id,
        year: currentYear,
        max_days: lt.max_days_per_year ?? 0,
        used_days: 0,
      },
      update: {},
    });
  }

  return {
    staffId: staff.staff_id,
    staffCode: staff.staff_code,
    name: staff.name,
    departmentId: staff.department_id,
    departmentName: staff.department?.department_name ?? null,
    positionId: staff.position_id,
    positionName: staff.position?.position_name ?? null,
    sectionId: staff.section_id ?? null,
    sectionName: staff.section?.section_name ?? null,
    employmentTypeId: staff.employment_type_id ?? null,
    employmentTypeName: staff.employmentType?.thainame ?? staff.employmentType?.name ?? null,
    phoneNumber: staff.phoneNumber ?? null,
    email: staff.user?.email ?? null,
    dateOfBirth: staff.date_of_birth ? toDateOnly(staff.date_of_birth).toISOString().split("T")[0] : null,
    startDate: staff.start_date ? toDateOnly(staff.start_date).toISOString().split("T")[0] : null,
    employmentStatus: staff.employment_status,
    isActive: staff.is_active,
  };
}

type ImportRow = {
  staffCode: string;
  name: string;
  departmentName: string;
  positionName: string;
  sectionName?: string | null;
  employmentTypeName?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    dateOfBirth?: string | null;
  startDate?: string | null;
};

export async function importStaff(
  rows: ImportRow[],
): Promise<{ success: number; errors: { row: number; message: string }[] }> {
  const errors: { row: number; message: string }[] = [];
  let success = 0;

  await prisma.$transaction(async (tx) => {
    const activeLeaveTypes = await tx.leaveType.findMany({
      where: { is_active: true },
      select: { leave_type_id: true, max_days_per_year: true },
    });
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const existingStaff = await tx.staffInfo.findUnique({
          where: { staff_code: row.staffCode },
          select: { staff_id: true },
        });
        if (existingStaff) {
          errors.push({ row: i + 1, message: `รหัสพนักงาน ${row.staffCode} มีอยู่ในระบบแล้ว` });
          continue;
        }

        const department = await tx.department.findFirst({
          where: { department_name: { equals: row.departmentName, mode: "insensitive" } },
          select: { department_id: true },
        });
        if (!department) {
          errors.push({ row: i + 1, message: `ไม่พบแผนก ${row.departmentName}` });
          continue;
        }

        const position = await tx.position.findFirst({
          where: { position_name: { equals: row.positionName, mode: "insensitive" } },
          select: { position_id: true },
        });
        if (!position) {
          errors.push({ row: i + 1, message: `ไม่พบตำแหน่ง ${row.positionName}` });
          continue;
        }

        let sectionId: string | undefined;
        if (row.sectionName) {
          const section = await tx.section.findFirst({
            where: { section_name: { equals: row.sectionName, mode: "insensitive" }, department_id: department.department_id },
            select: { section_id: true },
          });
          if (section) sectionId = section.section_id;
        }

        let employmentTypeId: string | undefined;
        if (row.employmentTypeName) {
          const et = await tx.employmentType.findFirst({
            where: { name: { equals: row.employmentTypeName, mode: "insensitive" } },
            select: { employment_type_id: true },
          });
          if (et) employmentTypeId = et.employment_type_id;
        }

        const createdStaff = await tx.staffInfo.create({
          data: {
            staff_code: row.staffCode,
            name: row.name,
            department_id: department.department_id,
            position_id: position.position_id,
            section_id: sectionId ?? null,
            employment_type_id: employmentTypeId ?? null,
            phoneNumber: row.phoneNumber || null,
            date_of_birth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
            start_date: row.startDate ? new Date(row.startDate) : null,
            employment_status: "active",
          },
        });

        // Default role based on position
        const posName = row.positionName?.toLowerCase() || "";
        const isApproverPos = ["general manager", "manager", "senior supervisor", "supervisor", "director"].includes(posName);
        const isEmployeePos = posName === "operator" || posName === "staff";
        const defaultRoleName = isApproverPos ? "APPROVER" : isEmployeePos ? "Employee" : "STAFF";
        let staffRole = await tx.role.findUnique({
          where: { role_name: defaultRoleName },
          select: { role_id: true },
        });
        if (!staffRole) {
          const fallbacks: Record<string, string[]> = {
            APPROVER: ["STAFF", "Employee"],
            Employee: ["STAFF"],
            STAFF: ["Employee"],
          };
          for (const fallback of fallbacks[defaultRoleName] ?? []) {
            staffRole = await tx.role.findUnique({
              where: { role_name: fallback },
              select: { role_id: true },
            });
            if (staffRole) break;
          }
        }
        if (staffRole) {
          await tx.staffRole.create({
            data: { staff_id: createdStaff.staff_id, role_id: staffRole.role_id },
          });
        }

        if (row.email && row.phoneNumber) {
          const passwordHash = await hashPassword(row.phoneNumber || randomBytes(5).toString("hex"));
          await tx.user.upsert({
            where: { staff_id: createdStaff.staff_id },
            create: {
              staff_id: createdStaff.staff_id,
              email: row.email,
              password_hash: passwordHash,
            },
            update: { email: row.email },
          });
        }

        for (const lt of activeLeaveTypes) {
          await tx.userLeaveLimit.upsert({
            where: {
              staff_id_leave_type_id_year: {
                staff_id: createdStaff.staff_id,
                leave_type_id: lt.leave_type_id,
                year: currentYear,
              },
            },
            create: {
              staff_id: createdStaff.staff_id,
              leave_type_id: lt.leave_type_id,
              year: currentYear,
              max_days: lt.max_days_per_year ?? 0,
              used_days: 0,
            },
            update: {},
          });
        }

        success++;
      } catch (err) {
        errors.push({ row: i + 1, message: err instanceof Error ? err.message : "Unknown error" });
      }
    }
  });

  return { success, errors };
}

// ────────────────────────────────────
// Department CRUD
// ────────────────────────────────────

export type DepartmentListItem = {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  isActive: boolean;
  sectionCount: number;
  staffCount: number;
};

export async function getDepartments(): Promise<DepartmentListItem[]> {
  const departments = await prisma.department.findMany({
    orderBy: { department_name: "asc" },
    include: {
      _count: { select: { sections: true, staffs: true } },
    },
  });

  return departments.map((d) => ({
    departmentId: d.department_id,
    departmentCode: d.department_code,
    departmentName: d.department_name,
    isActive: d.is_active,
    sectionCount: d._count.sections,
    staffCount: d._count.staffs,
  }));
}

export async function getDepartmentById(id: string) {
  const dept = await prisma.department.findUnique({
    where: { department_id: id },
    include: {
      _count: { select: { sections: true, staffs: true } },
    },
  });
  if (!dept) return null;
  return {
    departmentId: dept.department_id,
    departmentCode: dept.department_code,
    departmentName: dept.department_name,
    isActive: dept.is_active,
    sectionCount: dept._count.sections,
    staffCount: dept._count.staffs,
  };
}

export async function createDepartment(data: {
  departmentCode: string;
  departmentName: string;
}) {
  const existing = await prisma.department.findUnique({
    where: { department_code: data.departmentCode },
    select: { department_id: true },
  });
  if (existing) {
    throw new Error("รหัสแผนกนี้มีอยู่ในระบบแล้ว");
  }

  const dept = await prisma.department.create({
    data: {
      department_code: data.departmentCode,
      department_name: data.departmentName,
    },
  });

  return {
    departmentId: dept.department_id,
    departmentCode: dept.department_code,
    departmentName: dept.department_name,
    isActive: dept.is_active,
  };
}

export async function updateDepartment(
  id: string,
  data: {
    departmentCode: string;
    departmentName: string;
  },
) {
  const existing = await prisma.department.findFirst({
    where: {
      department_code: data.departmentCode,
      department_id: { not: id },
    },
    select: { department_id: true },
  });
  if (existing) {
    throw new Error("รหัสแผนกนี้มีอยู่ในระบบแล้ว");
  }

  const dept = await prisma.department.update({
    where: { department_id: id },
    data: {
      department_code: data.departmentCode,
      department_name: data.departmentName,
      updated_at: new Date(),
    },
  });

  return {
    departmentId: dept.department_id,
    departmentCode: dept.department_code,
    departmentName: dept.department_name,
    isActive: dept.is_active,
  };
}

export async function toggleDepartmentActive(id: string, isActive: boolean) {
  const dept = await prisma.department.findUnique({
    where: { department_id: id },
    select: { department_id: true },
  });
  if (!dept) {
    throw new Error("ไม่พบแผนก");
  }

  if (!isActive) {
    const staffCount = await prisma.staffInfo.count({
      where: { department_id: id, is_active: true },
    });
    if (staffCount > 0) {
      throw new Error("ไม่สามารถปิดแผนกได้ เนื่องจากยังมีพนักงานที่ใช้งานอยู่ในแผนกนี้");
    }
  }

  await prisma.department.update({
    where: { department_id: id },
    data: {
      is_active: isActive,
      updated_at: new Date(),
    },
  });
}

// ────────────────────────────────────
// Position CRUD
// ────────────────────────────────────

export type PositionListItem = {
  positionId: string;
  positionName: string;
  positionLevel: number | null;
  isActive: boolean;
  staffCount: number;
};

export async function getPositions(): Promise<PositionListItem[]> {
  const positions = await prisma.position.findMany({
    orderBy: { position_name: "asc" },
    include: {
      _count: { select: { staffs: true } },
    },
  });

  return positions.map((p) => ({
    positionId: p.position_id,
    positionName: p.position_name,
    positionLevel: p.position_level,
    isActive: p.is_active,
    staffCount: p._count.staffs,
  }));
}

export async function getPositionById(id: string) {
  const pos = await prisma.position.findUnique({
    where: { position_id: id },
    include: {
      _count: { select: { staffs: true } },
    },
  });
  if (!pos) return null;
  return {
    positionId: pos.position_id,
    positionName: pos.position_name,
    positionLevel: pos.position_level,
    isActive: pos.is_active,
    staffCount: pos._count.staffs,
  };
}

export async function createPosition(data: {
  positionName: string;
  positionLevel?: number | null;
}) {
  const existing = await prisma.position.findUnique({
    where: { position_name: data.positionName },
    select: { position_id: true },
  });
  if (existing) {
    throw new Error("ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว");
  }

  const pos = await prisma.position.create({
    data: {
      position_name: data.positionName,
      position_level: data.positionLevel ?? null,
    },
  });

  return {
    positionId: pos.position_id,
    positionName: pos.position_name,
    positionLevel: pos.position_level,
    isActive: pos.is_active,
  };
}

export async function updatePosition(
  id: string,
  data: {
    positionName: string;
    positionLevel?: number | null;
  },
) {
  const existing = await prisma.position.findFirst({
    where: {
      position_name: data.positionName,
      position_id: { not: id },
    },
    select: { position_id: true },
  });
  if (existing) {
    throw new Error("ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว");
  }

  const pos = await prisma.position.update({
    where: { position_id: id },
    data: {
      position_name: data.positionName,
      position_level: data.positionLevel ?? null,
      updated_at: new Date(),
    },
  });

  return {
    positionId: pos.position_id,
    positionName: pos.position_name,
    positionLevel: pos.position_level,
    isActive: pos.is_active,
  };
}

export async function togglePositionActive(id: string, isActive: boolean) {
  const pos = await prisma.position.findUnique({
    where: { position_id: id },
    select: { position_id: true },
  });
  if (!pos) {
    throw new Error("ไม่พบตำแหน่ง");
  }

  if (!isActive) {
    const staffCount = await prisma.staffInfo.count({
      where: { position_id: id, is_active: true },
    });
    if (staffCount > 0) {
      throw new Error("ไม่สามารถปิดตำแหน่งได้ เนื่องจากยังมีพนักงานที่ใช้งานอยู่ในตำแหน่งนี้");
    }
  }

  await prisma.position.update({
    where: { position_id: id },
    data: {
      is_active: isActive,
      updated_at: new Date(),
    },
  });
}

// ────────────────────────────────────
// LeaveType CRUD
// ────────────────────────────────────

export type LeaveTypeListItem = {
  leaveTypeId: string;
  leaveTypeName: string;
  maxDaysPerYear: number | null;
  isPaid: boolean;
  requiresAttachment: boolean;
  isActive: boolean;
  leaveCaseCount: number;
  leaveCount: number;
};

export async function getLeaveTypes(): Promise<LeaveTypeListItem[]> {
  const types = await prisma.leaveType.findMany({
    orderBy: { leave_type_name: "asc" },
    include: {
      _count: { select: { leaveCases: true, leaves: true } },
    },
  });

  return types.map((t) => ({
    leaveTypeId: t.leave_type_id,
    leaveTypeName: t.leave_type_name,
    maxDaysPerYear: t.max_days_per_year,
    isPaid: t.is_paid,
    requiresAttachment: t.requires_attachment,
    isActive: t.is_active,
    leaveCaseCount: t._count.leaveCases,
    leaveCount: t._count.leaves,
  }));
}

export async function getLeaveTypeById(id: string) {
  const lt = await prisma.leaveType.findUnique({
    where: { leave_type_id: id },
    include: {
      _count: { select: { leaveCases: true, leaves: true } },
    },
  });
  if (!lt) return null;
  return {
    leaveTypeId: lt.leave_type_id,
    leaveTypeName: lt.leave_type_name,
    maxDaysPerYear: lt.max_days_per_year,
    isPaid: lt.is_paid,
    requiresAttachment: lt.requires_attachment,
    isActive: lt.is_active,
    leaveCaseCount: lt._count.leaveCases,
    leaveCount: lt._count.leaves,
  };
}

export async function createLeaveType(data: {
  leaveTypeName: string;
  maxDaysPerYear?: number | null;
  isPaid?: boolean;
  requiresAttachment?: boolean;
}) {
  const existing = await prisma.leaveType.findUnique({
    where: { leave_type_name: data.leaveTypeName },
    select: { leave_type_id: true },
  });
  if (existing) {
    throw new Error("ชื่อประเภทการลานี้มีอยู่ในระบบแล้ว");
  }

  const lt = await prisma.leaveType.create({
    data: {
      leave_type_name: data.leaveTypeName,
      max_days_per_year: data.maxDaysPerYear ?? null,
      is_paid: data.isPaid ?? true,
      requires_attachment: data.requiresAttachment ?? false,
    },
  });

  return {
    leaveTypeId: lt.leave_type_id,
    leaveTypeName: lt.leave_type_name,
    maxDaysPerYear: lt.max_days_per_year,
    isPaid: lt.is_paid,
    requiresAttachment: lt.requires_attachment,
    isActive: lt.is_active,
  };
}

export async function updateLeaveType(
  id: string,
  data: {
    leaveTypeName: string;
    maxDaysPerYear?: number | null;
    isPaid?: boolean;
    requiresAttachment?: boolean;
  },
) {
  const existing = await prisma.leaveType.findFirst({
    where: {
      leave_type_name: data.leaveTypeName,
      leave_type_id: { not: id },
    },
    select: { leave_type_id: true },
  });
  if (existing) {
    throw new Error("ชื่อประเภทการลานี้มีอยู่ในระบบแล้ว");
  }

  const lt = await prisma.leaveType.update({
    where: { leave_type_id: id },
    data: {
      leave_type_name: data.leaveTypeName,
      max_days_per_year: data.maxDaysPerYear ?? null,
      is_paid: data.isPaid ?? true,
      requires_attachment: data.requiresAttachment ?? false,
      updated_at: new Date(),
    },
  });

  return {
    leaveTypeId: lt.leave_type_id,
    leaveTypeName: lt.leave_type_name,
    maxDaysPerYear: lt.max_days_per_year,
    isPaid: lt.is_paid,
    requiresAttachment: lt.requires_attachment,
    isActive: lt.is_active,
  };
}

export async function toggleLeaveTypeActive(id: string, isActive: boolean) {
  const lt = await prisma.leaveType.findUnique({
    where: { leave_type_id: id },
    select: { leave_type_id: true },
  });
  if (!lt) {
    throw new Error("ไม่พบประเภทการลา");
  }

  if (!isActive) {
    const caseCount = await prisma.leaveCase.count({
      where: { leave_type_id: id, is_active: true },
    });
    if (caseCount > 0) {
      throw new Error("ไม่สามารถปิดประเภทการลาได้ เนื่องจากยังมีกรณีการลาที่ใช้งานอยู่");
    }
  }

  await prisma.leaveType.update({
    where: { leave_type_id: id },
    data: {
      is_active: isActive,
      updated_at: new Date(),
    },
  });
}

// ────────────────────────────────────
// LeaveCase CRUD
// ────────────────────────────────────

export type LeaveCaseListItem = {
  leaveCaseId: string;
  caseName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  isActive: boolean;
  leaveCount: number;
};

export async function getLeaveCases(): Promise<LeaveCaseListItem[]> {
  const cases = await prisma.leaveCase.findMany({
    orderBy: [{ leave_type_id: "asc" }, { case_name: "asc" }],
    include: {
      leaveType: { select: { leave_type_name: true } },
      _count: { select: { leaves: true } },
    },
  });

  return cases.map((c) => ({
    leaveCaseId: c.leave_case_id,
    caseName: c.case_name,
    leaveTypeId: c.leave_type_id,
    leaveTypeName: c.leaveType.leave_type_name,
    isActive: c.is_active,
    leaveCount: c._count.leaves,
  }));
}

export async function getLeaveCaseById(id: string) {
  const c = await prisma.leaveCase.findUnique({
    where: { leave_case_id: id },
    include: {
      leaveType: { select: { leave_type_name: true } },
      _count: { select: { leaves: true } },
    },
  });
  if (!c) return null;
  return {
    leaveCaseId: c.leave_case_id,
    caseName: c.case_name,
    leaveTypeId: c.leave_type_id,
    leaveTypeName: c.leaveType.leave_type_name,
    isActive: c.is_active,
    leaveCount: c._count.leaves,
  };
}

export async function createLeaveCase(data: {
  leaveTypeId: string;
  caseName: string;
}) {
  const existing = await prisma.leaveCase.findUnique({
    where: { leave_type_id_case_name: { leave_type_id: data.leaveTypeId, case_name: data.caseName } },
    select: { leave_case_id: true },
  });
  if (existing) {
    throw new Error("กรณีการลานี้มีอยู่ในระบบแล้วสำหรับประเภทการลาที่เลือก");
  }

  const c = await prisma.leaveCase.create({
    data: {
      leave_type_id: data.leaveTypeId,
      case_name: data.caseName,
    },
  });

  return {
    leaveCaseId: c.leave_case_id,
    caseName: c.case_name,
    leaveTypeId: c.leave_type_id,
    isActive: c.is_active,
  };
}

export async function updateLeaveCase(
  id: string,
  data: {
    leaveTypeId: string;
    caseName: string;
  },
) {
  const existing = await prisma.leaveCase.findFirst({
    where: {
      leave_type_id: data.leaveTypeId,
      case_name: data.caseName,
      leave_case_id: { not: id },
    },
    select: { leave_case_id: true },
  });
  if (existing) {
    throw new Error("กรณีการลานี้มีอยู่ในระบบแล้วสำหรับประเภทการลาที่เลือก");
  }

  const c = await prisma.leaveCase.update({
    where: { leave_case_id: id },
    data: {
      leave_type_id: data.leaveTypeId,
      case_name: data.caseName,
      updated_at: new Date(),
    },
  });

  return {
    leaveCaseId: c.leave_case_id,
    caseName: c.case_name,
    leaveTypeId: c.leave_type_id,
    isActive: c.is_active,
  };
}

export async function toggleLeaveCaseActive(id: string, isActive: boolean) {
  const c = await prisma.leaveCase.findUnique({
    where: { leave_case_id: id },
    select: { leave_case_id: true },
  });
  if (!c) {
    throw new Error("ไม่พบกรณีการลา");
  }

  if (!isActive) {
    const leaveCount = await prisma.dataLeave.count({
      where: { leave_case_id: id },
    });
    if (leaveCount > 0) {
      throw new Error("ไม่สามารถปิดกรณีการลาได้ เนื่องจากมีใบลาที่ใช้งานอยู่");
    }
  }

  await prisma.leaveCase.update({
    where: { leave_case_id: id },
    data: {
      is_active: isActive,
      updated_at: new Date(),
    },
  });
}

// ────────────────────────────────────
// EmploymentType CRUD
// ────────────────────────────────────

export type EmploymentTypeListItem = {
  employmentTypeId: string;
  code: string;
  name: string;
  thainame: string | null;
  description: string | null;
  isActive: boolean;
  staffCount: number;
};

export async function getEmploymentTypes(): Promise<EmploymentTypeListItem[]> {
  const types = await prisma.employmentType.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { staffs: true } },
    },
  });

  return types.map((t) => ({
    employmentTypeId: t.employment_type_id,
    code: t.code,
    name: t.name,
    thainame: t.thainame,
    description: t.description,
    isActive: t.is_active,
    staffCount: t._count.staffs,
  }));
}

export async function getEmploymentTypeById(id: string) {
  const et = await prisma.employmentType.findUnique({
    where: { employment_type_id: id },
    include: {
      _count: { select: { staffs: true } },
    },
  });
  if (!et) return null;
  return {
    employmentTypeId: et.employment_type_id,
    code: et.code,
    name: et.name,
    thainame: et.thainame,
    description: et.description,
    isActive: et.is_active,
    staffCount: et._count.staffs,
  };
}

export async function createEmploymentType(data: {
  name: string;
  thainame?: string | null;
  description?: string | null;
}) {
  const existingName = await prisma.employmentType.findUnique({
    where: { name: data.name },
    select: { employment_type_id: true },
  });
  if (existingName) {
    throw new Error("ชื่อประเภทพนักงานนี้มีอยู่ในระบบแล้ว");
  }

  if (data.thainame) {
    const existingThainame = await prisma.employmentType.findUnique({
      where: { thainame: data.thainame },
      select: { employment_type_id: true },
    });
    if (existingThainame) {
      throw new Error("ชื่อภาษาไทยประเภทพนักงานนี้มีอยู่ในระบบแล้ว");
    }
  }

  // auto-generate code as running number
  const lastCode = await prisma.employmentType.findFirst({
    orderBy: { code: "desc" },
    select: { code: true },
  });
  let nextNum = 1;
  if (lastCode) {
    const match = lastCode.code.match(/(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const code = `EMP${String(nextNum).padStart(3, "0")}`;

  const et = await prisma.employmentType.create({
    data: {
      code,
      name: data.name,
      thainame: data.thainame ?? null,
      description: data.description ?? null,
    },
  });

  return {
    employmentTypeId: et.employment_type_id,
    code: et.code,
    name: et.name,
    thainame: et.thainame,
    description: et.description,
    isActive: et.is_active,
  };
}

export async function updateEmploymentType(
  id: string,
  data: {
    name: string;
    thainame?: string | null;
    description?: string | null;
  },
) {
  const existingName = await prisma.employmentType.findFirst({
    where: {
      name: data.name,
      employment_type_id: { not: id },
    },
    select: { employment_type_id: true },
  });
  if (existingName) {
    throw new Error("ชื่อประเภทพนักงานนี้มีอยู่ในระบบแล้ว");
  }

  if (data.thainame) {
    const existingThainame = await prisma.employmentType.findFirst({
      where: {
        thainame: data.thainame,
        employment_type_id: { not: id },
      },
      select: { employment_type_id: true },
    });
    if (existingThainame) {
      throw new Error("ชื่อภาษาไทยประเภทพนักงานนี้มีอยู่ในระบบแล้ว");
    }
  }

  const et = await prisma.employmentType.update({
    where: { employment_type_id: id },
    data: {
      name: data.name,
      thainame: data.thainame ?? null,
      description: data.description ?? null,
      updated_at: new Date(),
    },
  });

  return {
    employmentTypeId: et.employment_type_id,
    code: et.code,
    name: et.name,
    thainame: et.thainame,
    description: et.description,
    isActive: et.is_active,
  };
}

export async function toggleEmploymentTypeActive(id: string, isActive: boolean) {
  const et = await prisma.employmentType.findUnique({
    where: { employment_type_id: id },
    select: { employment_type_id: true },
  });
  if (!et) {
    throw new Error("ไม่พบประเภทพนักงาน");
  }

  if (!isActive) {
    const staffCount = await prisma.staffInfo.count({
      where: { employment_type_id: id, is_active: true },
    });
    if (staffCount > 0) {
      throw new Error("ไม่สามารถปิดประเภทพนักงานได้ เนื่องจากยังมีพนักงานที่ใช้งานอยู่");
    }
  }

  await prisma.employmentType.update({
    where: { employment_type_id: id },
    data: {
      is_active: isActive,
      updated_at: new Date(),
    },
  });
}

// ──────────────────────────────────────────────
// Leave Report (HR)
// ──────────────────────────────────────────────

export type LeaveReportRecord = {
  leaveId: string;
  staffCode: string;
  staffName: string;
  departmentName: string | null;
  leaveTypeName: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: string | null;
  status: LeaveStatus;
  createdAt: string;
};

export type LeaveReportFilters = {
  search?: string;
  departmentId?: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export type LeaveReportResult = {
  data: LeaveReportRecord[];
  total: number;
  approved: number;
  rejected: number;
  cancelled: number;
  page: number;
  totalPages: number;
  limit: number;
};

export async function getLeaveReport(
  filters: LeaveReportFilters,
): Promise<LeaveReportResult> {
  const {
    search,
    departmentId,
    leaveTypeId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = filters;

  const where: Prisma.DataLeaveWhereInput = {
    leave_status: {
      in: [LeaveStatus.approved, LeaveStatus.rejected, LeaveStatus.cancelled],
    },
  };

  const staffWhere: Prisma.StaffInfoWhereInput = {};

  if (departmentId) {
    staffWhere.department_id = departmentId;
  }

  if (search) {
    staffWhere.OR = [
      { staff_code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (Object.keys(staffWhere).length > 0) {
    where.staff = staffWhere;
  }

  if (leaveTypeId) {
    where.leave_type_id = leaveTypeId;
  }

  if (startDate) {
    where.start_date = {
      gte: new Date(`${startDate}T00:00:00.000Z`),
    };
  }

  if (endDate) {
    where.start_date = {
      ...(where.start_date as object),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    };
  }

  const [data, countGroup] = await Promise.all([
    prisma.dataLeave.findMany({
      where,
      include: {
        staff: {
          select: {
            staff_code: true,
            name: true,
            department: { select: { department_name: true } },
          },
        },
        leaveType: { select: { leave_type_name: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dataLeave.groupBy({
      by: ["leave_status"],
      where,
      _count: true,
    }),
  ]);

  const total = countGroup.reduce((sum, g) => sum + g._count, 0);
  const approved = countGroup.find((g) => g.leave_status === LeaveStatus.approved)?._count ?? 0;
  const rejected = countGroup.find((g) => g.leave_status === LeaveStatus.rejected)?._count ?? 0;
  const cancelled = countGroup.find((g) => g.leave_status === LeaveStatus.cancelled)?._count ?? 0;

  return {
    data: data.map((item) => ({
      leaveId: item.leave_id,
      staffCode: item.staff.staff_code,
      staffName: item.staff.name,
      departmentName: item.staff.department?.department_name ?? null,
      leaveTypeName: item.leaveType.leave_type_name,
      startDate: item.start_date?.toISOString() ?? null,
      endDate: item.end_date?.toISOString() ?? null,
      totalDays: item.total_days?.toString() ?? null,
      status: item.leave_status,
      createdAt: item.created_at.toISOString(),
    })),
    total,
    approved,
    rejected,
    cancelled,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
}

// ──────────────────────────────────────────────
// Workflow Display (HR)
// ──────────────────────────────────────────────

export type WorkflowStepDisplay = {
  level: number;
  approverType: string;
  approverLabel: string;
  isRequired: boolean;
};

export type WorkflowDisplayItem = {
  workflowId: string;
  positionName: string;
  positionLevel: number | null;
  isActive: boolean;
  steps: WorkflowStepDisplay[];
};

export async function getWorkflows(): Promise<WorkflowDisplayItem[]> {
  const workflows = await prisma.leaveWorkflow.findMany({
    include: {
      position: { select: { position_name: true, position_level: true } },
      steps: { orderBy: { approval_level: "asc" } },
    },
    orderBy: { position: { position_level: "asc" } },
  });

  return workflows.map((wf) => ({
    workflowId: wf.workflow_id,
    positionName: wf.position.position_name,
    positionLevel: wf.position.position_level,
    isActive: wf.is_active,
    steps: wf.steps.map((step) => ({
      level: step.approval_level,
      approverType: step.approver_type,
      approverLabel: APPROVER_TYPE_LABELS[step.approver_type] ?? step.approver_type,
      isRequired: step.is_required,
    })),
  }));
}

// ──────────────────────────────────────────────
// Workflow Edit (HR)
// ──────────────────────────────────────────────

export type WorkflowDetailItem = {
  workflowId: string;
  positionName: string;
  positionLevel: number | null;
  isActive: boolean;
  workflowName: string;
  steps: {
    workflowStepId: string;
    level: number;
    approverType: string;
    approverLabel: string;
    isRequired: boolean;
  }[];
};

export async function getWorkflowById(
  id: string
): Promise<WorkflowDetailItem | null> {
  const workflow = await prisma.leaveWorkflow.findUnique({
    where: { workflow_id: id },
    include: {
      position: { select: { position_name: true, position_level: true } },
      steps: { orderBy: { approval_level: "asc" } },
    },
  });

  if (!workflow) return null;

  return {
    workflowId: workflow.workflow_id,
    positionName: workflow.position.position_name,
    positionLevel: workflow.position.position_level,
    isActive: workflow.is_active,
    workflowName: workflow.workflow_name,
    steps: workflow.steps.map((step) => ({
      workflowStepId: step.workflow_step_id,
      level: step.approval_level,
      approverType: step.approver_type,
      approverLabel: APPROVER_TYPE_LABELS[step.approver_type] ?? step.approver_type,
      isRequired: step.is_required,
    })),
  };
}

export async function updateWorkflowSteps(
  id: string,
  steps: { approverType: ApproverType; isRequired: boolean }[]
) {
  return prisma.$transaction(async (tx) => {
    await tx.leaveWorkflowStep.deleteMany({
      where: { workflow_id: id },
    });

    const created = await Promise.all(
      steps.map((step, index) =>
        tx.leaveWorkflowStep.create({
          data: {
            workflow_id: id,
            approval_level: index + 1,
            approver_type: step.approverType,
            is_required: step.isRequired,
          },
        })
      )
    );

    return created;
  });
}

// ──────────────────────────────────────────────
// Workflow Create (HR)
// ──────────────────────────────────────────────

export type AvailablePositionItem = {
  positionId: string;
  positionName: string;
  positionLevel: number | null;
};

export async function getAvailableWorkflowPositions(): Promise<AvailablePositionItem[]> {
  const positions = await prisma.position.findMany({
    where: { workflow: null, is_active: true },
    select: { position_id: true, position_name: true, position_level: true },
    orderBy: { position_level: "asc" },
  });

  return positions.map((p) => ({
    positionId: p.position_id,
    positionName: p.position_name,
    positionLevel: p.position_level,
  }));
}

export async function createWorkflow(
  data: { positionId: string; steps: { approverType: ApproverType; isRequired: boolean }[] }
) {
  const existing = await prisma.leaveWorkflow.findUnique({
    where: { position_id: data.positionId },
    select: { workflow_id: true },
  });
  if (existing) {
    throw new Error("ตำแหน่งนี้มีลำดับการอนุมัติแล้ว");
  }

  const position = await prisma.position.findUnique({
    where: { position_id: data.positionId },
    select: { position_name: true },
  });
  if (!position) {
    throw new Error("ไม่พบตำแหน่ง");
  }

  return prisma.$transaction(async (tx) => {
    const workflow = await tx.leaveWorkflow.create({
      data: {
        position_id: data.positionId,
        workflow_name: `Workflow - ${position.position_name}`,
        is_active: true,
      },
    });

    const steps = await Promise.all(
      data.steps.map((step, index) =>
        tx.leaveWorkflowStep.create({
          data: {
            workflow_id: workflow.workflow_id,
            approval_level: index + 1,
            approver_type: step.approverType,
            is_required: step.isRequired,
          },
        })
      )
    );

    return { workflowId: workflow.workflow_id, steps };
  });
}

// ────────────────────────────────────
// Role Management
// ────────────────────────────────────

export type RoleItem = {
  roleId: string;
  roleName: string;
  isActive: boolean;
};

export type StaffWithRolesItem = {
  staffId: string;
  staffCode: string;
  name: string;
  departmentName: string | null;
  roles: string[];
};

export async function getAllRoles(): Promise<RoleItem[]> {
  const roles = await prisma.role.findMany({
    where: { is_active: true },
    orderBy: { role_name: "asc" },
  });
  return roles.map((r) => ({
    roleId: r.role_id,
    roleName: r.role_name,
    isActive: r.is_active,
  }));
}

export async function getStaffRoleList(): Promise<StaffWithRolesItem[]> {
  const staff = await prisma.staffInfo.findMany({
    include: {
      department: { select: { department_name: true } },
      staffRoles: {
        include: { role: { select: { role_name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return staff.map((s) => ({
    staffId: s.staff_id,
    staffCode: s.staff_code,
    name: s.name,
    departmentName: s.department?.department_name ?? null,
    roles: s.staffRoles.map((sr) => sr.role.role_name),
  }));
}

export async function updateStaffRoles(
  staffId: string,
  roleNames: string[],
  currentStaffId: string,
) {
  if (staffId === currentStaffId && !roleNames.includes("SUPER_ADMIN")) {
    throw new Error("ไม่สามารถถอดสิทธิ์ SUPER_ADMIN ของตัวเองได้");
  }

  if (roleNames.includes("SUPER_ADMIN")) {
    const currentUserRoles = await prisma.staffRole.findMany({
      where: { staff_id: currentStaffId },
      include: { role: { select: { role_name: true } } },
    });
    const isSuperAdmin = currentUserRoles.some((r) => r.role.role_name === "SUPER_ADMIN");
    if (!isSuperAdmin) {
      throw new Error("เฉพาะ SUPER_ADMIN เท่านั้นที่สามารถให้สิทธิ์ SUPER_ADMIN ได้");
    }
  }

  const allRoles = await prisma.role.findMany();
  const roles = allRoles.filter((r) =>
    roleNames.some((n) => r.role_name.toUpperCase() === n.toUpperCase())
  );

  await prisma.staffRole.deleteMany({
    where: { staff_id: staffId },
  });

  if (roles.length > 0) {
    await prisma.staffRole.createMany({
      data: roles.map((r) => ({
        staff_id: staffId,
        role_id: r.role_id,
      })),
    });
  }
}
