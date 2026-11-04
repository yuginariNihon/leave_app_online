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
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
