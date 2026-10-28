import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody, parsePagination } from "@/lib/http";
import { createStaff, getStaffList } from "@/lib/services/leaveService";
import { logReadAccess } from "@/lib/services/auditService";
import { createStaffSchema } from "@/lib/TypeSchema";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireHR();
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const { page, limit } = parsePagination(searchParams, { defaultLimit: 10 });

    const result = await getStaffList(
      {
        search: searchParams.get("search") || undefined,
        departmentId: searchParams.get("departmentId") || undefined,
        status: searchParams.get("status") || undefined,
        page,
        limit,
      },
      session.roles.includes("SUPER_ADMIN"),
    );

    const headersList = await headers();
    logReadAccess(
      session.userId,
      session.staffId,
      "staff-list",
      undefined,
      headersList.get("x-forwarded-for")?.split(",")[0].trim(),
      headersList.get("user-agent") ?? undefined,
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const input = await parseBody(request, createStaffSchema);
    const staff = await createStaff(input);
    return NextResponse.json({ data: staff }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
