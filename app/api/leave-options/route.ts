import { NextResponse } from "next/server";
import { getActiveLeaveOptions } from "@/lib/services/leaveService";
import { requireAuth } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const data = await getActiveLeaveOptions();

    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" } },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
