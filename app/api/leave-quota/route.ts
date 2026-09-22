import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getLeaveRightsByStaffId } from "@/lib/services/leaveService";

export const runtime = "nodejs";

const CACHE_FIVE_SECONDS =
  "public, max-age=5, stale-while-revalidate=5";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const quota = await getLeaveRightsByStaffId(session.staffId);

    const quotaMap: Record<string, { usedDays: number; maxDays: number; remaining: number }> = {};
    for (const item of quota) {
      quotaMap[item.leaveTypeId] = {
        usedDays: item.usedDays,
        maxDays: item.maxDays,
        remaining: item.maxDays - item.usedDays,
      };
    }

    return NextResponse.json(
      { data: quotaMap },
      { headers: { "Cache-Control": CACHE_FIVE_SECONDS } },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
