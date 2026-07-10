import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getStaffMasterData } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await getStaffMasterData();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in GET /api/hr/master-data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
