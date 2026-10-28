import { LeaveMode, LeavePeriod } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toDateOnly, countInclusiveDays, timeFromDb } from "@/lib/utils";
import {
  AFTERNOON_END,
  AFTERNOON_START,
  HOURS_PER_DAY,
  LeaveRequestValidationError,
  MORNING_END,
  MORNING_START,
} from "@/lib/services/leave/constants";

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
