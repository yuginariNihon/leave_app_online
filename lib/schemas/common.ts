import z from "zod";

/**
 * Helper ที่ใช้ร่วมกันทุก schema (ไม่ผูกกับโดเมนใดโดเมนหนึ่ง)
 * แยกออกมาเพื่อให้ `leave.ts`, `staff.ts`, … ใช้ตัวเดียวกัน
 */

// วันที่ต้องเป็น YYYY-MM-DD เท่านั้น (กัน "abc" ที่จะกลายเป็น Invalid Date → 500)
export const dateOnlyString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)");

export const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น HH:mm)");

const timeToMinutes = (t: string | undefined): number => {
  if (!t) return Number.NaN;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

// Rule สำหรับลารายชั่วโมง: ต้องกรอกเวลาเริ่ม/สิ้นสุด และเวลาสิ้นสุดต้องหลังเวลาเริ่มต้น
// (ผู้ใช้เลือกช่วงเวลาได้อิสระ ไม่จำกัดช่วงทำงาน/พักเที่ยง — เซิร์ฟเวอร์ตรวจซ้ำอีกชั้น)
export function hourWindowRefine<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
  return schema.superRefine((data: z.infer<T>, ctx) => {
    const { leaveMode, startTime, endTime } = data as {
      leaveMode?: string;
      startTime?: string;
      endTime?: string;
    };
    if (leaveMode !== "hour") return;
    const s = timeToMinutes(startTime);
    const e = timeToMinutes(endTime);
    if (Number.isNaN(s) || Number.isNaN(e)) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "กรุณากรอกเวลาเริ่มต้นและเวลาสิ้นสุด",
      });
      return;
    }
    if (e <= s) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "เวลาสิ้นสุดต้องหลังเวลาเริ่มต้น",
      });
    }
  });
}

// Rule ทั่วไป: endDate ต้องไม่ก่อน startDate (attach ไปที่ field endDate)
export function refineDateOrder<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
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
