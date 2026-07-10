import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLeaveRightsByStaffId } from "@/lib/services/leaveService";

export const runtime = "nodejs";

const CACHE_FIVE_SECONDS =
  "public, max-age=5, stale-while-revalidate=5";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quota = await getLeaveRightsByStaffId(user.staffId);

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
    console.error("Failed to load leave quota", error);
    return NextResponse.json(
      { error: "Failed to load leave quota." },
      { status: 500 },
    );
  }
}
