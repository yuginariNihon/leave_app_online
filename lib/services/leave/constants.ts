import { ValidationError } from "@/lib/errors";

/** Validation error raised by leave business rules (mapped to HTTP 400). */
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
