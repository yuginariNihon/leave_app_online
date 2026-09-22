import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getLeaveRightsByStaffId } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

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
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const { id } = await params;

    const exists = await prisma.staffInfo.findUnique({
      where: { staff_id: id },
      select: { staff_id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "ไม่พบข้อมูลพนักงาน (อาจถูกลบไปแล้ว)" }, { status: 404 });
    }

    const body = await request.json();
    const { quotas } = body;

    if (!Array.isArray(quotas) || quotas.length === 0) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง: ไม่พบรายการสิทธิ์ลาที่จะบันทึก" }, { status: 400 });
    }

    const year = new Date().getFullYear();

    for (const q of quotas) {
      if (!q.leaveTypeId || typeof q.maxDays !== "number" || typeof q.usedDays !== "number") {
        return NextResponse.json(
          { error: "ข้อมูลไม่ถูกต้อง: แต่ละรายการต้องระบุ leaveTypeId, maxDays (ตัวเลข), usedDays (ตัวเลข)" },
          { status: 400 },
        );
      }
      if (q.usedDays < 0 || q.maxDays < 0) {
        return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง: ค่าจำนวนวันต้องไม่ติดลบ" }, { status: 400 });
      }
      if (q.usedDays > q.maxDays) {
        return NextResponse.json(
          { error: `ข้อมูลไม่ถูกต้อง: จำนวนวันลาที่ใช้แล้ว (${q.usedDays}) ต้องไม่เกินสิทธิ์วันลา (${q.maxDays})` },
          { status: 400 },
        );
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
    return apiErrorResponse(error);
  }
}
