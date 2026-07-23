import { NextRequest, NextResponse } from "next/server";
import { getStaffList } from "@/lib/services/leaveService";
import { getSessionUser } from "@/lib/auth";
import { logReadAccess } from "@/lib/services/auditService";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;

    const result = await getStaffList({
      search: searchParams.get("search") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
    });

    const headersList = await headers();
    logReadAccess(session.userId, session.staffId, "staff-list", undefined, headersList.get("x-forwarded-for")?.split(",")[0].trim(), headersList.get("user-agent") ?? undefined);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/hr/staff-list:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
