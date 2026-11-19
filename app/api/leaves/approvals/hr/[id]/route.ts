import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hrUpdateApprovalStatus } from "@/lib/services/approvalService";
import { requireAuth } from "@/lib/auth/api-guards";
import { apiErrorResponse } from "@/lib/core/errors";
import { parseBody } from "@/lib/core/http";

const approvalSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  comment: z.string().trim().max(200).optional(),
});

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const { status, comment } = await parseBody(request, approvalSchema);

    await hrUpdateApprovalStatus(id, session.staffId, status, comment);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
