import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getHolidays, createHoliday } from "@/lib/services/leaveService";

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

export async function GET() {
  try {
    const session = await getSessionUser();
    const hrError = await checkHR(session);
    if (hrError) return hrError;

    const holidays = await getHolidays();
    return NextResponse.json({ data: holidays });
  } catch (error) {
    console.error("Error in GET /api/hr/holidays:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const hrError = await checkHR(session);
    if (hrError) return hrError;

    const body = await request.json();
    if (!body.holidayName || !body.holidayDate) {
      return NextResponse.json(
        { error: "holidayName and holidayDate are required" },
        { status: 400 },
      );
    }

    const holiday = await createHoliday(body);
    return NextResponse.json({ data: holiday }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in POST /api/hr/holidays:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
