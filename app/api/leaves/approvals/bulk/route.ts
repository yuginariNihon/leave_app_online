import { NextRequest, NextResponse } from "next/server";
import { bulkUpdateApprovalStatus } from "@/lib/services/approvalService";
import { getSessionUser } from "@/lib/auth";
import { ApprovalStatus } from "@/lib/generated/prisma/enums";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  const session = await getSessionUser();
  if (!session?.staffId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { approvalIds, status, comment } = body;

  if (!Array.isArray(approvalIds) || approvalIds.length === 0) {
    return NextResponse.json(
      { error: "approvalIds must be a non-empty array." },
      { status: 400 },
    );
  }

  if (status !== ApprovalStatus.approved && status !== ApprovalStatus.rejected) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    await bulkUpdateApprovalStatus(approvalIds, session.staffId, status, comment);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to bulk update.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
