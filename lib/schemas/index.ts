/**
 * Barrel ของ schema ทั้งหมด (แทน `lib/TypeSchema.ts` เดิม)
 *
 * แยกไฟล์ตามโดเมนเพื่อให้หา schema ได้เร็ว แต่ยัง import ผ่าน
 * `@/lib/schemas` ได้เหมือนเดิม — callers ไม่ต้องเปลี่ยนชื่อ module
 */
export * from "./common";
export * from "./leave";
export * from "./staff";
export * from "./master-data";
export * from "./workflow";
export * from "./profile";
