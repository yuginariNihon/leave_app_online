import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse, ValidationError } from "@/lib/errors";
import { parsePagination, readJson } from "@/lib/http";
import { getUserList, createUserRecord, getStaffRoleNames, getUserByStaffId } from "@/lib/services/leaveService";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireHR();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive = isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;
    const { page, limit } = parsePagination(searchParams, { defaultLimit: 20 });

    const isSuperAdmin = session.roles.includes("SUPER_ADMIN");
    const result = await getUserList({ search, isActive, page, limit, excludeSuperAdmin: !isSuperAdmin });
    return NextResponse.json({ data: result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireHR();
    if (error) return error;

    const { staffId, email } = await readJson<{ staffId?: string; email?: string }>(request);
    if (!staffId || !email) {
      throw new ValidationError("staffId and email are required");
    }

    // HR cannot override the account of an existing SUPER_ADMIN or HR user
    if (!session.roles.includes("SUPER_ADMIN")) {
      const targetRoles = await getStaffRoleNames(staffId);
      const isTargetAdminOrHR = targetRoles.includes("SUPER_ADMIN") || targetRoles.includes("HR");
      if (isTargetAdminOrHR) {
        const existingUser = await getUserByStaffId(staffId);
        if (existingUser) {
          return NextResponse.json({ error: "HR ไม่สามารถตั้งค่าทับสิทธิ์บัญชีผู้ใช้ระดับบริหารอื่นได้" }, { status: 403 });
        }
      }
    }

    const password = randomBytes(4).toString("hex");
    await createUserRecord({ staffId, email, password });

    return NextResponse.json({ data: { email, password } }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
