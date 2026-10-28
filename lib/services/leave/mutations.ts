import {
  LeaveStatus,
  ApprovalStatus,
  LeaveMode,
  Prisma,
  LeavePeriod,
} from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/utils";
import { allocateLeaveNo } from "@/lib/services/leaveNumberService";
import { checkApproversExist } from "@/lib/services/approverUtils";
import { updateUsedDaysOnApproval } from "@/lib/services/approvalService";
import { invalidateDashboardKpi } from "@/lib/services/dashboardService";
import {
  scheduleLeaveCreatedEmail,
  scheduleLeaveCancelledEmail,
} from "@/lib/services/leaveMailerService";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { LeaveRequestValidationError } from "@/lib/services/leave/constants";
import {
  assertValidLeaveDateRange,
  assertValidLeaveTime,
  computeLeaveHours,
  computeLeaveTotalDays,
  periodsConflict,
  timeToDb,
} from "@/lib/services/leave/validation";

export type CreateLeaveRequestInput = {
  staffId: string;
  leaveTypeId: string;
  leaveCaseId: string;
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
  leavePeriod?: string;
  leaveMode?: string;
  startTime?: string;
  endTime?: string;
};

/**
 * Creates a leave request record in the database.
 */
export async function createLeaveRequest(input: CreateLeaveRequestInput) {
  const startDate = toDateOnly(input.startDate);
  const endDate = toDateOnly(input.endDate);
  const leaveMode = input.leaveMode ?? "day";
  const isHour = leaveMode === "hour";

  await assertValidLeaveDateRange(input.startDate, input.endDate);
  let hours: number | null = null;
  if (isHour) {
    await assertValidLeaveTime(input.startDate, input.endDate, input.startTime ?? "", input.endTime ?? "");
    hours = computeLeaveHours(input.startTime ?? "", input.endTime ?? "");
  }
  const totalDays = computeLeaveTotalDays(
    startDate,
    endDate,
    input.leavePeriod,
    leaveMode,
    hours ?? undefined,
  );

  // 1. Get staff info for position & department
  const staff = await prisma.staffInfo.findUnique({
    where: { staff_id: input.staffId },
    select: { position_id: true, department_id: true },
  });

  if (!staff) throw new NotFoundError("Staff not found.");

  // ตรวจสอบการทับซ้อนของช่วงเวลาลาที่มีสถานะ pending/approved อยู่แล้ว
  // (morning + afternoon ในวันเดียวกันไม่ถือว่าทับซ้อนกัน; รายชั่วโมงเทียบเวลาเริ่ม–สิ้นสุดจริง)
  const overlapLeaves = await prisma.dataLeave.findMany({
    where: {
      staff_id: input.staffId,
      leave_status: { in: [LeaveStatus.pending, LeaveStatus.approved] },
      start_date: { lte: endDate },
      end_date: { gte: startDate },
    },
    select: {
      leave_id: true,
      start_date: true,
      end_date: true,
      leave_period: true,
      leave_mode: true,
      start_time: true,
      end_time: true,
    },
  });
  if (
    overlapLeaves.some((o) =>
      periodsConflict(
        {
          startDate,
          endDate,
          leavePeriod: input.leavePeriod,
          leaveMode,
          startTime: isHour ? input.startTime : null,
          endTime: isHour ? input.endTime : null,
        },
        o,
      ),
    )
  ) {
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
    const year = new Date(startDate).getUTCFullYear();
    const leaveNo = await allocateLeaveNo(tx, year);

    const created = await tx.dataLeave.create({
      data: {
        staff_id: input.staffId,
        leave_type_id: input.leaveTypeId,
        leave_case_id: input.leaveCaseId,
        start_date: startDate,
        end_date: endDate,
        total_days: new Prisma.Decimal(totalDays),
        leave_period: (input.leavePeriod ?? "full_day") as LeavePeriod,
        leave_mode: leaveMode as LeaveMode,
        start_time: isHour ? timeToDb(input.startTime ?? "") : undefined,
        end_time: isHour ? timeToDb(input.endTime ?? "") : undefined,
        hours: hours !== null ? new Prisma.Decimal(hours) : undefined,
        reason: input.reason,
        leave_status: allAutoApproved
          ? LeaveStatus.approved
          : LeaveStatus.pending,
        current_approval_level: firstPendingLevel ?? 1,
        leave_no: leaveNo,
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

  scheduleLeaveCreatedEmail(leave.leave_id);

  return leave;
}

export type UpdateLeaveRequestInput = {
  leaveTypeId: string;
  leaveCaseId: string;
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
  leavePeriod?: string;
  leaveMode?: string;
  startTime?: string;
  endTime?: string;
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

  // ล็อกการแก้ไขเมื่อผ่านขั้นตอนการอนุมัติแรกแล้ว: leave_status ยังเป็น pending
  // จนกว่าจะครบทุกขั้น จึงต้องเช็ก approver_id แยก (auto-approve ไม่เซ็ตค่านี้)
  const actedApproval = await prisma.leaveApproval.findFirst({
    where: {
      leave_id: leaveId,
      approver_id: { not: null },
    },
    select: { approval_id: true },
  });

  if (actedApproval) {
    throw new ConflictError(
      "คำขอนี้อยู่ระหว่างการอนุมัติแล้ว ไม่สามารถแก้ไขได้",
    );
  }

  const startDate = toDateOnly(input.startDate);
  const endDate = toDateOnly(input.endDate);
  const leaveMode = input.leaveMode ?? "day";
  const isHour = leaveMode === "hour";

  await assertValidLeaveDateRange(input.startDate, input.endDate);
  let hours: number | null = null;
  if (isHour) {
    await assertValidLeaveTime(input.startDate, input.endDate, input.startTime ?? "", input.endTime ?? "");
    hours = computeLeaveHours(input.startTime ?? "", input.endTime ?? "");
  }
  const totalDays = computeLeaveTotalDays(
    startDate,
    endDate,
    input.leavePeriod,
    leaveMode,
    hours ?? undefined,
  );

  // ตรวจสอบการทับซ้อนของช่วงเวลาลากับใบลาอื่น (ไม่รวมใบปัจจุบัน)
  // (morning + afternoon ในวันเดียวกันไม่ถือว่าทับซ้อนกัน; รายชั่วโมงเทียบเวลาเริ่ม–สิ้นสุดจริง)
  const overlapLeaves = await prisma.dataLeave.findMany({
    where: {
      staff_id: staffId,
      leave_id: { not: leaveId },
      leave_status: { in: [LeaveStatus.pending, LeaveStatus.approved] },
      start_date: { lte: endDate },
      end_date: { gte: startDate },
    },
    select: {
      leave_id: true,
      start_date: true,
      end_date: true,
      leave_period: true,
      leave_mode: true,
      start_time: true,
      end_time: true,
    },
  });
  if (
    overlapLeaves.some((o) =>
      periodsConflict(
        {
          startDate,
          endDate,
          leavePeriod: input.leavePeriod,
          leaveMode,
          startTime: isHour ? input.startTime : null,
          endTime: isHour ? input.endTime : null,
        },
        o,
      ),
    )
  ) {
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
      leave_period: (input.leavePeriod ?? "full_day") as LeavePeriod,
      leave_mode: leaveMode as LeaveMode,
      start_time: isHour ? timeToDb(input.startTime ?? "") : undefined,
      end_time: isHour ? timeToDb(input.endTime ?? "") : undefined,
      hours: hours !== null ? new Prisma.Decimal(hours) : undefined,
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
  scheduleLeaveCancelledEmail(leaveId);
  return updatedLeave;
}
