import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { requireHR } from "@/lib/auth/api-guards";
import { apiErrorResponse } from "@/lib/core/errors";
import { parseBody } from "@/lib/core/http";
import { getPositions, createPosition } from "@/lib/services/leaveService";
import { createPositionSchema } from "@/lib/schemas";

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

    const input = await parseBody(request, createPositionSchema);
    const pos = await createPosition(input);
    return NextResponse.json({ data: pos }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
