import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getNotificationCount } from "@/lib/services/approvalService";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSessionUser();
  if (!session?.staffId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await getNotificationCount(session.staffId);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to fetch notification count", error);
    return NextResponse.json(
      { error: "Failed to fetch notification count." },
      { status: 500 },
    );
  }
}