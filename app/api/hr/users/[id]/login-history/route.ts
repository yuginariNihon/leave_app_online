import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseLimit } from "@/lib/http";
import { getUserLoginHistory } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireHR();
    if (error) return error;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams, { defaultLimit: 10, maxLimit: 100 });

    const history = await getUserLoginHistory(id, limit);
    return NextResponse.json({ data: history });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
