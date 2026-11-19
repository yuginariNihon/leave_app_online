import z from "zod";

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
