import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { resetUserPassword } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionUser();
    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const result = await resetUserPassword(id);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error in PATCH /api/hr/users/[id]/reset-password:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
