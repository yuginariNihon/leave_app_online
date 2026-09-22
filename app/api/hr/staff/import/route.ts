import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { importStaff } from "@/lib/services/leaveService";
import { importStaffSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

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
    return apiErrorResponse(error);
  }
}
