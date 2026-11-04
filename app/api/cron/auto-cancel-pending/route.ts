import { NextRequest, NextResponse } from "next/server";
import { isCronRequestAuthorized } from "@/lib/cronAuth";
import { logger } from "@/lib/logger";
import { autoCancelStaleLeaves } from "@/lib/services/leave/stalePending";

export const runtime = "nodejs";

/** ต้องพอสำหรับ `after()` ที่ส่งอีเมลแจ้งเจ้าของใบ (Vercel Cron) */
export const maxDuration = 60;

/**
 * ยกเลิกใบลาที่ค้างอนุมัติขั้นแรกเกิน N วัน (ค่าเริ่มต้น 30 วัน)
 *
 * เรียกได้ 2 ทาง (ดู `lib/cronAuth.ts`):
 *  - Vercel Cron → ตั้ง env `CRON_SECRET` แล้ว Vercel เติม `Authorization: Bearer` ให้เอง
 *    (ตารางเวลาใน `vercel.json`)
 *  - ยิงมือ     → `GET /api/cron/auto-cancel-pending?secret=$CRON_SECRET[&dryRun=1][&days=30]`
 *
 * - `dryRun=1` → คืนรายการที่จะถูกยกเลิก โดยไม่เขียน DB
 * - `days`     → override จำนวนวัน (ไม่ใส่ = `PENDING_AUTO_CANCEL_DAYS` หรือ 30)
 */
export async function GET(request: NextRequest) {
  if (!isCronRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const dryRun = params.get("dryRun") === "1" || params.get("dryRun") === "true";
  const daysParam = Number(params.get("days"));

  try {
    const result = await autoCancelStaleLeaves({
      days: Number.isFinite(daysParam) && daysParam > 0 ? daysParam : undefined,
      dryRun,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("cron/auto-cancel-pending", "Auto-cancel run failed.", {
      error: error instanceof Error ? error.message : String(error),
      dryRun,
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
