import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hrUpdateApprovalStatus } from "@/lib/services/approvalService";
import { requireAuth } from "@/lib/api-guards";

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
  const body = await request.json();
  const parsed = approvalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const { status, comment } = parsed.data;

  try {
    await hrUpdateApprovalStatus(id, session.staffId, status, comment);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update approval." }, { status: 400 });
  }
}
