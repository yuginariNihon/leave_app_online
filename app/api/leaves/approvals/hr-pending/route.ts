import { NextRequest, NextResponse } from "next/server";
import { getHrPendingApprovals } from "@/lib/services/approvalService";
import { getSessionUser } from "@/lib/auth";
import type { ApprovalFilters } from "@/lib/services/approvalService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getSessionUser();
  if (!session?.staffId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);

  const filters: ApprovalFilters = {
    search: searchParams.get("search") || undefined,
    leaveTypeId: searchParams.get("leaveTypeId") || undefined,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
  };

  try {
    const result = await getHrPendingApprovals(session.staffId, page, limit, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch HR pending approvals", error);
    return NextResponse.json(
      { error: "Failed to fetch HR pending approvals." },
      { status: 500 },
    );
  }
}
