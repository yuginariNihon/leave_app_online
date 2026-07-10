import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getLeaveRightsByStaffId } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const exists = await prisma.staffInfo.findUnique({
      where: { staff_id: id },
      select: { staff_id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const quota = await getLeaveRightsByStaffId(id);
    return NextResponse.json({ data: quota });
  } catch (error) {
    console.error("Error in GET /api/hr/staff/[id]/leave-quota:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const exists = await prisma.staffInfo.findUnique({
      where: { staff_id: id },
      select: { staff_id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const body = await request.json();
    const { quotas } = body;

    if (!Array.isArray(quotas) || quotas.length === 0) {
      return NextResponse.json({ error: "quotas array is required" }, { status: 400 });
    }

    const year = new Date().getFullYear();

    for (const q of quotas) {
      if (!q.leaveTypeId || typeof q.maxDays !== "number" || typeof q.usedDays !== "number") {
        return NextResponse.json(
          { error: "Each quota must have leaveTypeId, maxDays (number), usedDays (number)" },
          { status: 400 },
        );
      }
      if (q.usedDays < 0 || q.maxDays < 0) {
        return NextResponse.json({ error: "Values must not be negative" }, { status: 400 });
      }
    }

    await prisma.$transaction(
      quotas.map((q: { leaveTypeId: string; maxDays: number; usedDays: number }) =>
        prisma.userLeaveLimit.upsert({
          where: {
            staff_id_leave_type_id_year: {
              staff_id: id,
              leave_type_id: q.leaveTypeId,
              year,
            },
          },
          update: {
            max_days: q.maxDays,
            used_days: q.usedDays,
          },
          create: {
            staff_id: id,
            leave_type_id: q.leaveTypeId,
            year,
            max_days: q.maxDays,
            used_days: q.usedDays,
          },
        }),
      ),
    );

    const updated = await getLeaveRightsByStaffId(id, year);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error in PUT /api/hr/staff/[id]/leave-quota:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
