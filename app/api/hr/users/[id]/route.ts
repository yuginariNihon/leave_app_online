import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { apiErrorResponse } from "@/lib/errors";
import { getUserById, getUserRoleNames } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET(
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

    // HR must not see SUPER_ADMIN accounts at all → hide (404).
    if (!session.roles.includes("SUPER_ADMIN")) {
      const targetRoles = await getUserRoleNames(id);
      if (targetRoles.includes("SUPER_ADMIN")) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
