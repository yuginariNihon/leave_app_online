import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { updateRoleName, toggleRoleActive } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

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
    return apiErrorResponse(error);
  }
}