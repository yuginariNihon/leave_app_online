import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { importStaff } from "@/lib/services/leaveService";
import { importStaffSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { rows } = body as { rows: unknown[] };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "กรุณาส่งข้อมูลพนักงานอย่างน้อย 1 รายการ" }, { status: 400 });
    }

    const validated: Array<{ staffCode: string; name: string; departmentName: string; positionName: string }> = [];
    const schemaErrors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const parsed = importStaffSchema.safeParse(rows[i]);
      if (!parsed.success) {
        schemaErrors.push({
          row: i + 1,
          message: parsed.error.issues.map((e) => e.message).join(", "),
        });
      } else {
        validated.push(parsed.data);
      }
    }

    if (schemaErrors.length > 0) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", schemaErrors }, { status: 400 });
    }

    const result = await importStaff(validated);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/hr/staff/import:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
