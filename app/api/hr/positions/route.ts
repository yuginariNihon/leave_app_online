import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getPositions, createPosition } from "@/lib/services/leaveService";
import { createPositionSchema } from "@/lib/TypeSchema";

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

    const [positions, activeRoles] = await Promise.all([
      getPositions(),
      prisma.role.findMany({
        where: { is_active: true },
        select: { role_id: true, role_name: true },
        orderBy: { role_name: "asc" },
      }),
    ]);
    const canManageDefaultRole = session?.roles.includes("SUPER_ADMIN") ?? false;
    return NextResponse.json({
      data: positions,
      meta: { canManageDefaultRole, activeRoles },
    });
  } catch (error) {
    console.error("Error in GET /api/hr/positions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const hrError = await checkHR(session);
    if (hrError) return hrError;

    const body = await request.json();
    const parsed = createPositionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join(", ") },
        { status: 400 },
      );
    }

    const pos = await createPosition(parsed.data);
    return NextResponse.json({ data: pos }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in POST /api/hr/positions:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
