import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAvailableWorkflowPositions } from "@/lib/services/leaveService";

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

    const positions = await getAvailableWorkflowPositions();
    return NextResponse.json({ data: positions });
  } catch (error) {
    console.error("Error in GET /api/hr/workflows/available-positions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
