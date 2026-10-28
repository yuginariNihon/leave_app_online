import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getLeaveReport } from "@/lib/services/leaveService";
import { formatLeaveDateRange, formatDays } from "@/lib/utils";
import { csvStreamResponse, parsePagination } from "@/lib/http";
import { statusTextMap } from "@/components/leave-history/types";

export const runtime = "nodejs";

const PAGE_SIZE = 500;

type LeaveReportCsvRow = {
  staffCode: string;
  staffName: string;
  departmentName?: string | null;
  leaveTypeName: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: string | null;
  status: string;
  leaveMode?: string;
  startTime?: string | null;
  endTime?: string | null;
  hours?: string | null;
};

function buildLeaveReportCsvCells(r: LeaveReportCsvRow): string[] {
  const isHour = r.leaveMode === "hour";
  const daysLabel = isHour
    ? r.totalDays
      ? `${Number(r.totalDays)} วัน (คิดจากชั่วโมง ÷ 8)`
      : ""
    : r.totalDays
      ? formatDays(r.totalDays)
      : "";
  return [
    r.staffCode,
    r.staffName,
    r.departmentName ?? "",
    r.leaveTypeName,
    formatLeaveDateRange(r.startDate, r.endDate),
    r.startTime ?? "",
    r.endTime ?? "",
    r.hours ?? "",
    daysLabel,
    statusTextMap[r.status as keyof typeof statusTextMap] ?? r.status,
  ];
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

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
      const { page, limit } = parsePagination(searchParams, { defaultLimit: 20, maxLimit: 500 });
      const result = await getLeaveReport({ ...baseFilters, page, limit });
      return NextResponse.json(result);
    }

    return csvStreamResponse({
      filename: "leave_report",
      columns: [
        "รหัสพนักงาน",
        "ชื่อ-นามสกุล",
        "แผนก",
        "ประเภทการลา",
        "วันที่ลา",
        "เวลาเริ่ม",
        "เวลาสิ้นสุด",
        "จำนวนชั่วโมง",
        "จำนวนวัน",
        "สถานะ",
      ],
      rows: async function* () {
        let page = 1;
        while (true) {
          const result = await getLeaveReport({ ...baseFilters, page, limit: PAGE_SIZE });
          const rows = result.data as unknown as LeaveReportCsvRow[];
          if (!rows.length) break;
          for (const row of rows) {
            yield buildLeaveReportCsvCells(row);
          }
          if (rows.length < PAGE_SIZE) break;
          page++;
        }
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
