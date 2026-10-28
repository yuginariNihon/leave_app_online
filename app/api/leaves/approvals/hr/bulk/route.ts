import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hrBulkUpdateApprovalStatus } from "@/lib/services/approvalService";
import { requireAuth } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody } from "@/lib/http";

const bulkApprovalSchema = z.object({
  approvalIds: z.array(z.string()).min(1),
  status: z.enum(["approved", "rejected"]),
  comment: z.string().trim().max(200).optional(),
});

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { approvalIds, status, comment } = await parseBody(request, bulkApprovalSchema);

    await hrBulkUpdateApprovalStatus(approvalIds, session.staffId, status, comment);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
