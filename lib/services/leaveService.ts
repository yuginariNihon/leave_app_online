import { LeaveStatus, ApprovalStatus, LeaveMode, Prisma, LeavePeriod } from "@/lib/generated/prisma/client";
import type { ApproverType } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { LeaveFormOptions } from "@/lib/TypeSchema";
import z from "zod";
import { toDateOnly, countInclusiveDays, buildLeaveReferenceId, timeFromDb } from "@/lib/utils";
import { checkApproversExist, APPROVER_TYPE_LABELS, APPROVER_POSITION_NAMES } from "@/lib/services/approverUtils";
import {
  computeDefaultMaxDays,
  getVacationEntitlement,
  isVacationLeaveType,
  loadVacationCarryOverMap,
  yearsOfServiceFrom,
  VACATION_LEAVE_TYPE_NAME,
} from "@/lib/services/leaveQuotaService";
import { updateUsedDaysOnApproval } from "@/lib/services/approvalService";
import { invalidateDashboardKpi } from "@/lib/services/dashboardService";
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from "@/lib/errors";

const SUPERVISOR_POSITION_NAMES = new Set([
  ...APPROVER_POSITION_NAMES.Supervisor,
  ...APPROVER_POSITION_NAMES.Senior_Supervisor,
]);

export class LeaveRequestValidationError extends ValidationError {}

// ──────────────────────────────────────
// Hourly leave — ผู้ใช้เลือกช่วงเวลาได้อิสระ (คิดเป็นชั่วโมง ÷ HOURS_PER_DAY)
// ค่าช่วงเวลาเช้า/บ่ายด้านล่างใช้สำหรับตรวจชนกันของการลาครึ่งวัน (morning/afternoon)
// ──────────────────────────────────────
export const WORK_DAY_START = "08:00";
export const LUNCH_START = "12:00";
export const LUNCH_END = "13:00";
export const WORK_DAY_END = "17:00";
export const HOURS_PER_DAY = 8;

export const MORNING_START = WORK_DAY_START;
export const MORNING_END = LUNCH_START;
export const AFTERNOON_START = LUNCH_END;
export const AFTERNOON_END = WORK_DAY_END;

export function parseTimeMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.NaN;
  return h * 60 + m;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** "YYYY-MM-DD" for today in Thailand (UTC+7). */
export function thailandToday(): string {
  const now = new Date(Date.now() + 7 * 3_600_000);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(
    now.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" from a string date or Date (UTC date parts). */
export function toDateOnlyString(value: string | Date): string {
  const d = toDateOnly(value);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Date for a @db.Time column (epoch date carries the time of day). */
export function timeToDb(time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, 0));
}

/**
 * Validates an hourly leave (shared by POST + PATCH):
 * same start/end day, not in the past (Thailand), working day (Mon–Sat, no
 * company holiday — reused from assertValidLeaveDateRange), both times given,
 * and start < end. ผู้ใช้เลือกช่วงเวลาได้อิสระ ไม่ต้องอยู่ในช่วงเช้า/บ่าย.
 */
export async function assertValidLeaveTime(
  startDate: string | Date,
  endDate: string | Date,
  startTime: string,
  endTime: string,
): Promise<void> {
  const start = toDateOnlyString(startDate);
  const end = toDateOnlyString(endDate);

  if (end !== start) {
    throw new LeaveRequestValidationError("การลารายชั่วโมงต้องเริ่มและสิ้นสุดในวันเดียวกัน");
  }
  if (start < thailandToday()) {
    throw new LeaveRequestValidationError("ไม่สามารถยื่นคำขอลารายชั่วโมงย้อนหลังได้");
  }

  await assertValidLeaveDateRange(startDate, endDate);

  if (!startTime || !endTime) {
    throw new LeaveRequestValidationError("กรุณาระบุเวลาเริ่มและเวลาสิ้นสุดของการลา");
  }
  const s = parseTimeMinutes(startTime);
  const e = parseTimeMinutes(endTime);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) {
    throw new LeaveRequestValidationError("เวลาเริ่มต้องก่อนเวลาสิ้นสุด");
  }
}

/** Computes leave hours from HH:mm start/end (2 decimal places). */
export function computeLeaveHours(startTime: string, endTime: string): number {
  return round2((parseTimeMinutes(endTime) - parseTimeMinutes(startTime)) / 60);
}

/**
 * Calculates leave total days server-side (never trust the client):
 * hourly = hours ÷ HOURS_PER_DAY; full_day = inclusive day count,
 * morning/afternoon = half per day.
 */
export function computeLeaveTotalDays(
  startDate: string | Date,
  endDate: string | Date,
  leavePeriod?: string,
  leaveMode?: string,
  hours?: number,
): number {
  if (leaveMode === "hour") return round2((hours ?? 0) / HOURS_PER_DAY);
  const days = countInclusiveDays(startDate, endDate);
  if (leavePeriod === "morning" || leavePeriod === "afternoon") return days / 2;
  return days;
}

/**
 * Central weekday/holiday + ordering validation for BOTH create and update
 * (POST /api/leaves and PATCH /api/leaves/[id]) so pending leaves edited to
 * fall on a Sunday/company holiday are rejected consistently.
 */
export async function assertValidLeaveDateRange(
  startDate: string | Date,
  endDate: string | Date,
): Promise<void> {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);

  if (end < start) {
    throw new LeaveRequestValidationError("วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น");
  }

  // Sundays — compare via UTC dates (server must be TZ-agnostic)
  const pad2 = (n: number) => String(n).padStart(2, "0");
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() === 0) {
      const dayStr = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
      throw new LeaveRequestValidationError(`ไม่สามารถยื่นคำขอลาในวันอาทิตย์ (${dayStr})`);
    }
  }

  const holidays = await prisma.holiday.findMany({
    where: { holiday_date: { gte: start, lte: end } },
    select: { holiday_name: true },
  });
  if (holidays.length > 0) {
    const names = holidays.map((h) => h.holiday_name).join(", ");
    throw new LeaveRequestValidationError(`ไม่สามารถยื่นคำขอลาในวันหยุดบริษัท: ${names}`);
  }
}

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

/** Time window of a half-day period on its date (08:00–12:00 / 13:00–17:00). */
function halfDayWindow(period: string): [number, number] {
  if (period === "afternoon") {
    return [parseTimeMinutes(AFTERNOON_START), parseTimeMinutes(AFTERNOON_END)];
  }
  return [parseTimeMinutes(MORNING_START), parseTimeMinutes(MORNING_END)];
}

function dateBetween(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export type LeaveConflictInput = {
  startDate: string | Date;
  endDate: string | Date;
  leavePeriod?: string;
  leaveMode?: string;
  startTime?: string | null;
  endTime?: string | null;
};

export type LeaveConflictTarget = {
  start_date: Date | null;
  end_date: Date | null;
  leave_period: LeavePeriod;
  leave_mode: LeaveMode;
  start_time: Date | null;
  end_time: Date | null;
};

/**
 * Determines whether a (proposed) leave genuinely conflicts with an existing
 * pending/approved leave:
 * - day-vs-day: full_day conflicts with anything; morning + afternoon do not.
 * - hourly-vs-hourly: strict window overlap; disjoint windows on the same day pass.
 * - hourly marker vs day leave: conflicts if its date is in the range and the
 *   hour window intersects the day leave (full day = any window).
 */
export function periodsConflict(a: LeaveConflictInput, b: LeaveConflictTarget): boolean {
  const aMode = a.leaveMode ?? "day";
  const bMode = b.leave_mode ?? LeaveMode.day;
  const aPeriod = a.leavePeriod ?? "full_day";
  const aStartDate = toDateOnlyString(a.startDate);
  const aEndDate = toDateOnlyString(a.endDate);
  const bStartDate = toDateOnlyString(b.start_date ?? b.end_date ?? new Date(0));
  const bEndDate = toDateOnlyString(b.end_date ?? b.start_date ?? new Date(0));
  const bStartTime = timeFromDb(b.start_time);
  const bEndTime = timeFromDb(b.end_time);

  if (bMode === "hour") {
    if (!bStartTime || !bEndTime) return true; // malformed hourly row → treat as conflict
    const bStart = parseTimeMinutes(bStartTime);
    const bEnd = parseTimeMinutes(bEndTime);
    if (aMode === "hour") {
      const aStart = parseTimeMinutes(a.startTime ?? "");
      const aEnd = parseTimeMinutes(a.endTime ?? "");
      return aStartDate === bStartDate && aStart < bEnd && bStart < aEnd;
    }
    // a is day-based vs b hourly: conflict on any shared date
    if (aPeriod === "full_day") return dateBetween(bStartDate, aStartDate, aEndDate);
    const [ws, we] = halfDayWindow(aPeriod);
    return dateBetween(bStartDate, aStartDate, aEndDate) && bStart < we && ws < bEnd;
  }

  // b is day-based
  if (aMode !== "hour") {
    if (aPeriod === "full_day" || b.leave_period === "full_day") return true;
    return aPeriod === b.leave_period;
  }

  // a hourly vs b day-based
  const aStart = parseTimeMinutes(a.startTime ?? "");
  const aEnd = parseTimeMinutes(a.endTime ?? "");
  if (b.leave_period === "full_day") return dateBetween(aStartDate, bStartDate, bEndDate);
  const [ws, we] = halfDayWindow(b.leave_period);
  return dateBetween(aStartDate, bStartDate, bEndDate) && aStart < we && ws < aEnd;
}

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
  return updatedLeave;
}

// ══════════════════════════════════════════════
// Query functions (merged from leaveQueryService)
// ══════════════════════════════════════════════

// ──────────────────────────────────────────────
// Leave History
// ──────────────────────────────────────────────

export type LeaveHistoryDateField = "leave_period" | "created_at";

export type LeaveHistoryFilters = {
  search?: string;
  status?: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  dateField?: LeaveHistoryDateField;
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
  /** "day" | "hour" */
  leaveMode: string;
  startTime: string | null;
  endTime: string | null;
  hours: string | null;
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
    dateField,
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

  const isCreatedDateFilter = dateField === "created_at";
  const createdRange: Prisma.DateTimeFilter<"DataLeave"> = {};
  const startRange: Prisma.DateTimeFilter<"DataLeave"> = {};
  const endRange: Prisma.DateTimeFilter<"DataLeave"> = {};

  if (startDate) {
    const gte = new Date(`${startDate}T00:00:00.000Z`);
    if (isCreatedDateFilter) {
      createdRange.gte = gte;
    } else {
      startRange.gte = gte;
    }
  }

  if (endDate) {
    const lte = new Date(isCreatedDateFilter ? `${endDate}T23:59:59.999Z` : `${endDate}T00:00:00.000Z`);
    if (isCreatedDateFilter) {
      createdRange.lte = lte;
    } else {
      endRange.lte = lte;
    }
  }

  if (createdRange.gte || createdRange.lte) {
    where.created_at = createdRange;
  }
  if (startRange.gte || startRange.lte) {
    where.start_date = startRange;
  }
  if (endRange.gte || endRange.lte) {
    where.end_date = endRange;
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
      leaveMode: item.leave_mode ?? "day",
      startTime: item.start_time ? timeFromDb(item.start_time) : null,
      endTime: item.end_time ? timeFromDb(item.end_time) : null,
      hours: item.hours?.toString() ?? null,
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
  /** false เมื่อ leave_status != pending หรือผ่านขั้นตอนการอนุมัติแรกแล้ว (มี approver_id) */
  canEdit: boolean;
  reason: string | null;
  totalDays: number;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  leavePeriod: string;
  /** "day" | "hour" */
  leaveMode: string;
  startTime: string | null;
  endTime: string | null;
  hours: number | null;
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

  // auto-approve ไม่เซ็ต approver_id จึงไม่ถือว่าผ่านขั้นแรก
  const hasActedApproval = leave.approvals.some((a) => a.approver_id !== null);

  return {
    leaveId: leave.leave_id,
    referenceId: `#LV-${leave.leave_id.slice(0, 8).toUpperCase()}`,
    status: leave.leave_status,
    canEdit: leave.leave_status === LeaveStatus.pending && !hasActedApproval,
    reason: leave.reason,
    totalDays: Number(leave.total_days ?? 0),
    createdAt: leave.created_at.toISOString(),
    startDate: leave.start_date?.toISOString() ?? null,
    endDate: leave.end_date?.toISOString() ?? null,
    leavePeriod: leave.leave_period ?? "full_day",
    leaveMode: leave.leave_mode ?? "day",
    startTime: leave.start_time ? timeFromDb(leave.start_time) : null,
    endTime: leave.end_time ? timeFromDb(leave.end_time) : null,
    hours: leave.hours != null ? Number(leave.hours) : null,
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
  /** "day" | "hour" */
  leaveMode: string;
  startTime: string | null;
  endTime: string | null;
  hours: string | null;
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
    leaveMode: item.leave_mode ?? "day",
    startTime: item.start_time ? timeFromDb(item.start_time) : null,
    endTime: item.end_time ? timeFromDb(item.end_time) : null,
    hours: item.hours?.toString() ?? null,
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
  /** "day" | "hour" */
  leaveMode: string;
  startTime: string | null;
  endTime: string | null;
  hours: string | null;
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
      leaveMode: item.leave_mode ?? "day",
      startTime: item.start_time ? timeFromDb(item.start_time) : null,
      endTime: item.end_time ? timeFromDb(item.end_time) : null,
      hours: item.hours?.toString() ?? null,
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

export async function syncVacationLeaveLimit(
  staffId: string,
  year: number,
  vacationTypeId: string,
  startDate: Date,
) {
  const yearsOfService = yearsOfServiceFrom(startDate);

  let carryOverDays = 0;
  if (getVacationEntitlement(yearsOfService ?? 0) > 0) {
    const carry = await loadVacationCarryOverMap(prisma, {
      leaveTypeId: vacationTypeId,
      year,
      staffIds: [staffId],
    });
    carryOverDays = carry.get(staffId) ?? 0;
  }

  const maxDays = computeDefaultMaxDays({
    leaveTypeName: VACATION_LEAVE_TYPE_NAME,
    maxDaysPerYear: 0,
    yearsOfService,
    carryOverDays,
  });

  await prisma.userLeaveLimit.upsert({
    where: { staff_id_leave_type_id_year: { staff_id: staffId, leave_type_id: vacationTypeId, year } },
    create: { staff_id: staffId, leave_type_id: vacationTypeId, year, max_days: maxDays, used_days: 0 },
    update: { max_days: maxDays, used_days: 0 },
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

// ──────────────────────────────────────────────
// Leave limit bulk assign (HR) — ปีปัจจุบันเท่านั้น
// ──────────────────────────────────────────────

export type MissingQuotaStaffItem = {
  staffId: string;
  staffCode: string;
  name: string;
  departmentName: string | null;
  positionName: string | null;
};

export type MissingQuotaResult = {
  year: number;
  leaveType: {
    leaveTypeId: string;
    leaveTypeName: string;
    maxDaysPerYear: number | null;
    isPaid: boolean;
    isVacationLeave: boolean;
  };
  totalActiveStaff: number;
  alreadyHave: number;
  missingCount: number;
  missing: MissingQuotaStaffItem[];
};

/** Active staff eligible for a quota (matches the annual-reset cron scope). */
function activeQuotaStaffWhere(excludeSuperAdmin = false): Prisma.StaffInfoWhereInput {
  return {
    is_active: true,
    start_date: { not: null },
    ...(excludeSuperAdmin
      ? { staffRoles: { none: { role: { role_name: "SUPER_ADMIN" } } } }
      : {}),
  };
}

export async function getStaffMissingLeaveLimit(
  leaveTypeId: string,
  year: number = new Date().getFullYear(),
  excludeSuperAdmin = false,
): Promise<MissingQuotaResult> {
  const leaveType = await prisma.leaveType.findUnique({
    where: { leave_type_id: leaveTypeId },
    select: {
      leave_type_id: true,
      leave_type_name: true,
      max_days_per_year: true,
      is_paid: true,
      is_active: true,
    },
  });
  if (!leaveType) {
    throw new NotFoundError("ไม่พบประเภทการลาที่เลือก");
  }
  if (!leaveType.is_active) {
    throw new ConflictError("ไม่สามารถจัดการสิทธิ์ของประเภทการลาที่ปิดใช้งานอยู่ได้");
  }

  const staff = await prisma.staffInfo.findMany({
    where: activeQuotaStaffWhere(excludeSuperAdmin),
    orderBy: { staff_code: "asc" },
    select: {
      staff_id: true,
      staff_code: true,
      name: true,
      department: { select: { department_name: true } },
      position: { select: { position_name: true } },
    },
  });

  const existing = await prisma.userLeaveLimit.findMany({
    where: { leave_type_id: leaveTypeId, year },
    select: { staff_id: true },
  });
  const existingSet = new Set(existing.map((e) => e.staff_id));

  const missing = staff
    .filter((s) => !existingSet.has(s.staff_id))
    .map((s) => ({
      staffId: s.staff_id,
      staffCode: s.staff_code,
      name: s.name,
      departmentName: s.department?.department_name ?? null,
      positionName: s.position?.position_name ?? null,
    }));

  return {
    year,
    leaveType: {
      leaveTypeId: leaveType.leave_type_id,
      leaveTypeName: leaveType.leave_type_name,
      maxDaysPerYear: leaveType.max_days_per_year,
      isPaid: leaveType.is_paid,
      isVacationLeave: isVacationLeaveType(leaveType.leave_type_name),
    },
    totalActiveStaff: staff.length,
    alreadyHave: staff.length - missing.length,
    missingCount: missing.length,
    missing,
  };
}

export type AssignLeaveLimitResult = {
  year: number;
  leaveTypeName: string;
  requested: number;
  created: number;
  skippedDuplicate: number;
  skippedInactive: number;
  skippedSuperAdmin: number;
};

/**
 * Creates UserLeaveLimit rows for the current year only.
 * Never overwrites an existing row (createMany + skipDuplicates), so `used_days` is safe.
 * For annual leave the quota is computed from years of service + carry-over (max 6 days).
 */
export async function assignLeaveLimitToStaff(input: {
  leaveTypeId: string;
  staffIds: string[];
  maxDays: number;
  year?: number;
  excludeSuperAdmin?: boolean;
}): Promise<AssignLeaveLimitResult> {
  const year = input.year ?? new Date().getFullYear();
  let requestedIds = Array.from(new Set(input.staffIds));
  let skippedSuperAdmin = 0;

  // HR must never assign a quota to a SUPER_ADMIN staff — drop them server-side.
  if (input.excludeSuperAdmin && requestedIds.length > 0) {
    const admins = await prisma.staffInfo.findMany({
      where: {
        staff_id: { in: requestedIds },
        staffRoles: { some: { role: { role_name: "SUPER_ADMIN" } } },
      },
      select: { staff_id: true },
    });
    const adminSet = new Set(admins.map((a) => a.staff_id));
    skippedSuperAdmin = requestedIds.filter((id) => adminSet.has(id)).length;
    requestedIds = requestedIds.filter((id) => !adminSet.has(id));
  }

  const leaveType = await prisma.leaveType.findUnique({
    where: { leave_type_id: input.leaveTypeId },
    select: {
      leave_type_id: true,
      leave_type_name: true,
      is_active: true,
      max_days_per_year: true,
    },
  });
  if (!leaveType) {
    throw new NotFoundError("ไม่พบประเภทการลาที่เลือก");
  }
  if (!leaveType.is_active) {
    throw new ConflictError("ไม่สามารถจัดการสิทธิ์ของประเภทการลาที่ปิดใช้งานอยู่ได้");
  }

  const isVacation = isVacationLeaveType(leaveType.leave_type_name);
  if (!isVacation && (input.maxDays < 0 || !Number.isFinite(input.maxDays))) {
    throw new ValidationError("ข้อมูลไม่ถูกต้อง: จำนวนวันลาต้องเป็นตัวเลขที่ไม่ติดลบ");
  }

  const eligible = await prisma.staffInfo.findMany({
    where: { staff_id: { in: requestedIds }, ...activeQuotaStaffWhere() },
    select: { staff_id: true, start_date: true },
  });
  const eligibleMap = new Map(eligible.map((s) => [s.staff_id, s.start_date]));
  const targetIds = eligible.map((s) => s.staff_id);

  const skippedInactive = requestedIds.filter((id) => !eligibleMap.has(id)).length;

  const existing = await prisma.userLeaveLimit.findMany({
    where: { leave_type_id: input.leaveTypeId, year, staff_id: { in: targetIds } },
    select: { staff_id: true },
  });
  const existingSet = new Set(existing.map((e) => e.staff_id));
  const toCreate = targetIds.filter((id) => !existingSet.has(id));
  const skippedDuplicate = targetIds.length - toCreate.length;

  if (toCreate.length === 0) {
    return {
      year,
      leaveTypeName: leaveType.leave_type_name,
      requested: requestedIds.length,
      created: 0,
      skippedDuplicate,
      skippedInactive,
      skippedSuperAdmin,
    };
  }

  // Batch carry-over lookup: one query for all previous-year vacation rows.
  const carryOverMap = isVacation
    ? await loadVacationCarryOverMap(prisma, {
        leaveTypeId: input.leaveTypeId,
        year,
        staffIds: toCreate,
      })
    : new Map<string, number>();

  const rows = toCreate.map((staffId) => {
    const startDate = eligibleMap.get(staffId);
    return {
      staff_id: staffId,
      leave_type_id: input.leaveTypeId,
      year,
      // Annual leave ignores the manual input (seniority formula + carry-over);
      // every other type uses the HR-entered number.
      max_days: computeDefaultMaxDays({
        leaveTypeName: leaveType.leave_type_name,
        maxDaysPerYear: input.maxDays,
        yearsOfService: yearsOfServiceFrom(startDate),
        carryOverDays: carryOverMap.get(staffId) ?? 0,
      }),
      used_days: 0,
    };
  });

  const created = await prisma.userLeaveLimit.createMany({
    data: rows,
    skipDuplicates: true,
  });

  return {
    year,
    leaveTypeName: leaveType.leave_type_name,
    requested: requestedIds.length,
    created: created.count,
    skippedDuplicate,
    skippedInactive,
    skippedSuperAdmin,
  };
}

export * from "@/lib/services/staffService";
export * from "@/lib/services/masterDataService";
export * from "@/lib/services/roleService";
export * from "@/lib/services/workflowService";
export * from "@/lib/services/profileService";
export * from "@/lib/services/userService";
export * from "@/lib/services/leaveQuotaService";
export { timeFromDb, minutesToTime } from "@/lib/utils";
