import { ApprovalStatus, LeaveStatus, EmploymentStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { ApproverType } from "@/lib/generated/prisma/enums";
import { checkApproverExists, checkApproverForStaff, APPROVER_POSITION_NAMES } from "@/lib/services/approverUtils";

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
    leaveConditions.start_date = { gte: new Date(filters.startDate) };
  }

  if (filters?.endDate) {
    leaveConditions.end_date = { lte: new Date(filters.endDate) };
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
        .filter(([_, names]) => names.includes(userPositionName))
        .map(([type]) => type);

      const steps = await prisma.leaveWorkflowStep.findMany({
        where: { approver_type: { in: approvableTypes as ApproverType[] } },
        include: { workflow: { select: { position_id: true } } },
      });

      const orConditions = steps.map((s) => ({
        leave: {
          ...leaveConditions,
          staff: {
            department_id: userStaff.department_id,
            position_id: s.workflow.position_id,
          },
        },
        approval_status: ApprovalStatus.pending,
        approver_id: null,
        approval_level: s.approval_level,
      }));

      if (orConditions.length > 0) {
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

      return { data: [], total: 0, totalPages: 0 };
    }
  }

  // Super admin or fallback — show all pending in department
  const where: Prisma.LeaveApprovalWhereInput = {
    approval_status: ApprovalStatus.pending,
    leave: leaveConditions,
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
// Advance Helper
// ──────────────────────────────────────────────

export async function updateUsedDaysOnApproval(
  leaveId: string,
  tx?: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$use" | "$transaction" | "$extends">,
): Promise<void> {
  const db = tx ?? prisma;
  const leave = await db.dataLeave.findUnique({
    where: { leave_id: leaveId },
    select: {
      staff_id: true,
      leave_type_id: true,
      total_days: true,
      start_date: true,
    },
  });

  if (!leave || !leave.total_days || !leave.start_date) return;

  const year = leave.start_date.getFullYear();

  await db.userLeaveLimit.upsert({
    where: {
      staff_id_leave_type_id_year: {
        staff_id: leave.staff_id,
        leave_type_id: leave.leave_type_id,
        year,
      },
    },
    update: { used_days: { increment: Number(leave.total_days) } },
    create: {
      staff_id: leave.staff_id,
      leave_type_id: leave.leave_type_id,
      year,
      used_days: leave.total_days,
      max_days: new Prisma.Decimal(0),
    },
  });
}

async function advanceLeaveApproval(
  leaveId: string,
  leaveOwnerStaffId: string,
  departmentId: string,
): Promise<void> {
  const staff = await prisma.staffInfo.findUnique({
    where: { staff_id: leaveOwnerStaffId },
    select: { position_id: true },
  });
  if (!staff) return;

  const workflow = await prisma.leaveWorkflow.findFirst({
    where: { position_id: staff.position_id, is_active: true },
    include: { steps: { orderBy: { approval_level: "asc" } } },
  });
  if (!workflow) return;

  const pendingApprovals = await prisma.leaveApproval.findMany({
    where: { leave_id: leaveId, approval_status: ApprovalStatus.pending },
    orderBy: { approval_level: "asc" },
  });

  if (pendingApprovals.length === 0) {
    await prisma.dataLeave.update({
      where: { leave_id: leaveId },
      data: { leave_status: LeaveStatus.approved, updated_at: new Date() },
    });
    await updateUsedDaysOnApproval(leaveId);
    return;
  }

  for (const approval of pendingApprovals) {
    const step = workflow.steps.find(
      (s) => s.approval_level === approval.approval_level,
    );
    if (!step) continue;

    const hasApprover = await checkApproverExists(
      leaveOwnerStaffId,
      departmentId,
      step.approver_type,
    );

    if (hasApprover) {
      await prisma.dataLeave.update({
        where: { leave_id: leaveId },
        data: { current_approval_level: approval.approval_level, updated_at: new Date() },
      });
      return;
    }

    // No approver → auto-approve this step
    await prisma.leaveApproval.update({
      where: { approval_id: approval.approval_id },
      data: {
        approval_status: ApprovalStatus.approved,
      approval_comment:
        `Auto-approved: No valid approver found for ${step.approver_type} step`,
        acted_at: new Date(),
      },
    });
  }

  // All remaining steps auto-approved
  await prisma.dataLeave.update({
    where: { leave_id: leaveId },
      data: { leave_status: LeaveStatus.approved, updated_at: new Date() },
    });
    await updateUsedDaysOnApproval(leaveId);
}

// ──────────────────────────────────────────────
// Single Approval
// ──────────────────────────────────────────────

export async function updateApprovalStatus(
  approvalId: string,
  staffId: string,
  status: ApprovalStatus,
  comment?: string,
) {
  const supervisor = await prisma.staffInfo.findUnique({
    where: { staff_id: staffId },
    select: { department_id: true },
  });

  const approval = await prisma.leaveApproval.findFirst({
    where: {
      approval_id: approvalId,
      leave: {
        staff: {
          department_id: supervisor?.department_id ?? "",
        },
      },
    },
    include: {
      leave: { select: { staff_id: true, start_date: true } },
    },
  });

  if (!approval) {
    throw new Error(
      "Approval record not found or you do not have permission to approve leaves in this department.",
    );
  }
  if (approval.approval_status !== ApprovalStatus.pending) {
    throw new Error("This request has already been processed.");
  }

  // Verify the approver has the correct position + role for this step
  const leaveOwner = await prisma.staffInfo.findUnique({
    where: { staff_id: approval.leave.staff_id },
    select: { position_id: true, department_id: true },
  });
  if (!leaveOwner) throw new Error("Leave owner not found.");

  const workflow = await prisma.leaveWorkflow.findFirst({
    where: { position_id: leaveOwner.position_id, is_active: true },
    include: {
      steps: { where: { approval_level: approval.approval_level } },
    },
  });
  const step = workflow?.steps[0];
  if (!step) throw new Error("Workflow step not found for this approval level.");

  const isStaff = await checkApproverForStaff(
    staffId,
    leaveOwner.department_id,
    step.approver_type,
  );
  if (!isStaff) {
    throw new Error(
      "You do not have the authority to approve this step.",
    );
  }

  const result = await prisma.leaveApproval.updateMany({
    where: {
      approval_id: approvalId,
      approval_status: ApprovalStatus.pending,
    },
    data: {
      approver_id: staffId,
      approval_status: status,
      approval_comment: comment ?? null,
      acted_at: new Date(),
    },
  });

  if (result.count === 0) {
    throw new Error("This request has already been processed.");
  }

  if (status === ApprovalStatus.rejected) {
    await prisma.leaveApproval.updateMany({
      where: {
        leave_id: approval.leave_id,
        approval_id: { not: approvalId },
        approval_status: ApprovalStatus.pending,
      },
      data: { approval_status: ApprovalStatus.skipped },
    });
    await prisma.dataLeave.update({
      where: { leave_id: approval.leave_id },
      data: { leave_status: LeaveStatus.rejected, updated_at: new Date() },
    });
    return approval;
  }

  // Approved → advance to next pending level (with auto-skip)
  await advanceLeaveApproval(
    approval.leave_id,
    approval.leave.staff_id,
    leaveOwner.department_id,
  );

  return approval;
}

// ──────────────────────────────────────────────
// Bulk Approval
// ──────────────────────────────────────────────

export async function bulkUpdateApprovalStatus(
  approvalIds: string[],
  staffId: string,
  status: ApprovalStatus,
  comment?: string,
) {
  const supervisor = await prisma.staffInfo.findUnique({
    where: { staff_id: staffId },
    select: { department_id: true },
  });

  const approvals = await prisma.leaveApproval.findMany({
    where: {
      approval_id: { in: approvalIds },
      approval_status: ApprovalStatus.pending,
      leave: {
        staff: {
          department_id: supervisor?.department_id ?? "",
        },
      },
    },
    include: {
      leave: { select: { staff_id: true } },
    },
  });

  if (approvals.length !== approvalIds.length) {
    throw new Error(
      "Some records are not found, already processed, or not in your department.",
    );
  }

  // Batch-fetch all owners + workflows upfront to avoid N+1
  const ownerStaffIds = Array.from(new Set(approvals.map((a) => a.leave.staff_id)));
  const owners = await prisma.staffInfo.findMany({
    where: { staff_id: { in: ownerStaffIds } },
    select: { staff_id: true, position_id: true, department_id: true },
  });
  const ownerMap = new Map(owners.map((o) => [o.staff_id, o]));

  const workflows = await prisma.leaveWorkflow.findMany({
    where: { position_id: { in: owners.map((o) => o.position_id) }, is_active: true },
    include: { steps: { select: { approval_level: true, approver_type: true } } },
  });
  const workflowMap = new Map(workflows.map((w) => [w.position_id, w]));

  // Verify authority for each approval in the batch (using maps, no per-item queries)
  for (const a of approvals) {
    const owner = ownerMap.get(a.leave.staff_id);
    if (!owner) throw new Error("Leave owner not found.");

    const workflow = workflowMap.get(owner.position_id);
    const step = workflow?.steps.find((s) => s.approval_level === a.approval_level);
    if (!step) throw new Error("Workflow step not found.");

    const isStaff = await checkApproverForStaff(
      staffId,
      owner.department_id,
      step.approver_type,
    );
    if (!isStaff) {
      throw new Error(
        "You do not have the authority to approve one or more of the selected steps.",
      );
    }
  }

  // Atomic update: only pending records can be updated (race-condition safe)
  await prisma.$transaction(async (tx) => {
    for (const a of approvals) {
      const result = await tx.leaveApproval.updateMany({
        where: {
          approval_id: a.approval_id,
          approval_status: ApprovalStatus.pending,
        },
        data: {
          approver_id: staffId,
          approval_status: status,
          approval_comment: comment ?? null,
          acted_at: new Date(),
        },
      });
      if (result.count === 0) {
        throw new Error(
          `Approval ${a.approval_id} has already been processed.`,
        );
      }
    }
  });

  if (status === ApprovalStatus.rejected) {
    const leaveIds = Array.from(new Set(approvals.map((a) => a.leave_id)));
    await prisma.leaveApproval.updateMany({
      where: {
        leave_id: { in: leaveIds },
        approval_id: { notIn: approvalIds },
        approval_status: ApprovalStatus.pending,
      },
      data: { approval_status: ApprovalStatus.skipped },
    });
    await prisma.dataLeave.updateMany({
      where: { leave_id: { in: leaveIds } },
      data: { leave_status: LeaveStatus.rejected, updated_at: new Date() },
    });
    return;
  }

  // Group by leave_id and advance each (use ownerMap from above)
  const leaveGroups = new Map<
    string,
    { staffId: string; departmentId: string }
  >();
  for (const a of approvals) {
    if (!leaveGroups.has(a.leave_id)) {
      const owner = ownerMap.get(a.leave.staff_id);
      leaveGroups.set(a.leave_id, {
        staffId: a.leave.staff_id,
        departmentId: owner?.department_id ?? "",
      });
    }
  }

  await Promise.all(
    Array.from(leaveGroups.entries()).map(([leaveId, info]) =>
      advanceLeaveApproval(leaveId, info.staffId, info.departmentId),
    ),
  );
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
  if (!isHR) throw new Error("Unauthorized: HR role required.");

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
  if (!isHR) throw new Error("Unauthorized: HR role required.");

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

export async function hrUpdateApprovalStatus(
  approvalId: string,
  staffId: string,
  status: ApprovalStatus,
  comment?: string,
) {
  const isHR = await checkHRRole(staffId);
  if (!isHR) throw new Error("Unauthorized: HR role required.");

  const approval = await prisma.leaveApproval.findUnique({
    where: { approval_id: approvalId },
    include: { leave: { select: { staff_id: true } } },
  });

  if (!approval) throw new Error("Approval record not found.");
  if (approval.approval_status !== ApprovalStatus.pending) {
    throw new Error("This request has already been processed.");
  }

  // Verify this is an HR step: get leave owner's position workflow
  const owner = await prisma.staffInfo.findUnique({
    where: { staff_id: approval.leave.staff_id },
    select: { position_id: true, department_id: true },
  });
  if (!owner) throw new Error("Leave owner not found.");

  const workflow = await prisma.leaveWorkflow.findFirst({
    where: { position_id: owner.position_id, is_active: true },
    include: { steps: { where: { approval_level: approval.approval_level } } },
  });
  const step = workflow?.steps[0];
  if (!step || step.approver_type !== "HR") {
    throw new Error("This step is not an HR approval step.");
  }

  const result = await prisma.leaveApproval.updateMany({
    where: {
      approval_id: approvalId,
      approval_status: ApprovalStatus.pending,
    },
    data: {
      approver_id: staffId,
      approval_status: status,
      approval_comment: comment ?? null,
      acted_at: new Date(),
    },
  });

  if (result.count === 0) {
    throw new Error("This request has already been processed.");
  }

  if (status === ApprovalStatus.rejected) {
    await prisma.leaveApproval.updateMany({
      where: {
        leave_id: approval.leave_id,
        approval_id: { not: approvalId },
        approval_status: ApprovalStatus.pending,
      },
      data: { approval_status: ApprovalStatus.skipped },
    });
    await prisma.dataLeave.update({
      where: { leave_id: approval.leave_id },
      data: { leave_status: LeaveStatus.rejected, updated_at: new Date() },
    });
    return approval;
  }

  // Advance to next pending level
  await advanceLeaveApproval(
    approval.leave_id,
    approval.leave.staff_id,
    owner.department_id,
  );

  return approval;
}

export async function hrBulkUpdateApprovalStatus(
  approvalIds: string[],
  staffId: string,
  status: ApprovalStatus,
  comment?: string,
) {
  const isHR = await checkHRRole(staffId);
  if (!isHR) throw new Error("Unauthorized: HR role required.");

  const approvals = await prisma.leaveApproval.findMany({
    where: {
      approval_id: { in: approvalIds },
      approval_status: ApprovalStatus.pending,
    },
    include: { leave: { select: { staff_id: true } } },
  });

  if (approvals.length !== approvalIds.length) {
    throw new Error("Some records are not found or already processed.");
  }

  // Verify each approval step is HR-approvable
  const hrOwnerStaffIds = Array.from(new Set(approvals.map((a) => a.leave.staff_id)));
  const hrOwners = await prisma.staffInfo.findMany({
    where: { staff_id: { in: hrOwnerStaffIds } },
    select: { staff_id: true, position_id: true, department_id: true },
  });
  const hrOwnerMap = new Map(hrOwners.map((o) => [o.staff_id, o]));

  const hrWorkflows = await prisma.leaveWorkflow.findMany({
    where: { position_id: { in: hrOwners.map((o) => o.position_id) }, is_active: true },
    include: { steps: { select: { approval_level: true, approver_type: true } } },
  });
  const hrWorkflowMap = new Map(hrWorkflows.map((w) => [w.position_id, w]));

  for (const a of approvals) {
    const owner = hrOwnerMap.get(a.leave.staff_id);
    if (!owner) throw new Error("Leave owner not found.");

    const workflow = hrWorkflowMap.get(owner.position_id);
    const step = workflow?.steps.find((s) => s.approval_level === a.approval_level);
    if (!step || step.approver_type !== "HR") {
      throw new Error("One or more selected items are not HR-approvable steps.");
    }
  }

  // Atomic update: only pending records can be updated (race-condition safe)
  await prisma.$transaction(async (tx) => {
    for (const a of approvals) {
      const result = await tx.leaveApproval.updateMany({
        where: {
          approval_id: a.approval_id,
          approval_status: ApprovalStatus.pending,
        },
        data: {
          approver_id: staffId,
          approval_status: status,
          approval_comment: comment ?? null,
          acted_at: new Date(),
        },
      });
      if (result.count === 0) {
        throw new Error(
          `Approval ${a.approval_id} has already been processed.`,
        );
      }
    }
  });

  if (status === ApprovalStatus.rejected) {
    const leaveIds = Array.from(new Set(approvals.map((a) => a.leave_id)));
    await prisma.leaveApproval.updateMany({
      where: {
        leave_id: { in: leaveIds },
        approval_id: { notIn: approvalIds },
        approval_status: ApprovalStatus.pending,
      },
      data: { approval_status: ApprovalStatus.skipped },
    });
    await prisma.dataLeave.updateMany({
      where: { leave_id: { in: leaveIds } },
      data: { leave_status: LeaveStatus.rejected, updated_at: new Date() },
    });
    return;
  }

  // Advance each approved leave (reuse hrOwnerMap from above)
  const hrLeaveGroups = new Map<string, { staffId: string; departmentId: string }>();
  for (const a of approvals) {
    if (!hrLeaveGroups.has(a.leave_id)) {
      const owner = hrOwnerMap.get(a.leave.staff_id);
      hrLeaveGroups.set(a.leave_id, {
        staffId: a.leave.staff_id,
        departmentId: owner?.department_id ?? "",
      });
    }
  }

  await Promise.all(
    Array.from(hrLeaveGroups.entries()).map(([leaveId, info]) =>
      advanceLeaveApproval(leaveId, info.staffId, info.departmentId),
    ),
  );
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
    throw new Error("Forbidden: Only HR can view HR approvals");
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
