import { NextRequest, NextResponse } from "next/server";
import { getApprovalHistory } from "@/lib/services/approvalService";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;

    const rawLeaveTypeId = searchParams.get("leaveTypeId");
    const leaveTypeId = (rawLeaveTypeId && rawLeaveTypeId !== "all" && rawLeaveTypeId !== "undefined") ? rawLeaveTypeId : undefined;

    const result = await getApprovalHistory(session.staffId, {
      search: searchParams.get("search") || undefined,
      leaveTypeId,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      roleType: (searchParams.get("roleType") as "approver" | "hr" | "all") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/leaves/approvals/history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
