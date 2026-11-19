import z from "zod";
import { dateOnlyString, hourWindowRefine, refineDateOrder, timeString } from "./common";

/** ตัวเลือกที่ส่งให้ฟอร์มลา (ใช้ร่วม client + server) */
export type LeaveSelectOption = {
  id: string;
  label: string;
};

export type LeaveCaseSelectOption = LeaveSelectOption & {
  leaveTypeId: string;
};

export type LeaveFormOptions = {
  leaveTypes: LeaveSelectOption[];
  leaveCases: LeaveCaseSelectOption[];
};

export const leaveModeSchema = z.enum(["day", "hour"]);

// Schema และ Type ที่ Export ออกไปให้หน้า Insert และ Edit ใช้ร่วมกัน
export const leaveFormSchema = hourWindowRefine(
  refineDateOrder(
    z.object({
      leaveTypeId: z.uuid("กรุณาเลือกประเภทการลา"),
      leaveCaseId: z.uuid("กรุณาเลือกกรณีการลา"),
      startDate: dateOnlyString,
      endDate: dateOnlyString,
      reason: z.string().min(1, "กรุณากรอกเหตุผลการลาอย่างน้อย 1 ตัวอักษร"),
      leavePeriod: z.enum(["full_day", "morning", "afternoon"]).optional(),
      leaveMode: leaveModeSchema.optional(),
      startTime: timeString.optional(),
      endTime: timeString.optional(),
    }),
  ),
);

export type LeaveFormValues = z.infer<typeof leaveFormSchema>;

// totalDays ไม่รับจาก client — server คำนวณเองจากวันที่ + leavePeriod เสมอ
export const createLeaveRequestSchema = refineDateOrder(
  z.object({
    staffId: z.uuid().optional(),
    leaveTypeId: z.uuid(),
    leaveCaseId: z.uuid(),
    startDate: dateOnlyString,
    endDate: dateOnlyString,
    reason: z
      .string()
      .trim()
      .min(1, "กรุณากรอกเหตุผลการลาอย่างน้อย 1 ตัวอักษร")
      .max(500, "เหตุผลการลาต้องไม่เกิน 500 ตัวอักษร"),
    leavePeriod: z.enum(["full_day", "morning", "afternoon"]).optional(),
    leaveMode: leaveModeSchema.optional(),
    startTime: timeString.optional(),
    endTime: timeString.optional(),
  }),
);

export type CreateLeaveRequestValues = z.infer<typeof createLeaveRequestSchema>;

// ──────────────────────────────────────────────
// Leave quota bulk assign (HR)
// ──────────────────────────────────────────────

export const leaveQuotaAssignSchema = z.object({
  leaveTypeId: z.uuid("รูปแบบประเภทการลาไม่ถูกต้อง"),
  staffIds: z
    .array(z.uuid("รูปแบบรหัสพนักงานไม่ถูกต้อง"))
    .min(1, "กรุณาเลือกพนักงานอย่างน้อย 1 คน"),
  maxDays: z.coerce
    .number()
    .min(0, "จำนวนวันต้องไม่ติดลบ")
    .max(999, "จำนวนวันต้องไม่เกิน 999 วัน"),
});

export type LeaveQuotaAssignValues = z.infer<typeof leaveQuotaAssignSchema>;
