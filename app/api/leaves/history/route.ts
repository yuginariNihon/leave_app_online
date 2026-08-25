import { NextRequest, NextResponse } from "next/server";
import { getLeaveHistoryByStaffId } from "@/lib/services/leaveService";
import { getSessionUser } from "@/lib/auth";
import { formatDateOnly, formatDays } from "@/lib/utils";
import { statusTextMap } from "@/components/leave-history/types";

export const runtime = "nodejs";

const PAGE_SIZE = 500;

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  const sanitized = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${sanitized.replace(/"/g, '""')}"`;
}

function buildLeaveHistoryCsvRow(r: {
  createdAt: string | Date;
  startDate: string | null;
  endDate: string | null;
  leaveTypeName: string;
  totalDays?: string | number | null;
  status: string;
}): string {
  const dateLabel =
    r.startDate && r.endDate && r.startDate !== r.endDate
      ? `${formatDateOnly(r.startDate)} - ${formatDateOnly(r.endDate)}`
      : r.startDate
        ? formatDateOnly(r.startDate)
        : "";
  const days = r.totalDays ? `${Number(r.totalDays)} วัน` : "";
  return [
    csvCell(formatDateOnly(r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt)),
    csvCell(dateLabel),
    csvCell(r.leaveTypeName),
    csvCell(days),
    csvCell(statusTextMap[r.status as keyof typeof statusTextMap] ?? r.status),
  ].join(",");
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const stream = searchParams.get("stream") === "true";

    const rawLeaveTypeId = searchParams.get("leaveTypeId");
    const leaveTypeId =
      rawLeaveTypeId && rawLeaveTypeId !== "all" && rawLeaveTypeId !== "undefined" ? rawLeaveTypeId : undefined;

    const baseFilters = {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      leaveTypeId,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    if (!stream) {
      const exportAll = searchParams.get("exportAll") === "true";
      const result = await getLeaveHistoryByStaffId(session.staffId, {
        ...baseFilters,
        page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
        limit: exportAll ? undefined : searchParams.get("limit") ? Number(searchParams.get("limit")) : 5,
      });
      return NextResponse.json(result);
    }

    // Streaming CSV: page through the DB so we never hold the full dataset in memory.
    const headers = [
      "วันที่เขียนใบลา",
      "วันที่ลา",
      "ประเภทการลา",
      "จำนวนวันที่ลา",
      "สถานะ",
    ];
    const encoder = new TextEncoder();
    const BOM = "﻿";

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(BOM + headers.map(csvCell).join(",") + "\n"));
        try {
          let page = 1;
          while (true) {
            const result = await getLeaveHistoryByStaffId(session.staffId, {
              ...baseFilters,
              page,
              limit: PAGE_SIZE,
            });
            const rows = result.data as unknown as Array<{
              createdAt: string | Date;
              startDate: string | null;
              endDate: string | null;
              leaveTypeName: string;
              totalDays?: string | number | null;
              status: string;
            }>;
            if (!rows.length) break;
            let chunk = "";
            for (const r of rows) {
              chunk += buildLeaveHistoryCsvRow(r) + "\n";
            }
            controller.enqueue(encoder.encode(chunk));
            if (rows.length < PAGE_SIZE) break;
            page++;
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`\nError: ${(err as Error).message}\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leave_history_${new Date().toISOString().split("T")[0]}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/leaves/history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
