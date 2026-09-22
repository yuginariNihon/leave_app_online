import { NextRequest, NextResponse } from "next/server";
import { getPendingApprovals } from "@/lib/services/approvalService";
import { requireAuth } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import type { ApprovalFilters } from "@/lib/services/approvalService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);

  const rawLeaveTypeId = searchParams.get("leaveTypeId");
  const leaveTypeId = (rawLeaveTypeId && rawLeaveTypeId !== "all" && rawLeaveTypeId !== "undefined") ? rawLeaveTypeId : undefined;

  const filters: ApprovalFilters = {
    search: searchParams.get("search") || undefined,
    leaveTypeId,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
  };

  try {
    const result = await getPendingApprovals(session.staffId, page, limit, filters);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
