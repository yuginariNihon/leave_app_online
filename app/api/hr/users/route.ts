import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { getUserList, createUserRecord } from "@/lib/services/leaveService";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSessionUser();
    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive = isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const isSuperAdmin = session.roles.includes("SUPER_ADMIN");
    const result = await getUserList({ search, isActive, page, limit, excludeSuperAdmin: !isSuperAdmin });
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error in GET /api/hr/users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSessionUser();
    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { staffId, email } = body;

    if (!staffId || !email) {
      return NextResponse.json({ error: "staffId and email are required" }, { status: 400 });
    }

    const password = randomBytes(4).toString("hex");
    await createUserRecord({ staffId, email, password });

    return NextResponse.json({ data: { email, password } }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/hr/users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
