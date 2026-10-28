import { NextRequest, NextResponse } from "next/server";
import { updateApprovalStatus } from "@/lib/services/approvalService";
import { requireAuth } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const updateApprovalSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  comment: z.string().trim().max(200, "ความคิดเห็นต้องไม่เกิน 200 ตัวอักษร").optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const { status, comment } = await parseBody(request, updateApprovalSchema);

    await updateApprovalStatus(id, session.staffId, status, comment);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
