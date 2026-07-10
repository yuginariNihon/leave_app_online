import { NextRequest, NextResponse } from "next/server";
import { getLeaveReport } from "@/lib/services/leaveService";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;

    const result = await getLeaveReport({
      search: searchParams.get("search") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      leaveTypeId: searchParams.get("leaveTypeId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/hr/leave-report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
