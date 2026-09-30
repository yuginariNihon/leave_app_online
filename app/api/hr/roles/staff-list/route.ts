import { NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getStaffRoleList } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { session, error } = await requireHR();
    if (error) return error;

    const staff = await getStaffRoleList(!session!.roles.includes("SUPER_ADMIN"));
    return NextResponse.json({ data: staff });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
