import { ApprovalStatus, LeaveStatus, Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { checkApproverExists, checkApproverForStaff, checkApproverForStaffBatch } from "@/lib/services/approverUtils";
import { getCachedWorkflow } from "@/lib/services/workflowCache";
import { invalidateDashboardKpi } from "@/lib/services/dashboardService";
import { NotFoundError, ConflictError, ValidationError, ForbiddenError, UnauthorizedError } from "@/lib/errors";

// ──────────────────────────────────────────────
// Advance Helper
// ──────────────────────────────────────────────

// Splits an inclusive [start, end] date range into per-calendar-year day counts,
// so multi-year leaves are charged to the correct annual quota.
function splitDaysByYear(start: Date, end: Date): Map<number, number> {
  const dayCounts = new Map<number, number>();
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);

  if (e < s) throw new ValidationError("End date before start date.");

  const sTime = s.getTime();
  const eTime = e.getTime();
  for (let y = s.getFullYear(); y <= e.getFullYear(); y++) {
    const yearStart = Math.max(sTime, new Date(y, 0, 1).getTime());
    const yearEnd = Math.min(eTime, new Date(y + 1, 0, 1).getTime() - 1);
    dayCounts.set(y, Math.round((yearEnd - yearStart) / 86_400_000) + 1);
  }
  return dayCounts;
}

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
      end_date: true,
    },
  });

  if (!leave || !leave.total_days) return;

  const startDate = leave.start_date ?? leave.end_date;
  if (!startDate) return;
  const endDate = leave.end_date ?? startDate;

  // Split total days by calendar year so the quota used is accurate per year
  const dayCounts = splitDaysByYear(startDate, endDate);

  for (const [year, days] of dayCounts) {
    const quota = await db.userLeaveLimit.findUnique({
      where: {
        staff_id_leave_type_id_year: {
          staff_id: leave.staff_id,
          leave_type_id: leave.leave_type_id,
          year,
        },
      },
      select: { max_days: true, used_days: true },
    });

    // Only enforce the annual quota if a limit row is defined for that year
    if (quota && Number(quota.used_days) + days > Number(quota.max_days)) {
      throw new ValidationError("ไม่สามารถอนุมัติใบลาได้เนื่องจากสะสมวันลารวมเกินโควตาที่กำหนด");
    }

    const increment = new Prisma.Decimal(days);
    await db.userLeaveLimit.upsert({
      where: {
        staff_id_leave_type_id_year: {
          staff_id: leave.staff_id,
          leave_type_id: leave.leave_type_id,
          year,
        },
      },
      update: { used_days: { increment } },
      create: {
        staff_id: leave.staff_id,
        leave_type_id: leave.leave_type_id,
        year,
        used_days: increment,
        max_days: quota ? quota.max_days : new Prisma.Decimal(0),
      },
    });
  }
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

  const workflow = await getCachedWorkflow(staff.position_id);
  if (!workflow) return;

  const pendingApprovals = await prisma.leaveApproval.findMany({
    where: { leave_id: leaveId, approval_status: ApprovalStatus.pending },
    orderBy: { approval_level: "asc" },
  });

  await prisma.$transaction(async (tx) => {
    if (pendingApprovals.length === 0) {
      await tx.dataLeave.update({
        where: { leave_id: leaveId },
        data: { leave_status: LeaveStatus.approved, updated_at: new Date() },
      });
      await updateUsedDaysOnApproval(leaveId, tx);
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
        await tx.dataLeave.update({
          where: { leave_id: leaveId },
          data: { current_approval_level: approval.approval_level, updated_at: new Date() },
        });
        return;
      }

      // No approver → auto-approve this step
      await tx.leaveApproval.update({
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
    await tx.dataLeave.update({
      where: { leave_id: leaveId },
      data: { leave_status: LeaveStatus.approved, updated_at: new Date() },
    });
    await updateUsedDaysOnApproval(leaveId, tx);
  });
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
  invalidateDashboardKpi();
  const supervisor = await prisma.staffInfo.findUnique({
    where: { staff_id: staffId, is_active: true },
    select: { department_id: true },
  });
  if (!supervisor) throw new NotFoundError("Approver not found or inactive.");

  const approval = await prisma.leaveApproval.findFirst({
    where: {
      approval_id: approvalId,
      leave: {
        staff: {
          department_id: supervisor.department_id,
        },
      },
    },
    include: {
      leave: { select: { staff_id: true, start_date: true } },
    },
  });

  if (!approval) {
    throw new NotFoundError(
      "Approval record not found or you do not have permission to approve leaves in this department.",
    );
  }
  if (approval.approval_status !== ApprovalStatus.pending) {
    throw new ConflictError("This request has already been processed.");
  }

  // Verify the approver has the correct position + role for this step
  const leaveOwner = await prisma.staffInfo.findUnique({
    where: { staff_id: approval.leave.staff_id },
    select: { position_id: true, department_id: true },
  });
  if (!leaveOwner) throw new NotFoundError("Leave owner not found.");

  const workflow = await getCachedWorkflow(leaveOwner.position_id);
  const step = workflow?.steps.find((s) => s.approval_level === approval.approval_level);
  if (!step) throw new NotFoundError("Workflow step not found for this approval level.");

  const isStaff = await checkApproverForStaff(
    staffId,
    leaveOwner.department_id,
    step.approver_type,
  );
  if (!isStaff) {
    throw new ForbiddenError(
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
    throw new ConflictError("This request has already been processed.");
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
  invalidateDashboardKpi();
  const supervisor = await prisma.staffInfo.findUnique({
    where: { staff_id: staffId, is_active: true },
    select: { department_id: true },
  });
  if (!supervisor) throw new NotFoundError("Approver not found or inactive.");

  const approvals = await prisma.leaveApproval.findMany({
    where: {
      approval_id: { in: approvalIds },
      approval_status: ApprovalStatus.pending,
      leave: {
        staff: {
          department_id: supervisor.department_id,
        },
      },
    },
    include: {
      leave: { select: { staff_id: true } },
    },
  });

  if (approvals.length !== approvalIds.length) {
    throw new NotFoundError(
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

  // Verify authority for each approval in the batch — collect (dept, approverType)
  // pairs, dedupe, then resolve all position names + counts via a single batched call
  const authorityChecks: { departmentId: string; approverType: string }[] = [];
  for (const a of approvals) {
    const owner = ownerMap.get(a.leave.staff_id);
    if (!owner) throw new NotFoundError("Leave owner not found.");

    const workflow = workflowMap.get(owner.position_id);
    const step = workflow?.steps.find((s) => s.approval_level === a.approval_level);
    if (!step) throw new NotFoundError("Workflow step not found.");

    authorityChecks.push({ departmentId: owner.department_id, approverType: step.approver_type });
  }

  // Deduplicate identical (departmentId, approverType) pairs, then resolve all
  // position names + counts once via a single batched call
  const uniqueByKey = new Map<string, { departmentId: string; approverType: string }>();
  authorityChecks.forEach((chk) => {
    const key = `${chk.departmentId}::${chk.approverType}`;
    if (!uniqueByKey.has(key)) uniqueByKey.set(key, chk);
  });
  const uniquePairs = Array.from(uniqueByKey.values());
  const uniqueResults = await checkApproverForStaffBatch(staffId, uniquePairs);
  const resultByKey = new Map<string, boolean>();
  Array.from(uniqueByKey.keys()).forEach((key, i) => resultByKey.set(key, uniqueResults[i]));

  for (const a of approvals) {
    const owner = ownerMap.get(a.leave.staff_id);
    const workflow = workflowMap.get(owner!.position_id);
    const step = workflow?.steps.find((s) => s.approval_level === a.approval_level);
    const key = `${owner!.department_id}::${step!.approver_type}`;
    if (!resultByKey.get(key)) {
      throw new ForbiddenError(
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
        throw new ConflictError(
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

export async function hrUpdateApprovalStatus(
  approvalId: string,
  staffId: string,
  status: ApprovalStatus,
  comment?: string,
) {
  invalidateDashboardKpi();
  const isHR = await checkHRRole(staffId);
  if (!isHR) throw new UnauthorizedError("Unauthorized: HR role required.");

  const approval = await prisma.leaveApproval.findUnique({
    where: { approval_id: approvalId },
    include: { leave: { select: { staff_id: true } } },
  });

  if (!approval) throw new NotFoundError("Approval record not found.");
  if (approval.approval_status !== ApprovalStatus.pending) {
    throw new ConflictError("This request has already been processed.");
  }

  // Verify this is an HR step: get leave owner's position workflow
  const owner = await prisma.staffInfo.findUnique({
    where: { staff_id: approval.leave.staff_id },
    select: { position_id: true, department_id: true },
  });
  if (!owner) throw new NotFoundError("Leave owner not found.");

  const workflow = await getCachedWorkflow(owner.position_id);
  const step = workflow?.steps.find((s) => s.approval_level === approval.approval_level);
  if (!step || step.approver_type !== "HR") {
    throw new ValidationError("This step is not an HR approval step.");
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
    throw new ConflictError("This request has already been processed.");
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
  invalidateDashboardKpi();
  const isHR = await checkHRRole(staffId);
  if (!isHR) throw new UnauthorizedError("Unauthorized: HR role required.");

  const approvals = await prisma.leaveApproval.findMany({
    where: {
      approval_id: { in: approvalIds },
      approval_status: ApprovalStatus.pending,
    },
    include: { leave: { select: { staff_id: true } } },
  });

  if (approvals.length !== approvalIds.length) {
    throw new ConflictError("Some records are not found or already processed.");
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
    if (!owner) throw new NotFoundError("Leave owner not found.");

    const workflow = hrWorkflowMap.get(owner.position_id);
    const step = workflow?.steps.find((s) => s.approval_level === a.approval_level);
    if (!step || step.approver_type !== "HR") {
      throw new ValidationError("One or more selected items are not HR-approvable steps.");
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
        throw new ConflictError(
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

export * from "@/lib/services/approvalQueries";
