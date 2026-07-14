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

// Schema และ Type ที่ Export ออกไปให้หน้า Insert และ Edit ใช้ร่วมกัน
export const leaveFormSchema = z.object({
  leaveTypeId: z.uuid("กรุณาเลือกประเภทการลา"),
  leaveCaseId: z.uuid("กรุณาเลือกกรณีการลา"),
  startDate: z.string().min(1, "กรุณาเลือกวันที่เริ่มต้น"),
  endDate: z.string().min(1, "กรุณาเลือกวันที่สิ้นสุด"),
  reason: z.string().min(10, "กรุณากรอกเหตุผลการลาอย่างน้อย 10 ตัวอักษร"),
  leavePeriod: z.enum(["full_day", "morning", "afternoon"]).optional(),
});

export type LeaveFormValues = z.infer<typeof leaveFormSchema>;

export const createLeaveRequestSchema = z.object({
  staffId: z.uuid().optional(),
  leaveTypeId: z.uuid(),
  leaveCaseId: z.uuid(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().trim().min(10).optional(),
  totalDays: z.number().positive().optional(),
  leavePeriod: z.enum(["full_day", "morning", "afternoon"]).optional(),
});

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
  email: z.string().email().optional().nullable(),
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

