import { NextRequest, NextResponse } from "next/server";
import { bulkUpdateApprovalStatus } from "@/lib/services/approvalService";
import { requireAuth } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const bulkApprovalSchema = z.object({
  approvalIds: z.array(z.string().uuid("approvalIds ต้องเป็น uuid")).min(1, "approvalIds ต้องไม่เว้นว่าง"),
  status: z.enum(["approved", "rejected"]),
  comment: z.string().trim().max(200, "ความคิดเห็นต้องไม่เกิน 200 ตัวอักษร").optional(),
});

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { approvalIds, status, comment } = await parseBody(request, bulkApprovalSchema);

    await bulkUpdateApprovalStatus(approvalIds, session.staffId, status, comment);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
