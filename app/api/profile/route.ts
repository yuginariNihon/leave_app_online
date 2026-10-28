import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-guards";
import {
  getMyProfile,
  updateMyProfile,
} from "@/lib/services/leaveService";
import { logReadAccess } from "@/lib/services/auditService";
import { headers } from "next/headers";
import { apiErrorResponse, NotFoundError } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { updateMyProfileSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

// เบอร์โทรเห็นได้เฉพาะ HR/SUPER_ADMIN — คนอื่นอ่าน/เขียนได้แต่ไม่ได้ค่าไป
function isHrRole(roles: readonly string[]): boolean {
  return roles.includes("HR") || roles.includes("SUPER_ADMIN");
}

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const profile = await getMyProfile(session.staffId);
    if (!profile) {
      throw new NotFoundError("Profile not found.");
    }

    if (!isHrRole(session.roles)) {
      profile.phoneNumber = null;
    }

    const headersList = await headers();
    logReadAccess(session.userId, session.staffId, "profile", session.staffId, headersList.get("x-forwarded-for")?.split(",")[0].trim(), headersList.get("user-agent") ?? undefined);

    return NextResponse.json({ data: profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await parseBody(request, updateMyProfileSchema);
    const profile = await updateMyProfile(session.staffId, body);

    if (profile && !isHrRole(session.roles)) {
      profile.phoneNumber = null;
    }
    return NextResponse.json({ data: profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
