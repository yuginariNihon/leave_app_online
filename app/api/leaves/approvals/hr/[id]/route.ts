import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hrUpdateApprovalStatus } from "@/lib/services/approvalService";
import { getSessionUser } from "@/lib/auth";

const approvalSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  comment: z.string().trim().max(200).optional(),
});

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
