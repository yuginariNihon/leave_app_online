import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getMyProfile,
  updateMyProfile,
} from "@/lib/services/leaveService";
import { logReadAccess } from "@/lib/services/auditService";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSessionUser();
  if (!session || !session.staffId) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in first." },
      { status: 401 },
    );
  }

  try {
    const profile = await getMyProfile(session.staffId);
    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 },
      );
    }

    const isHR = session.roles.some((r) => r === "HR" || r === "SUPER_ADMIN");
    if (!isHR) {
      profile.phoneNumber = null;
    }

    const headersList = await headers();
    logReadAccess(session.userId, session.staffId, "profile", session.staffId, headersList.get("x-forwarded-for")?.split(",")[0].trim(), headersList.get("user-agent") ?? undefined);

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error("Failed to fetch profile", error);
    return NextResponse.json(
      { error: "Failed to fetch profile." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getSessionUser();
  if (!session || !session.staffId) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in first." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = safeParseUpdateBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400 },
    );
  }

  try {
    const profile = await updateMyProfile(session.staffId, parsed.data);
    const isHR = session.roles.some((r) => r === "HR" || r === "SUPER_ADMIN");
    if (profile && !isHR) {
      profile.phoneNumber = null;
    }
    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error("Failed to update profile", error);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 },
    );
  }
}

type UpdateBody = {
  name: string;
  phoneNumber?: string | null;
  email?: string | null;
};

function safeParseUpdateBody(
  body: unknown,
): { success: true; data: UpdateBody } | { success: false; error: string } {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Request body must be an object." };
  }

  const obj = body as Record<string, unknown>;

  if (!obj.name || typeof obj.name !== "string" || obj.name.trim().length === 0) {
    return { success: false, error: "Name is required." };
  }

  const data: UpdateBody = {
    name: obj.name.trim().slice(0, 100),
  };

  if (obj.phoneNumber !== undefined) {
    if (obj.phoneNumber !== null && typeof obj.phoneNumber !== "string") {
      return { success: false, error: "Phone number must be a string or null." };
    }
    data.phoneNumber = obj.phoneNumber;
  }

  if (obj.email !== undefined) {
    if (obj.email !== null && typeof obj.email !== "string") {
      return { success: false, error: "Email must be a string or null." };
    }
    data.email = obj.email;
  }

  return { success: true, data };
}
