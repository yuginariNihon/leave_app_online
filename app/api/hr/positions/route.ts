import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getPositions, createPosition } from "@/lib/services/leaveService";
import { createPositionSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { session, error } = await requireHR();
    if (error) return error;

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
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

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
    return apiErrorResponse(error);
  }
}
