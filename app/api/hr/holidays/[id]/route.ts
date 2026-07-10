import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateHoliday, deleteHoliday } from "@/lib/services/leaveService";

export const runtime = "nodejs";

async function checkHR(session: { staffId: string; roles: string[] } | null) {
  if (!session?.staffId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
  if (!isHR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    const hrError = await checkHR(session);
    if (hrError) return hrError;

    const { id } = await params;
    const body = await request.json();
    if (!body.holidayName || !body.holidayDate) {
      return NextResponse.json(
        { error: "holidayName and holidayDate are required" },
        { status: 400 },
      );
    }

    const holiday = await updateHoliday(id, body);
    return NextResponse.json({ data: holiday });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in PUT /api/hr/holidays/[id]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    const hrError = await checkHR(session);
    if (hrError) return hrError;

    const { id } = await params;
    await deleteHoliday(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in DELETE /api/hr/holidays/[id]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
