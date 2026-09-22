import { NextRequest, NextResponse } from "next/server";
import { updateApprovalStatus } from "@/lib/services/approvalService";
import { requireAuth } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { ApprovalStatus } from "@/lib/generated/prisma/enums";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireAuth();
  if (error) return error;

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
    return apiErrorResponse(error);
  }
}
