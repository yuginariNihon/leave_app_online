import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSectionById, updateSection, toggleSectionActive } from "@/lib/services/leaveService";
import { updateSectionSchema } from "@/lib/TypeSchema";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    const hrError = await checkHR(session);
    if (hrError) return hrError;

    const { id } = await params;
    const section = await getSectionById(id);
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ data: section });
  } catch (error) {
    console.error("Error in GET /api/hr/sections/[id]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
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
    const parsed = updateSectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join(", ") },
        { status: 400 },
      );
    }

    const section = await updateSection(id, parsed.data);
    return NextResponse.json({ data: section });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in PUT /api/hr/sections/[id]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    const hrError = await checkHR(session);
    if (hrError) return hrError;

    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive (boolean) is required" }, { status: 400 });
    }

    await toggleSectionActive(id, isActive);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in PATCH /api/hr/sections/[id]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
