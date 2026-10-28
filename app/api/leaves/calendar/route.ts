import { NextRequest, NextResponse } from "next/server";
import { requireAnyRole } from "@/lib/api-guards";
import { getLeaveCalendar } from "@/lib/services/leaveService";
import { apiErrorResponse } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAnyRole(["HR", "SUPER_ADMIN", "APPROVER"]);
    if (error) return error;

    const monthParam = request.nextUrl.searchParams.get("month");
    const result = await getLeaveCalendar(monthParam);

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
