import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateRoleName, toggleRoleActive } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.roles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    if (typeof body.roleName === "string") {
      const data = await updateRoleName(id, body.roleName);
      return NextResponse.json({ data });
    }

    if (typeof body.isActive === "boolean") {
      const data = await toggleRoleActive(id, body.isActive);
      return NextResponse.json({ data });
    }

    return NextResponse.json(
      { error: "roleName (string) or isActive (boolean) is required" },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in PATCH /api/admin/roles/[id]:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}