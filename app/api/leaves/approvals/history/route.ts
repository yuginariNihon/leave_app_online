import { NextRequest, NextResponse } from "next/server";
import { getApprovalHistory } from "@/lib/services/approvalService";
import { requireAuth } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parsePagination } from "@/lib/http";
import { logReadAccess } from "@/lib/services/auditService";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const { page, limit } = parsePagination(searchParams, { defaultLimit: 10 });

    const rawLeaveTypeId = searchParams.get("leaveTypeId");
    const leaveTypeId = (rawLeaveTypeId && rawLeaveTypeId !== "all" && rawLeaveTypeId !== "undefined") ? rawLeaveTypeId : undefined;

    const result = await getApprovalHistory(session.staffId, {
      search: searchParams.get("search") || undefined,
      leaveTypeId,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      roleType: (searchParams.get("roleType") as "approver" | "hr" | "all") || undefined,
      page,
      limit,
    });

    const headersList = await headers();
    logReadAccess(session.userId, session.staffId, "approval-history", undefined, headersList.get("x-forwarded-for")?.split(",")[0].trim(), headersList.get("user-agent") ?? undefined);

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
