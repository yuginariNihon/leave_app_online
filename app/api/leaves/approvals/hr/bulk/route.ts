import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hrBulkUpdateApprovalStatus } from "@/lib/services/approvalService";
import { getSessionUser } from "@/lib/auth";

const bulkApprovalSchema = z.object({
  approvalIds: z.array(z.string()).min(1),
  status: z.enum(["approved", "rejected"]),
  comment: z.string().trim().max(200).optional(),
});

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  const session = await getSessionUser();
  if (!session?.staffId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bulkApprovalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const { approvalIds, status, comment } = parsed.data;

  try {
    await hrBulkUpdateApprovalStatus(approvalIds, session.staffId, status, comment);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to bulk update approvals." }, { status: 400 });
  }
}
