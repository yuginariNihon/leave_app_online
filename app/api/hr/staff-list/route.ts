import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getStaffList } from "@/lib/services/leaveService";
import { logReadAccess } from "@/lib/services/auditService";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireHR();
    if (error) return error;

    const { searchParams } = request.nextUrl;

    const result = await getStaffList({
      search: searchParams.get("search") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
    }, session.roles.includes("SUPER_ADMIN"));

    const headersList = await headers();
    logReadAccess(session.userId, session.staffId, "staff-list", undefined, headersList.get("x-forwarded-for")?.split(",")[0].trim(), headersList.get("user-agent") ?? undefined);

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
