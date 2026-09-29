import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const RETENTION_DAYS = 90;

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const deleted = await prisma.loginHistory.deleteMany({
    where: { login_at: { lt: cutoff } },
  });

  return NextResponse.json({ deleted: deleted.count });
}