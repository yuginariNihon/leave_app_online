import z from "zod";

// ──────────────────────────────────────────────
// My profile (self-service)
// ──────────────────────────────────────────────
// อีเมล/เบอร์โทรไม่บังคับ และไม่ตรวจรูปแบบอีเมล — คงพฤติกรรมเดิมของ route ไว้
// (ข้อมูลเก่าบางรายการไม่ใช่อีเมลมาตรฐาน ถ้าเพิ่ม .email() จะบันทึกไม่ได้)

export const updateMyProfileSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อ-นามสกุล").max(100, "ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร"),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
});

export type UpdateMyProfileValues = z.infer<typeof updateMyProfileSchema>;
