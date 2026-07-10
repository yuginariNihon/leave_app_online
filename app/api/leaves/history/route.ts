import { NextRequest, NextResponse } from "next/server";
import { getLeaveHistoryByStaffId } from "@/lib/services/leaveService";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;

    const exportAll = searchParams.get("exportAll") === "true";

    const result = await getLeaveHistoryByStaffId(session.staffId, {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      leaveTypeId: searchParams.get("leaveTypeId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: exportAll ? undefined : searchParams.get("limit") ? Number(searchParams.get("limit")) : 5,
    });

    return NextResponse.json(result);
  } catch (error) {
    // Ensure API always returns JSON on error to avoid HTML error pages being sent
    console.error("Error in GET /api/leaves/history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
