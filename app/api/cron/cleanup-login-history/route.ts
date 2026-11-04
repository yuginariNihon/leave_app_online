import { NextRequest, NextResponse } from "next/server";
import { isCronRequestAuthorized } from "@/lib/cronAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const RETENTION_DAYS = 90;

export async function GET(request: NextRequest) {
  if (!isCronRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const deleted = await prisma.loginHistory.deleteMany({
    where: { login_at: { lt: cutoff } },
  });

  return NextResponse.json({ deleted: deleted.count });
}