import { NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getStaffRoleList } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const staff = await getStaffRoleList();
    return NextResponse.json({ data: staff });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
