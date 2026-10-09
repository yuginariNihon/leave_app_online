import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLeaveCalendar } from "@/lib/services/leaveService";
import { apiErrorResponse } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = session.roles.some((r) => ["HR", "SUPER_ADMIN", "APPROVER"].includes(r.toUpperCase()));
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const monthParam = request.nextUrl.searchParams.get("month");
    const result = await getLeaveCalendar(monthParam);

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
