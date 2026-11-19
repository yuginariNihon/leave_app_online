/**
 * นโยบาย "ยกเลิกใบลาอัตโนมัติเมื่อค้างอนุมัติขั้นแรกเกิน N วัน"
 *
 * ไฟล์นี้ต้อง **ไม่มี dependency ฝั่ง server** (ไม่ import prisma / next)
 * เพราะถูกใช้ทั้งใน service (server) และ component (client) เพื่อให้
 * ข้อความ/การตรวจหาเหตุผลตรงกันทั้งระบบ
 */

/** จำนวนวันเริ่มต้นก่อนยกเลิกอัตโนมัติ (override ได้ด้วย `PENDING_AUTO_CANCEL_DAYS`) */
export const AUTO_CANCEL_DAYS_DEFAULT = 30;

/**
 * คำนำหน้าของ `cancel_reason` ที่ระบบเป็นผู้เซ็ต
 * ใช้เป็น marker ระบุว่า "ระบบยกเลิก" ไม่ใช่เจ้าของใบลา (ไม่ต้องเพิ่มคอลัมน์ใน DB)
 */
export const AUTO_CANCEL_REASON_PREFIX = "ยกเลิกอัตโนมัติ";

/** ข้อความ `cancel_reason` ที่ระบบเขียนลงไป (แสดงในหน้าจอ/อีเมล) */
export function autoCancelReason(days: number = AUTO_CANCEL_DAYS_DEFAULT): string {
  return `${AUTO_CANCEL_REASON_PREFIX} — ไม่มีผู้อนุมัติภายใน ${days} วัน`;
}

/** ใบลานี้ถูกยกเลิกโดยระบบหรือไม่ (ดูจาก `cancel_reason` ที่ระบบเขียนไว้) */
export function isAutoCancelReason(reason?: string | null): boolean {
  return typeof reason === "string" && reason.startsWith(AUTO_CANCEL_REASON_PREFIX);
}

export type AutoCancelCandidateState = {
  /** ค่าของ `DataLeave.leave_status` (ส่งเป็น string เพื่อไม่ผูกกับ Prisma enum) */
  leaveStatus: string;
  /** ค่าของ `DataLeave.current_approval_level` */
  currentLevel: number;
  createdAt: Date;
};

/**
 * เงื่อนไขเดียวกับที่ใช้ตัดสินใจจริง — แยกเป็น pure function เพื่อเทสต์ได้โดยไม่ต้องมี DB
 *
 * - ต้องยัง `pending`
 * - ต้องยังอยู่ **ขั้นแรก** (`current_approval_level === 1`) — ใบที่อนุมัติขั้น 1 แล้ว
 *   และค้างอยู่ขั้นถัดไปจะไม่ถูกยกเลิก
 * - อายุเกิน N วันนับจาก `created_at` (ปฏิทิน 30×24 ชม. ไม่ใช่วันทำการ)
 */
export function shouldAutoCancel(
  candidate: AutoCancelCandidateState,
  now: Date,
  days: number = AUTO_CANCEL_DAYS_DEFAULT,
): boolean {
  if (candidate.leaveStatus !== "pending") return false;
  if (candidate.currentLevel !== 1) return false;
  return candidate.createdAt.getTime() < autoCancelCutoff(now, days).getTime();
}

/** เวลาตัดยอด: ใบที่ `created_at` เก่ากว่านี้ถือว่า "ค้างเกิน N วัน" */
export function autoCancelCutoff(now: Date, days: number = AUTO_CANCEL_DAYS_DEFAULT): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

// ──────────────────────────────────────
// รายการเตือน "ใบลาค้างอนุมัติเกิน N วัน" (อ่านอย่างเดียว ไม่ยกเลิกอะไร)
// ใช้ pure function ชุดเดียวกับ cron เพื่อไม่ให้ dashboard กับ cron ขัดกัน
// ──────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

export type StalePendingState = {
  /** ค่าของ `DataLeave.leave_status` */
  leaveStatus: string;
  createdAt: Date;
  /**
   * `acted_at` ของขั้นที่อนุมัติล่าสุด (null = ยังไม่มีใครอนุมัติเลย)
   * ใช้เป็นจุดเริ่มนับ "ค้างที่ขั้นปัจจุบัน" — ใบที่อนุมัติขั้น 1–2 แล้ว
   * ไม่ควรถูกลงโทษด้วยเวลาที่ผู้อนุมัติใช้ไปในขั้นก่อนหน้า
   */
  lastApprovedAt: Date | null;
};

/** จุดเริ่มต้นของการรออนุมัติ: วันที่เข้าสู่ขั้นปัจจุบัน */
export function waitingSinceOf(candidate: StalePendingState): Date {
  return candidate.lastApprovedAt ?? candidate.createdAt;
}

/** จำนวนวันที่ค้าง (ปัดลง, ไม่ติดลบ) */
export function waitingDays(waitingSince: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - waitingSince.getTime()) / DAY_MS));
}

/**
 * ใบนี้ "ค้างอนุมัติเกิน N วัน" หรือไม่
 *
 * - ต้องยัง `pending`
 * - นับจาก `lastApprovedAt ?? created_at` (ไม่กรองขั้น — ครอบใบที่ค้างขั้น 2, 3 ด้วย)
 * - ต้อง **เกิน** N วัน (เท่ากับ N พอดี = ยังไม่เตือน)
 *
 * ใบที่ยังอยู่ขั้นแรกจะได้ผลตรงกับ `shouldAutoCancel` ทุกประการ (จุดเริ่มนับเดียวกัน)
 */
export function isStalePending(
  candidate: StalePendingState,
  now: Date,
  days: number = AUTO_CANCEL_DAYS_DEFAULT,
): boolean {
  if (candidate.leaveStatus !== "pending") return false;
  return waitingSinceOf(candidate).getTime() < autoCancelCutoff(now, days).getTime();
}
