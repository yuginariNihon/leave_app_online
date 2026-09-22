import { NextRequest, NextResponse } from "next/server";
import { cancelLeaveRequest } from "@/lib/services/leaveService";
import { requireAuth } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";

export const runtime = "nodejs";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  let body: { cancelReason?: string } = {};
  try {
    body = await _request.json();
  } catch { /* no body */ }

  try {
    await cancelLeaveRequest(id, session.staffId, body.cancelReason);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
