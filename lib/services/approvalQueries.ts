import { ApprovalStatus, LeaveStatus, Prisma, EmploymentStatus } from "@/lib/generated/prisma/client";
import type { ApproverType } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { APPROVER_POSITION_NAMES } from "@/lib/services/approverUtils";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";


// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type ApprovalRequestItem = {
  approvalId: string;
  leaveId: string;
  staffName: string;
  staffCode: string;
  leaveTypeName: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: string | null;
  reason: string | null;
  createdAt: string;
  approvalLevel: number;
};

export type ApprovalFilters = {
  search?: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
};

// ──────────────────────────────────────────────
// Pending Approvals
// ──────────────────────────────────────────────

export async function getPendingApprovals(
  staffId: string,
  page: number = 1,
  limit: number = 10,
  filters?: ApprovalFilters,
): Promise<{ data: ApprovalRequestItem[]; total: number; totalPages: number }> {
  const userRoles = await prisma.staffRole.findMany({
    where: { staff_id: staffId },
    include: { role: { select: { role_name: true } } },
  });
  const isSuperAdmin = userRoles.some(
    (sr) => sr.role.role_name === "SUPER_ADMIN",
  );

  // Get user's position + department
  const userStaff = await prisma.staffInfo.findUnique({
    where: { staff_id: staffId },
    select: {
      department_id: true,
      position: { select: { position_name: true } },
    },
  });

  // Build base leave conditions
  const leaveConditions: Prisma.DataLeaveWhereInput = {
    leave_status: LeaveStatus.pending,
  };

  if (!isSuperAdmin) {
    // Restrict to same department
    leaveConditions.staff = { department_id: userStaff?.department_id ?? "" };
  }

  if (filters?.leaveTypeId) {
    leaveConditions.leave_type_id = filters.leaveTypeId;
  }

  if (filters?.startDate) {
    leaveConditions.created_at = { gte: new Date(`${filters.startDate}T00:00:00.000Z`) };
  }

  if (filters?.endDate) {
    leaveConditions.created_at = {
      ...(leaveConditions.created_at as Prisma.DateTimeFilter<"DataLeave"> | undefined),
      lte: new Date(`${filters.endDate}T23:59:59.999Z`),
    };
  }

  if (filters?.search) {
    const searchFilter = { contains: filters.search, mode: "insensitive" as const };
    if (leaveConditions.staff) {
      Object.assign(leaveConditions.staff as object, { staff_code: searchFilter });
    } else {
      leaveConditions.staff = { staff_code: searchFilter };
    }
  }

  // Determine which workflow steps the user can approve based on their position
  if (!isSuperAdmin && userStaff) {
    const userPositionName = userStaff.position?.position_name;
    if (userPositionName) {
      const approvableTypes = Object.entries(APPROVER_POSITION_NAMES)
        .filter(([, names]) => names.includes(userPositionName))
        .map(([type]) => type);

      const steps = await prisma.leaveWorkflowStep.findMany({
        where: { approver_type: { in: approvableTypes as ApproverType[] } },
        select: { approval_level: true, workflow: { select: { position_id: true } } },
      });

      const levels = [...new Set(steps.map((s) => s.approval_level))];
      const positions = [...new Set(steps.map((s) => s.workflow.position_id))];

      if (levels.length > 0) {
        const staffFilter: Prisma.StaffInfoWhereInput = {
          department_id: userStaff.department_id,
          position_id: { in: positions },
        };
        if (filters?.search) {
          staffFilter.staff_code = { contains: filters.search, mode: "insensitive" };
        }

        const orConditions = levels.map((level) => ({
          approval_level: level,
          leave: {
            ...leaveConditions,
            leave_status: LeaveStatus.pending,
            staff: staffFilter,
            current_approval_level: level,
          },
        }));

        const where: Prisma.LeaveApprovalWhereInput = {
          approval_status: ApprovalStatus.pending,
          approver_id: null,
          OR: orConditions,
        };

        const [approvals, total] = await Promise.all([
          prisma.leaveApproval.findMany({
            where,
            include: {
              leave: {
                include: {
                  leaveType: { select: { leave_type_name: true } },
                  staff: { select: { name: true, staff_code: true } },
                },
              },
            },
            orderBy: { leave: { created_at: "desc" } },
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.leaveApproval.count({ where }),
        ]);

        return {
          data: approvals.map((a) => ({
            approvalId: a.approval_id,
            leaveId: a.leave_id,
            staffName: a.leave.staff?.name ?? "",
            staffCode: a.leave.staff?.staff_code ?? "",
            leaveTypeName: a.leave.leaveType?.leave_type_name ?? "",
            startDate: a.leave.start_date?.toISOString() ?? null,
            endDate: a.leave.end_date?.toISOString() ?? null,
            totalDays: a.leave.total_days?.toString() ?? null,
            reason: a.leave.reason,
            createdAt: a.leave.created_at.toISOString(),
            approvalLevel: a.approval_level,
          })),
          total,
          totalPages: Math.ceil(total / limit),
        };
      }

      return { data: [], total: 0, totalPages: 0 };
    }
  }

  // Super admin or fallback — show all pending in department
  const stepLevels = await prisma.leaveApproval.findMany({
    where: {
      approval_status: ApprovalStatus.pending,
      leave: leaveConditions,
    },
    select: { approval_level: true },
    distinct: ["approval_level"],
  });

  const fallbackLevels = stepLevels.map((s) => s.approval_level);

  if (fallbackLevels.length === 0) {
    return { data: [], total: 0, totalPages: 0 };
  }

  const orConditions = fallbackLevels.map((level) => ({
    approval_level: level,
    leave: {
      ...leaveConditions,
      current_approval_level: level,
    },
  }));

  const where: Prisma.LeaveApprovalWhereInput = {
    approval_status: ApprovalStatus.pending,
    OR: orConditions,
  };

  if (!isSuperAdmin) {
    where.approver_id = null;
  }

  const [approvals, total] = await Promise.all([
    prisma.leaveApproval.findMany({
      where,
      include: {
        leave: {
          include: {
            leaveType: { select: { leave_type_name: true } },
            staff: { select: { name: true, staff_code: true } },
          },
        },
      },
      orderBy: { leave: { created_at: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.leaveApproval.count({ where }),
  ]);

  return {
    data: approvals.map((a) => ({
      approvalId: a.approval_id,
      leaveId: a.leave_id,
      staffName: a.leave.staff?.name ?? "",
      staffCode: a.leave.staff?.staff_code ?? "",
      leaveTypeName: a.leave.leaveType?.leave_type_name ?? "",
      startDate: a.leave.start_date?.toISOString() ?? null,
      endDate: a.leave.end_date?.toISOString() ?? null,
      totalDays: a.leave.total_days?.toString() ?? null,
      reason: a.leave.reason,
      createdAt: a.leave.created_at.toISOString(),
      approvalLevel: a.approval_level,
    })),
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ──────────────────────────────────────────────
// HR Approval (role-based, all departments, HR step only)
// ──────────────────────────────────────────────

async function checkHRRole(staffId: string): Promise<boolean> {
  const roles = await prisma.staffRole.findMany({
    where: { staff_id: staffId },
    include: { role: { select: { role_name: true } } },
  });
  return roles.some((r) => r.role.role_name === "HR" || r.role.role_name === "SUPER_ADMIN");
}

export type HrDashboardStats = {
  pendingApprovals: number;
  approvedToday: number;
  totalLeavesThisMonth: number;
  totalLeavesThisYear: number;
  activeStaffCount: number;
  terminatedStaffCount: number;
};

export async function getHrDashboardStats(staffId: string): Promise<HrDashboardStats> {
  const isHR = await checkHRRole(staffId);
  if (!isHR) throw new UnauthorizedError("Unauthorized: HR role required.");

  const hrSteps = await prisma.leaveWorkflowStep.findMany({
    where: { approver_type: "HR" as ApproverType },
    include: { workflow: { select: { position_id: true } } },
  });

  const orConditions = hrSteps.map((s) => ({
    approval_status: ApprovalStatus.pending,
    approver_id: null,
    approval_level: s.approval_level,
    leave: {
      staff: { position_id: s.workflow.position_id },
      leave_status: LeaveStatus.pending,
      current_approval_level: s.approval_level,
    },
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const yearStart = new Date(today.getFullYear(), 0, 1);

  const [pendingApprovals, approvedToday, totalLeavesThisMonth, totalLeavesThisYear, activeStaffCount, terminatedStaffCount] = await Promise.all([
    orConditions.length > 0
      ? prisma.leaveApproval.count({ where: { OR: orConditions } })
      : Promise.resolve(0),
    prisma.dataLeave.count({
      where: {
        leave_status: LeaveStatus.approved,
        updated_at: { gte: today },
      },
    }),
    prisma.dataLeave.count({
      where: {
        created_at: { gte: monthStart },
      },
    }),
    prisma.dataLeave.count({
      where: {
        created_at: { gte: yearStart },
      },
    }),
    prisma.staffInfo.count({
      where: {
        employment_status: "active" as EmploymentStatus,
        is_active: true,
      },
    }),
    prisma.staffInfo.count({
      where: {
        employment_status: "terminated" as EmploymentStatus,
      },
    }),
  ]);

  return { pendingApprovals, approvedToday, totalLeavesThisMonth, totalLeavesThisYear, activeStaffCount, terminatedStaffCount };
}

export async function getHrPendingApprovals(
  staffId: string,
  page: number = 1,
  limit: number = 10,
  filters?: ApprovalFilters,
): Promise<{ data: ApprovalRequestItem[]; total: number; totalPages: number }> {
  const isHR = await checkHRRole(staffId);
  if (!isHR) throw new UnauthorizedError("Unauthorized: HR role required.");

  // Find all workflow steps where approver_type = "HR"
  const hrSteps = await prisma.leaveWorkflowStep.findMany({
    where: { approver_type: "HR" as ApproverType },
    include: { workflow: { select: { position_id: true } } },
  });

  const orConditions = hrSteps.map((s) => ({
    approval_status: ApprovalStatus.pending,
    approver_id: null,
    approval_level: s.approval_level,
    leave: {
      staff: { position_id: s.workflow.position_id },
      leave_status: LeaveStatus.pending,
      current_approval_level: s.approval_level,
      ...(filters?.leaveTypeId ? { leave_type_id: filters.leaveTypeId } : {}),
      ...(filters?.startDate ? { start_date: { gte: new Date(filters.startDate) } } : {}),
      ...(filters?.endDate ? { end_date: { lte: new Date(filters.endDate) } } : {}),
    },
  }));

  if (filters?.search) {
    const searchFilter = { contains: filters.search, mode: "insensitive" as const };
    for (const cond of orConditions) {
      (cond.leave.staff as Record<string, unknown>).staff_code = searchFilter;
    }
  }

  if (orConditions.length === 0) {
    return { data: [], total: 0, totalPages: 0 };
  }

  const [approvals, total] = await Promise.all([
    prisma.leaveApproval.findMany({
      where: { OR: orConditions },
      include: {
        leave: {
          include: {
            leaveType: { select: { leave_type_name: true } },
            staff: { select: { name: true, staff_code: true } },
          },
        },
      },
      orderBy: { leave: { created_at: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.leaveApproval.count({ where: { OR: orConditions } }),
  ]);

  return {
    data: approvals.map((a) => ({
      approvalId: a.approval_id,
      leaveId: a.leave_id,
      staffName: a.leave.staff?.name ?? "",
      staffCode: a.leave.staff?.staff_code ?? "",
      leaveTypeName: a.leave.leaveType?.leave_type_name ?? "",
      startDate: a.leave.start_date?.toISOString() ?? null,
      endDate: a.leave.end_date?.toISOString() ?? null,
      totalDays: a.leave.total_days?.toString() ?? null,
      reason: a.leave.reason,
      createdAt: a.leave.created_at.toISOString(),
      approvalLevel: a.approval_level,
    })),
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ──────────────────────────────────────────────
// Notification Count (unread badge, derived from pending state)
// ──────────────────────────────────────────────

export async function getNotificationCount(staffId: string): Promise<number> {
  const isHR = await checkHRRole(staffId);
  if (isHR) {
    return (await getHrPendingApprovals(staffId, 1, 1)).total;
  }

  const userRoles = await prisma.staffRole.findMany({
    where: { staff_id: staffId },
    include: { role: { select: { role_name: true } } },
  });
  const isApprover = userRoles.some((r) => r.role.role_name.toLowerCase() === "approver");
  if (isApprover) {
    return (await getPendingApprovals(staffId, 1, 1)).total;
  }

  return prisma.dataLeave.count({
    where: { staff_id: staffId, leave_status: LeaveStatus.pending },
  });
}

// ──────────────────────────────────────────────
// Approval History
// ──────────────────────────────────────────────

export type ApprovalHistoryFilters = {
  search?: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  roleType?: "approver" | "hr" | "all";
  page?: number;
  limit?: number;
};

export type ApprovalHistoryItem = {
  approvalId: string;
  leaveId: string;
  staffName: string;
  staffCode: string;
  departmentName: string;
  leaveTypeName: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: string | null;
  reason: string | null;
  status: string;
  comment: string | null;
  actedAt: string | null;
  approvalLevel: number;
};

export type ApprovalHistoryResult = {
  data: ApprovalHistoryItem[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
};

export async function getApprovalHistory(
  staffId: string,
  filters: ApprovalHistoryFilters,
): Promise<ApprovalHistoryResult> {
  const {
    search,
    leaveTypeId,
    startDate,
    endDate,
    roleType = "all",
    page = 1,
    limit = 10,
  } = filters;

  // Check if SUPER_ADMIN — they see ALL non-pending approvals
  const userRoles = await prisma.staffRole.findMany({
    where: { staff_id: staffId },
    include: { role: { select: { role_name: true } } },
  });
  const isSuperAdmin = userRoles.some((r) => r.role.role_name === "SUPER_ADMIN");
  const isHR = userRoles.some((r) => r.role.role_name === "HR");

  if (roleType === "hr" && !isSuperAdmin && !isHR) {
    throw new ForbiddenError("Forbidden: Only HR can view HR approvals");
  }

  const where: Prisma.LeaveApprovalWhereInput = {
    approval_status: { not: ApprovalStatus.pending },
  };

  if (!isSuperAdmin && roleType !== "hr") {
    where.approver_id = staffId;
  }

  // Pre-fetch HR step levels for roleType filtering
  let hrLevels: number[] = [];
  if (roleType !== "all") {
    const hrSteps = await prisma.leaveWorkflowStep.findMany({
      where: { approver_type: "HR" as ApproverType },
      include: { workflow: { select: { position_id: true } } },
    });
    hrLevels = [...new Set(hrSteps.map((s) => s.approval_level))];
    if (hrLevels.length > 0) {
      where.approval_level = roleType === "hr" ? { in: hrLevels } : { notIn: hrLevels };
    } else if (roleType === "hr") {
      // No HR steps exist, return empty
      return { data: [], total: 0, page: 1, totalPages: 0, limit };
    }
  }

  if (leaveTypeId) {
    where.leave = { leave_type_id: leaveTypeId };
  }

  if (search) {
    where.OR = [
      { leave: { reason: { contains: search, mode: "insensitive" } } },
      {
        leave: {
          leaveType: {
            leave_type_name: { contains: search, mode: "insensitive" },
          },
        },
      },
      {
        leave: {
          staff: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      },
    ];
  }

  if (startDate) {
    where.leave = {
      ...(where.leave as Prisma.DataLeaveWhereInput | undefined),
      start_date: { gte: new Date(`${startDate}T00:00:00.000Z`) },
    };
  }

  if (endDate) {
    where.leave = {
      ...(where.leave as Prisma.DataLeaveWhereInput | undefined),
      end_date: { lte: new Date(`${endDate}T23:59:59.999Z`) },
    };
  }

  const [total, approvals] = await Promise.all([
    prisma.leaveApproval.count({ where }),
    prisma.leaveApproval.findMany({
      where,
      include: {
        leave: {
          include: {
            staff: {
              select: {
                name: true,
                staff_code: true,
                department: { select: { department_name: true } },
              },
            },
            leaveType: { select: { leave_type_name: true } },
          },
        },
      },
      orderBy: { acted_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const data: ApprovalHistoryItem[] = approvals.map((a) => ({
    approvalId: a.approval_id,
    leaveId: a.leave_id,
    staffName: a.leave.staff.name ?? "",
    staffCode: a.leave.staff.staff_code ?? "",
    departmentName: a.leave.staff.department?.department_name ?? "",
    leaveTypeName: a.leave.leaveType?.leave_type_name ?? "",
    startDate: a.leave.start_date?.toISOString() ?? null,
    endDate: a.leave.end_date?.toISOString() ?? null,
    totalDays: a.leave.total_days?.toString() ?? null,
    reason: a.leave.reason ?? null,
    status: a.approval_status,
    comment: a.approval_comment ?? null,
    actedAt: a.acted_at?.toISOString() ?? null,
    approvalLevel: a.approval_level,
  }));

  return { data, total, page, totalPages: Math.ceil(total / limit), limit };
}
