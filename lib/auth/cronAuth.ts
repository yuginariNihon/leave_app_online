import type { NextRequest } from "next/server";

/**
 * ตรวจสิทธิ์ของ cron endpoint (ใช้ร่วมทุก route ใต้ `app/api/cron/`)
 *
 * รองรับ 2 ทาง:
 *  - `?secret=<CRON_SECRET>` — ยิงมือ (curl/Postman) หรือ scheduler ภายนอก
 *  - `Authorization: Bearer <CRON_SECRET>` — Vercel Cron เติมให้อัตโนมัติ
 *    เมื่อตั้ง env `CRON_SECRET` ในโปรเจกต์ Vercel แล้ว
 *
 * ถ้าไม่ได้ตั้ง `CRON_SECRET` → ปฏิเสธทุกกรณี (fail closed)
 */
export function isCronRequestAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  if (request.nextUrl.searchParams.get("secret") === secret) return true;

  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim() === secret;
  }

  return false;
}
