import { NextResponse } from "next/server";
import { requireHR } from "@/lib/auth/api-guards";
import { apiErrorResponse } from "@/lib/core/errors";
import { getStaffMasterData } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const data = await getStaffMasterData();
    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
