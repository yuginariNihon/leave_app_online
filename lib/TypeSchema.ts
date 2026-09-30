import z from "zod";

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

// วันที่ต้องเป็น YYYY-MM-DD เท่านั้น (กัน "abc" ที่จะกลายเป็น Invalid Date → 500)
const dateOnlyString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)");

const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น HH:mm)");

export const leaveModeSchema = z.enum(["day", "hour"]);

const timeToMinutes = (t: string | undefined): number => {
  if (!t) return Number.NaN;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

// Rule สำหรับลารายชั่วโมง: ต้องอยู่ภายในช่วงทำงาน 08:00–17:00,
// ไม่ทับช่วงพักเที่ยง 12:00–13:00, และเวลาสิ้นสุดต้องหลังเวลาเริ่มต้น
function hourWindowRefine<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
  return schema.superRefine((data: z.infer<T>, ctx) => {
    const { leaveMode, startTime, endTime } = data as { leaveMode?: string; startTime?: string; endTime?: string };
    if (leaveMode !== "hour") return;
    const WORK_START = 8 * 60;
    const LUNCH_START = 12 * 60;
    const LUNCH_END = 13 * 60;
    const WORK_END = 17 * 60;
    const s = timeToMinutes(startTime);
    const e = timeToMinutes(endTime);
    if (Number.isNaN(s) || Number.isNaN(e)) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "กรุณากรอกเวลาเริ่มต้นและเวลาสิ้นสุด" });
      return;
    }
    if (e <= s) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "เวลาสิ้นสุดต้องหลังเวลาเริ่มต้น" });
      return;
    }
    if (s < WORK_START || e > WORK_END) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "เวลาลารายชั่วโมงต้องอยู่ระหว่าง 08:00–17:00" });
      return;
    }
    const sInLunch = s >= LUNCH_START && s < LUNCH_END;
    const eInLunch = e > LUNCH_START && e <= LUNCH_END;
    const crossesLunch = s < LUNCH_START && e > LUNCH_END;
    if (sInLunch || eInLunch || crossesLunch) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "ไม่สามารถลาช่วงพักเที่ยง (12:00–13:00) ได้" });
    }
  });
}

// Rule ทั่วไป: endDate ต้องไม่ก่อน startDate (attach ไปที่ field endDate)
function refineDateOrder<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
  return schema.superRefine((data: z.infer<T>, ctx) => {
    const { startDate, endDate } = data as { startDate?: string; endDate?: string };
    if (startDate && endDate && endDate < startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น",
      });
    }
  });
}

// Schema และ Type ที่ Export ออกไปให้หน้า Insert และ Edit ใช้ร่วมกัน
export const leaveFormSchema = hourWindowRefine(refineDateOrder(z.object({
  leaveTypeId: z.uuid("กรุณาเลือกประเภทการลา"),
  leaveCaseId: z.uuid("กรุณาเลือกกรณีการลา"),
  startDate: dateOnlyString,
  endDate: dateOnlyString,
  reason: z.string().min(1, "กรุณากรอกเหตุผลการลาอย่างน้อย 1 ตัวอักษร"),
  leavePeriod: z.enum(["full_day", "morning", "afternoon"]).optional(),
  leaveMode: leaveModeSchema.optional(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
})));

export type LeaveFormValues = z.infer<typeof leaveFormSchema>;

// totalDays ไม่รับจาก client — server คำนวณเองจากวันที่ + leavePeriod เสมอ
export const createLeaveRequestSchema = refineDateOrder(z.object({
  staffId: z.uuid().optional(),
  leaveTypeId: z.uuid(),
  leaveCaseId: z.uuid(),
  startDate: dateOnlyString,
  endDate: dateOnlyString,
  reason: z.string().trim().min(1, "กรุณากรอกเหตุผลการลาอย่างน้อย 1 ตัวอักษร").max(500, "เหตุผลการลาต้องไม่เกิน 500 ตัวอักษร"),
  leavePeriod: z.enum(["full_day", "morning", "afternoon"]).optional(),
  leaveMode: leaveModeSchema.optional(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
}));

export type CreateLeaveRequestValues = z.infer<typeof createLeaveRequestSchema>;

// ────────────────────────────────────
// Staff Edit Schema
// ────────────────────────────────────

export const updateStaffSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  departmentId: z.string().min(1, "กรุณาเลือกแผนก"),
  positionId: z.string().min(1, "กรุณาเลือกตำแหน่ง"),
  sectionId: z.string().optional().nullable(),
  employmentTypeId: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง").optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  employmentStatus: z.enum(["active", "inactive", "probation", "terminated"]).optional(),
});

export type UpdateStaffValues = z.infer<typeof updateStaffSchema>;

// ────────────────────────────────────
// Staff Create Schema
// ────────────────────────────────────

export const createStaffSchema = z.object({
  staffCode: z.string().min(1, "กรุณากรอกรหัสพนักงาน").regex(/^[A-Z]{3}/, "รหัสพนักงาน 3 ตัวแรกต้องเป็นอักษรภาษาอังกฤษพิมพ์ใหญ่"),
  name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  departmentId: z.string().min(1, "กรุณาเลือกแผนก"),
  positionId: z.string().min(1, "กรุณาเลือกตำแหน่ง"),
  sectionId: z.string().optional().nullable(),
  employmentTypeId: z.string().optional().nullable(),
  phoneNumber: z.string().min(1, "กรุณากรอกเบอร์โทรศัพท์"),
  email: z.string().min(1, "กรุณากรอกอีเมล").email("กรุณากรอกอีเมลให้ถูกต้อง"),
  dateOfBirth: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  employmentStatus: z.enum(["active", "inactive", "probation", "terminated"]).optional(),
});

export type CreateStaffValues = z.infer<typeof createStaffSchema>;

// ────────────────────────────────────
// Staff Import Schema
// ────────────────────────────────────

export const importStaffSchema = z.object({
  staffCode: z.string().min(1, "กรุณากรอกรหัสพนักงาน").regex(/^[A-Z]{3}/, "รหัสพนักงาน 3 ตัวแรกต้องเป็นอักษรภาษาอังกฤษพิมพ์ใหญ่"),
  name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  departmentName: z.string().min(1, "กรุณากรอกชื่อแผนก"),
  positionName: z.string().min(1, "กรุณากรอกชื่อตำแหน่ง"),
  sectionName: z.string().optional().nullable(),
  employmentTypeName: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().trim().max(0, "email ว่างได้").or(z.string().email()).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
});

// ────────────────────────────────────
// Department Schemas
// ────────────────────────────────────

export const createDepartmentSchema = z.object({
  departmentCode: z.string().min(1, "กรุณากรอกรหัสแผนก"),
  departmentName: z.string().min(1, "กรุณากรอกชื่อแผนก"),
});

export type CreateDepartmentValues = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  departmentCode: z.string().min(1, "กรุณากรอกรหัสแผนก"),
  departmentName: z.string().min(1, "กรุณากรอกชื่อแผนก"),
});

export type UpdateDepartmentValues = z.infer<typeof updateDepartmentSchema>;

// ────────────────────────────────────
// Position Schemas
// ────────────────────────────────────

export const createPositionSchema = z.object({
  positionName: z.string().min(1, "กรุณากรอกชื่อตำแหน่ง"),
  positionLevel: z.coerce.number().int().optional().nullable(),
});

export type CreatePositionValues = z.infer<typeof createPositionSchema>;

export const updatePositionSchema = z.object({
  positionName: z.string().min(1, "กรุณากรอกชื่อตำแหน่ง"),
  positionLevel: z.coerce.number().int().optional().nullable(),
});

export type UpdatePositionValues = z.infer<typeof updatePositionSchema>;

// ────────────────────────────────────
// LeaveType Schemas
// ────────────────────────────────────

export const createLeaveTypeSchema = z.object({
  leaveTypeName: z.string().min(1, "กรุณากรอกชื่อประเภทการลา"),
  maxDaysPerYear: z.coerce.number().int().positive().optional().nullable(),
  isPaid: z.boolean().optional(),
  requiresAttachment: z.boolean().optional(),
});

export type CreateLeaveTypeValues = z.infer<typeof createLeaveTypeSchema>;

export const updateLeaveTypeSchema = z.object({
  leaveTypeName: z.string().min(1, "กรุณากรอกชื่อประเภทการลา"),
  maxDaysPerYear: z.coerce.number().int().positive().optional().nullable(),
  isPaid: z.boolean().optional(),
  requiresAttachment: z.boolean().optional(),
});

export type UpdateLeaveTypeValues = z.infer<typeof updateLeaveTypeSchema>;

// ────────────────────────────────────
// EmploymentType Schemas
// ────────────────────────────────────

export const createEmploymentTypeSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อประเภทพนักงาน"),
  thainame: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type CreateEmploymentTypeValues = z.infer<typeof createEmploymentTypeSchema>;

export const updateEmploymentTypeSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อประเภทพนักงาน"),
  thainame: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type UpdateEmploymentTypeValues = z.infer<typeof updateEmploymentTypeSchema>;

// ────────────────────────────────────
// LeaveCase Schemas
// ────────────────────────────────────

export const createLeaveCaseSchema = z.object({
  leaveTypeId: z.string().uuid("กรุณาเลือกประเภทการลา"),
  caseName: z.string().min(1, "กรุณากรอกชื่อกรณีการลา").max(50, "ชื่อกรณีการลาต้องไม่เกิน 50 ตัวอักษร"),
});

export type CreateLeaveCaseValues = z.infer<typeof createLeaveCaseSchema>;

export const updateLeaveCaseSchema = z.object({
  leaveTypeId: z.string().uuid("กรุณาเลือกประเภทการลา"),
  caseName: z.string().min(1, "กรุณากรอกชื่อกรณีการลา").max(50, "ชื่อกรณีการลาต้องไม่เกิน 50 ตัวอักษร"),
});

export type UpdateLeaveCaseValues = z.infer<typeof updateLeaveCaseSchema>;

// ────────────────────────────────────
// Workflow Step Schemas
// ────────────────────────────────────

export const updateWorkflowStepSchema = z.object({
  approverType: z.enum([
    "Supervisor",
    "Senior_Supervisor",
    "Supervisor_or_Senior_Supervisor",
    "Assistant_Manager",
    "Department_Manager",
    "General_Manager",
    "Director",
    "HR",
    "Specific_Person",
  ]),
  isRequired: z.boolean().default(true),
});

export type UpdateWorkflowStepValues = z.infer<typeof updateWorkflowStepSchema>;

export const updateWorkflowStepsSchema = z.object({
  steps: z.array(updateWorkflowStepSchema).min(1, "ต้องมีอย่างน้อย 1 ขั้นตอน"),
});

export type UpdateWorkflowStepsValues = z.infer<typeof updateWorkflowStepsSchema>;

export const createWorkflowStepSchema = z.object({
  approverType: z.enum([
    "Supervisor",
    "Senior_Supervisor",
    "Supervisor_or_Senior_Supervisor",
    "Assistant_Manager",
    "Department_Manager",
    "General_Manager",
    "Director",
    "HR",
    "Specific_Person",
  ]),
  isRequired: z.boolean().default(true),
});

export type CreateWorkflowStepValues = z.infer<typeof createWorkflowStepSchema>;

export const createWorkflowSchema = z.object({
  positionId: z.string().uuid("กรุณาเลือกตำแหน่ง"),
  steps: z.array(createWorkflowStepSchema).min(1, "ต้องมีอย่างน้อย 1 ขั้นตอน"),
});

export type CreateWorkflowValues = z.infer<typeof createWorkflowSchema>;

// ────────────────────────────────────
// Section Schemas
// ────────────────────────────────────

export const createSectionSchema = z.object({
  sectionCode: z.string().min(1, "กรุณากรอกรหัสส่วนงาน"),
  sectionName: z.string().min(1, "กรุณากรอกชื่อส่วนงาน"),
  departmentId: z.string().uuid("กรุณาเลือกแผนก"),
});

export type CreateSectionValues = z.infer<typeof createSectionSchema>;

export const updateSectionSchema = z.object({
  sectionCode: z.string().min(1, "กรุณากรอกรหัสส่วนงาน"),
  sectionName: z.string().min(1, "กรุณากรอกชื่อส่วนงาน"),
  departmentId: z.string().uuid("กรุณาเลือกแผนก"),
});

export type UpdateSectionValues = z.infer<typeof updateSectionSchema>;

// ──────────────────────────────────────────────
// Leave quota bulk assign (HR)
// ──────────────────────────────────────────────

export const leaveQuotaAssignSchema = z.object({
  leaveTypeId: z.uuid("รูปแบบประเภทการลาไม่ถูกต้อง"),
  staffIds: z.array(z.uuid("รูปแบบรหัสพนักงานไม่ถูกต้อง")).min(1, "กรุณาเลือกพนักงานอย่างน้อย 1 คน"),
  maxDays: z.coerce
    .number()
    .min(0, "จำนวนวันต้องไม่ติดลบ")
    .max(999, "จำนวนวันต้องไม่เกิน 999 วัน"),
});

export type LeaveQuotaAssignValues = z.infer<typeof leaveQuotaAssignSchema>;

