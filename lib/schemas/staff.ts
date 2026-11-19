import z from "zod";

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
  staffCode: z
    .string()
    .min(1, "กรุณากรอกรหัสพนักงาน")
    .regex(/^[A-Z]{3}/, "รหัสพนักงาน 3 ตัวแรกต้องเป็นอักษรภาษาอังกฤษพิมพ์ใหญ่"),
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
  staffCode: z
    .string()
    .min(1, "กรุณากรอกรหัสพนักงาน")
    .regex(/^[A-Z]{3}/, "รหัสพนักงาน 3 ตัวแรกต้องเป็นอักษรภาษาอังกฤษพิมพ์ใหญ่"),
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
