import { NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getAllRoles } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const roles = await getAllRoles();
    return NextResponse.json({ data: roles });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
