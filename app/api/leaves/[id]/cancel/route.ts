import { NextRequest, NextResponse } from "next/server";
import { cancelLeaveRequest } from "@/lib/services/leaveService";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session?.staffId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await cancelLeaveRequest(id, session.staffId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to cancel leave", error);

    const message =
      error instanceof Error ? error.message : "Failed to cancel leave.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
