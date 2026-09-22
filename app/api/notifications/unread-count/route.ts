import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getNotificationCount } from "@/lib/services/approvalService";

export const runtime = "nodejs";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const count = await getNotificationCount(session.staffId);
    return NextResponse.json({ count });
  } catch (error) {
    return apiErrorResponse(error);
  }
}