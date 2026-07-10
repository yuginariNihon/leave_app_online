import { NextResponse } from "next/server";
import { getActiveLeaveOptions } from "@/lib/services/leaveService";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getActiveLeaveOptions();

    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" } },
    );
  } catch (error) {
    console.error("Failed to load leave options", error);
    return NextResponse.json(
      { error: "Failed to load leave options." },
      { status: 500 },
    );
  }
}
