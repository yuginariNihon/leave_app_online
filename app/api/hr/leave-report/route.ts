import { NextRequest, NextResponse } from "next/server";
import { getLeaveReport } from "@/lib/services/leaveService";
import { getSessionUser } from "@/lib/auth";
import { formatLeaveDateRange, formatDays } from "@/lib/utils";
import { statusTextMap } from "@/components/leave-history/types";

export const runtime = "nodejs";

const PAGE_SIZE = 500;

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  const sanitized = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${sanitized.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const stream = searchParams.get("stream") === "true";

    const baseFilters = {
      search: searchParams.get("search") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      leaveTypeId: searchParams.get("leaveTypeId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    if (!stream) {
      const result = await getLeaveReport({
        ...baseFilters,
        page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
        limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
      });
      return NextResponse.json(result);
    }

    const headers = [
      "รหัสพนักงาน",
      "ชื่อ-นามสกุล",
      "แผนก",
      "ประเภทการลา",
      "วันที่ลา",
      "จำนวนวัน",
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
            const result = await getLeaveReport({ ...baseFilters, page, limit: PAGE_SIZE });
            const rows = result.data as unknown as Array<{
              staffCode: string;
              staffName: string;
              departmentName: string | null;
              leaveTypeName: string;
              startDate: string | null;
              endDate: string | null;
              totalDays: string | null;
              status: string;
            }>;
            if (!rows.length) break;
            let chunk = "";
            for (const r of rows) {
              const cells = [
                csvCell(r.staffCode),
                csvCell(r.staffName),
                csvCell(r.departmentName ?? ""),
                csvCell(r.leaveTypeName),
                csvCell(formatLeaveDateRange(r.startDate, r.endDate)),
                csvCell(r.totalDays ? formatDays(r.totalDays) : ""),
                csvCell(statusTextMap[r.status as keyof typeof statusTextMap] ?? r.status),
              ];
              chunk += cells.join(",") + "\n";
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
        "Content-Disposition": `attachment; filename="leave_report_${new Date().toISOString().split("T")[0]}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/hr/leave-report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
