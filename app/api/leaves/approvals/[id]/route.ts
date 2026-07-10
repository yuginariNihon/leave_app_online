import { NextRequest, NextResponse } from "next/server";
import { updateApprovalStatus } from "@/lib/services/approvalService";
import { getSessionUser } from "@/lib/auth";
import { ApprovalStatus } from "@/lib/generated/prisma/enums";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session?.staffId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, comment } = body;

  if (status !== ApprovalStatus.approved && status !== ApprovalStatus.rejected) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    await updateApprovalStatus(id, session.staffId, status, comment);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update approval.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
