import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSections, createSection } from "@/lib/services/leaveService";
import { createSectionSchema } from "@/lib/TypeSchema";

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

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const hrError = await checkHR(session);
    if (hrError) return hrError;

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("department_id") || undefined;

    const sections = await getSections(departmentId);
    return NextResponse.json({ data: sections });
  } catch (error) {
    console.error("Error in GET /api/hr/sections:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const hrError = await checkHR(session);
    if (hrError) return hrError;

    const body = await request.json();
    const parsed = createSectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join(", ") },
        { status: 400 },
      );
    }

    const section = await createSection(parsed.data);
    return NextResponse.json({ data: section }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in POST /api/hr/sections:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
