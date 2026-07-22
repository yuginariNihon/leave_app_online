import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getStaffDetail, updateStaff } from "@/lib/services/leaveService";
import { updateStaffSchema } from "@/lib/TypeSchema";

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
    const staff = await getStaffDetail(id);
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ data: staff });
  } catch (error) {
    console.error("Error in GET /api/hr/staff/[id]:", error);
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
    const parsed = updateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join(", ") },
        { status: 400 },
      );
    }

    const existing = await prisma.staffInfo.findUnique({
      where: { staff_id: id },
      select: { staff_id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const updated = await updateStaff(id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error in PUT /api/hr/staff/[id]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

    const staff = await prisma.staffInfo.findUnique({
      where: { staff_id: id },
      select: {
        staff_id: true,
        staffRoles: {
          select: { role: { select: { role_name: true } } },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // HR deactivation guard: cannot deactivate HR or SUPER_ADMIN
    if (isActive === false) {
      const targetRoles = staff.staffRoles.map((sr) => sr.role.role_name.toUpperCase());
      const isTargetSuperAdmin = targetRoles.includes("SUPER_ADMIN");
      const isTargetHR = targetRoles.includes("HR");
      const isSelf = session?.staffId === id;

      if (isTargetSuperAdmin) {
        return NextResponse.json({ error: "ไม่สามารถปิดใช้งานผู้ใช้ที่อยู่ในระดับ SUPER_ADMIN" }, { status: 403 });
      }
      if (isTargetHR && !session?.roles.includes("SUPER_ADMIN")) {
        return NextResponse.json({ error: "HR ไม่สามารถปิดใช้งานผู้ใช้ระดับ HR อื่นได้" }, { status: 403 });
      }
    }

    await prisma.staffInfo.update({
      where: { staff_id: id },
      data: {
        is_active: isActive,
        terminated_at: isActive ? null : new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/hr/staff/[id]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
