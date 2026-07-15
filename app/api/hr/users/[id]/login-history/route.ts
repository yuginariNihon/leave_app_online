import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { getUserLoginHistory } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionUser();
    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const history = await getUserLoginHistory(id, limit);
    return NextResponse.json({ data: history });
  } catch (error) {
    console.error("Error in GET /api/hr/users/[id]/login-history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
