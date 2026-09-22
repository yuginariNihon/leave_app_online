import { LeaveStatus, ApprovalStatus, Prisma, LeavePeriod } from "@/lib/generated/prisma/client";
import type { ApproverType } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { LeaveFormOptions } from "@/lib/TypeSchema";
import z from "zod";
import { toDateOnly, countInclusiveDays, buildLeaveReferenceId } from "@/lib/utils";
import { checkApproversExist, APPROVER_TYPE_LABELS, APPROVER_POSITION_NAMES } from "@/lib/services/approverUtils";
import { updateUsedDaysOnApproval } from "@/lib/services/approvalService";
import { invalidateDashboardKpi } from "@/lib/services/dashboardService";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";

const SUPERVISOR_POSITION_NAMES = new Set([
  ...APPROVER_POSITION_NAMES.Supervisor,
  ...APPROVER_POSITION_NAMES.Senior_Supervisor,
]);

export class LeaveRequestValidationError extends ValidationError {}
export type CreateLeaveRequestInput = {
  staffId: string;
  leaveTypeId: string;
  leaveCaseId: string;
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
  totalDays?: number;
  leavePeriod?: string;
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
 * Determines whether two leave periods genuinely overlap on the same date.
 * A full_day conflicts with any period; morning + afternoon do not conflict.
 */
function periodsOverlap(a: LeavePeriod | undefined, b: LeavePeriod | undefined): boolean {
  const pa = a ?? "full_day";
  const pb = b ?? "full_day";
  if (pa === "full_day" || pb === "full_day") return true;
  return pa === pb;
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

  if (!staff) throw new NotFoundError("Staff not found.");

  // ตรวจสอบการทับซ้อนของช่วงเวลาลาที่มีสถานะ pending/approved อยู่แล้ว
  // (morning + afternoon ในวันเดียวกันไม่ถือว่าทับซ้อนกัน)
  const overlapLeaves = await prisma.dataLeave.findMany({
    where: {
      staff_id: input.staffId,
      leave_status: { in: [LeaveStatus.pending, LeaveStatus.approved] },
      start_date: { lte: endDate },
      end_date: { gte: startDate },
    },
    select: { leave_id: true, leave_period: true },
  });
  if (overlapLeaves.some((o) => periodsOverlap(input.leavePeriod as LeavePeriod | undefined, o.leave_period))) {
    throw new LeaveRequestValidationError("คุณมีคำขอลาที่ได้รับการอนุมัติแล้วหรือกำลังรอการอนุมัติในช่วงเวลานี้");
  }

  // 2. Find workflow by position (1-to-1 schema)
  const workflow = await prisma.leaveWorkflow.findFirst({
    where: {
      position_id: staff.position_id,
      is_active: true,
    },
    include: { steps: { orderBy: { approval_level: "asc" } } },
  });

  if (!workflow) {
    throw new NotFoundError("No active workflow found for your position.");
  }

  // 3. Determine auto-skip for each step (sequential: stop after first pending)
  const approverTypes = workflow.steps.map((step) => step.approver_type);
  const approverResults = await checkApproversExist(
    input.staffId,
    staff.department_id,
    approverTypes,
  );
  const stepStatuses = workflow.steps.map((step, i) => ({
    step,
    hasApprover: approverResults[i],
    isAutoApproved: false,
  }));

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
        leave_period: input.leavePeriod as LeavePeriod,
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

  invalidateDashboardKpi();
  return leave;
}

export type UpdateLeaveRequestInput = {
  leaveTypeId: string;
  leaveCaseId: string;
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
  totalDays?: number;
  leavePeriod?: string;
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
    throw new NotFoundError(
      "Leave not found, not owned by you, or is not in pending status.",
    );
  }

  const startDate = toDateOnly(input.startDate);
  const endDate = toDateOnly(input.endDate);
  const totalDays = input.totalDays ?? countInclusiveDays(startDate, endDate);

  // ตรวจสอบการทับซ้อนของช่วงเวลาลากับใบลาอื่น (ไม่รวมใบปัจจุบัน)
  // (morning + afternoon ในวันเดียวกันไม่ถือว่าทับซ้อนกัน)
  const overlapLeaves = await prisma.dataLeave.findMany({
    where: {
      staff_id: staffId,
      leave_id: { not: leaveId },
      leave_status: { in: [LeaveStatus.pending, LeaveStatus.approved] },
      start_date: { lte: endDate },
      end_date: { gte: startDate },
    },
    select: { leave_id: true, leave_period: true },
  });
  if (overlapLeaves.some((o) => periodsOverlap(input.leavePeriod as LeavePeriod | undefined, o.leave_period))) {
    throw new LeaveRequestValidationError("คุณมีคำขอลาที่ได้รับการอนุมัติแล้วหรือกำลังรอการอนุมัติในช่วงเวลานี้");
  }

  const updated = await prisma.dataLeave.update({
    where: { leave_id: leaveId },
    data: {
      leave_type_id: input.leaveTypeId,
      leave_case_id: input.leaveCaseId,
      start_date: startDate,
      end_date: endDate,
      total_days: new Prisma.Decimal(totalDays),
      leave_period: input.leavePeriod as LeavePeriod | undefined,
      reason: input.reason,
      updated_at: new Date(),
    },
  });
  invalidateDashboardKpi();
  return updated;
}

export async function cancelLeaveRequest(leaveId: string, staffId: string, cancelReason?: string) {
  const leave = await prisma.dataLeave.findFirst({
    where: {
      leave_id: leaveId,
      staff_id: staffId,
      leave_status: LeaveStatus.pending,
    },
    select: { leave_id: true },
  });

  if (!leave) {
    throw new NotFoundError(
      "Leave not found, not owned by you, or already processed.",
    );
  }

  const [updatedLeave] = await prisma.$transaction([
    prisma.dataLeave.update({
      where: { leave_id: leaveId },
      data: {
        leave_status: LeaveStatus.cancelled,
        cancelled_at: new Date(),
        cancel_reason: cancelReason || null,
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

  invalidateDashboardKpi();
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
  referenceId: string;
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
    const statusFilter = z.enum(["pending", "approved", "rejected", "cancelled"]).safeParse(status);
    if (statusFilter.success) {
      where.leave_status = statusFilter.data;
    }
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
      referenceId: buildLeaveReferenceId(item.leave_id),
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
  leavePeriod: string;
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
  cancelReason: string | null;
  supervisor: { name: string; role: string } | null;
  quota: { remaining: number; total: number; percent: number } | null;
};

export async function getLeaveDetailById(
  leaveId: string,
  sessionStaffId: string,
  sessionRoles: string[],
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

  // Authorization guard (always enforced)
  const isOwner = leave.staff_id === sessionStaffId;
  const isHR = sessionRoles.some((r) => r === "HR" || r === "SUPER_ADMIN");
  let isSupervisor = false;
  let isDeptSupervisor = false;
  let isApprover = false;

  const pendingApprovals = leave.approvals.filter(
    (a) => a.approval_status === ApprovalStatus.pending,
  );

  if (!isOwner && !isHR) {
    const supervisorRecord = await prisma.staffSupervisor.findUnique({
      where: {
        staff_id_supervisor_id: {
          staff_id: leave.staff_id,
          supervisor_id: sessionStaffId,
        },
      },
    });
    isSupervisor = !!supervisorRecord;

    if (isSupervisor === false) {
      const userStaff = await prisma.staffInfo.findUnique({
        where: { staff_id: sessionStaffId },
        select: {
          department_id: true,
          position: { select: { position_name: true } },
        },
      });
      const positionName = userStaff?.position?.position_name ?? null;
      const sameDepartment =
        userStaff?.department_id != null &&
        leave.staff.department_id === userStaff.department_id;

      // Department supervisor positions can view every leave (pending and
      // approved) within their own department.
      isDeptSupervisor =
        sameDepartment &&
        positionName != null &&
        SUPERVISOR_POSITION_NAMES.has(positionName);

      // Assigned/former approver on this leave (approval history).
      if (leave.approvals.some((a) => a.approver_id === sessionStaffId)) {
        isApprover = true;
      }

      // User's position maps to an approvable pending level (pending list),
      // same department only.
      if (
        !isDeptSupervisor &&
        !isApprover &&
        positionName &&
        sameDepartment &&
        pendingApprovals.length > 0
      ) {
        const approvableTypes = Object.entries(APPROVER_POSITION_NAMES)
          .filter(([, names]) => names.includes(positionName))
          .map(([type]) => type) as ApproverType[];

        if (approvableTypes.length > 0) {
          const steps = await prisma.leaveWorkflowStep.findMany({
            where: { approver_type: { in: approvableTypes } },
            select: { approval_level: true },
          });
          const approvableLevels = new Set(
            steps.map((s) => s.approval_level),
          );
          isApprover = pendingApprovals.some((a) =>
            approvableLevels.has(a.approval_level),
          );
        }
      }
    }
  }

  if (!isOwner && !isHR && !isSupervisor && !isDeptSupervisor && !isApprover) {
    throw new ForbiddenError("Forbidden");
  }

  // Fetch workflow steps to get position names for pending approvals + leave quota in parallel
  const currentYear = new Date().getFullYear();
  const [workflow, leaveLimit] = await Promise.all([
    prisma.leaveWorkflow.findFirst({
      where: { position_id: leave.staff.position_id, is_active: true },
      include: { steps: { select: { approval_level: true, approver_type: true } } },
    }),
    prisma.userLeaveLimit.findUnique({
      where: {
        staff_id_leave_type_id_year: {
          staff_id: leave.staff_id,
          leave_type_id: leave.leave_type_id,
          year: currentYear,
        },
      },
      select: { max_days: true, used_days: true },
    }),
  ]);

  return {
    leaveId: leave.leave_id,
    referenceId: `#LV-${leave.leave_id.slice(0, 8).toUpperCase()}`,
    status: leave.leave_status,
    reason: leave.reason,
    totalDays: Number(leave.total_days ?? 0),
    createdAt: leave.created_at.toISOString(),
    startDate: leave.start_date?.toISOString() ?? null,
    endDate: leave.end_date?.toISOString() ?? null,
    leavePeriod: leave.leave_period ?? "full_day",
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
    cancelReason: leave.cancel_reason ?? null,
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

export function getVacationEntitlement(yearsOfService: number): number {
  if (yearsOfService < 1) return 0;
  if (yearsOfService <= 3) return 6;
  if (yearsOfService <= 6) return 8;
  return 10;
}

export async function syncVacationLeaveLimit(
  staffId: string,
  year: number,
  vacationTypeId: string,
  startDate: Date,
) {
  const yearsOfService = Math.floor((Date.now() - startDate.getTime()) / (365.25 * 86400000));
  const entitlement = getVacationEntitlement(yearsOfService);

  if (entitlement === 0) {
    await prisma.userLeaveLimit.upsert({
      where: { staff_id_leave_type_id_year: { staff_id: staffId, leave_type_id: vacationTypeId, year } },
      create: { staff_id: staffId, leave_type_id: vacationTypeId, year, max_days: 0, used_days: 0 },
      update: { max_days: 0, used_days: 0 },
    });
    return;
  }

  const prevLimit = await prisma.userLeaveLimit.findUnique({
    where: { staff_id_leave_type_id_year: { staff_id: staffId, leave_type_id: vacationTypeId, year: year - 1 } },
    select: { max_days: true, used_days: true },
  });

  let carry = 0;
  if (prevLimit) {
    const unused = Math.max(0, Number(prevLimit.max_days) - Number(prevLimit.used_days));
    carry = Math.min(unused, 6);
  }

  const total = entitlement + carry;

  await prisma.userLeaveLimit.upsert({
    where: { staff_id_leave_type_id_year: { staff_id: staffId, leave_type_id: vacationTypeId, year } },
    create: { staff_id: staffId, leave_type_id: vacationTypeId, year, max_days: total, used_days: 0 },
    update: { max_days: total, used_days: 0 },
  });
}

export async function syncLeaveLimit(
  staffId: string,
  year: number,
  leaveTypeId: string,
  maxDays: number,
) {
  await prisma.userLeaveLimit.upsert({
    where: { staff_id_leave_type_id_year: { staff_id: staffId, leave_type_id: leaveTypeId, year } },
    create: { staff_id: staffId, leave_type_id: leaveTypeId, year, max_days: maxDays, used_days: 0 },
    update: { max_days: maxDays, used_days: 0 },
  });
}

export * from "@/lib/services/staffService";
export * from "@/lib/services/masterDataService";
export * from "@/lib/services/roleService";
export * from "@/lib/services/workflowService";
export * from "@/lib/services/profileService";
export * from "@/lib/services/userService";
