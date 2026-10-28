import { NextRequest, NextResponse } from "next/server";
import { getLeaveHistoryByStaffId, type LeaveHistoryDateField } from "@/lib/services/leaveService";
import { requireAuth } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { csvStreamResponse, parsePagination } from "@/lib/http";
import { formatDateOnly } from "@/lib/utils";
import { statusTextMap } from "@/components/leave-history/types";

export const runtime = "nodejs";

const PAGE_SIZE = 500;

function buildLeaveHistoryCsvCells(r: {
  createdAt: string | Date;
  startDate: string | null;
  endDate: string | null;
  leaveTypeName: string;
  totalDays?: string | number | null;
  status: string;
  leaveMode?: string;
  startTime?: string | null;
  endTime?: string | null;
  hours?: string | number | null;
}): string[] {
  const dateLabel =
    r.startDate && r.endDate && r.startDate !== r.endDate
      ? `${formatDateOnly(r.startDate)} - ${formatDateOnly(r.endDate)}`
      : r.startDate
        ? formatDateOnly(r.startDate)
        : "";
  const isHour = r.leaveMode === "hour";
  const timePart =
    isHour && r.startTime && r.endTime ? ` ${r.startTime}–${r.endTime}` : "";
  const days =
    isHour && r.hours
      ? `${Number(r.hours)} ชม.` + (r.totalDays ? ` (${Number(r.totalDays)} วัน)` : "")
      : r.totalDays
        ? `${Number(r.totalDays)} วัน`
        : "";
  return [
    formatDateOnly(r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt),
    dateLabel + timePart,
    r.leaveTypeName,
    days,
    statusTextMap[r.status as keyof typeof statusTextMap] ?? r.status,
  ];
}

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const stream = searchParams.get("stream") === "true";

    const rawLeaveTypeId = searchParams.get("leaveTypeId");
    const leaveTypeId =
      rawLeaveTypeId && rawLeaveTypeId !== "all" && rawLeaveTypeId !== "undefined" ? rawLeaveTypeId : undefined;

    const rawDateField = searchParams.get("dateField");
    const dateField: LeaveHistoryDateField = rawDateField === "created_at" ? "created_at" : "leave_period";

    const baseFilters = {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      leaveTypeId,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      dateField,
    };

    if (!stream) {
      const exportAll = searchParams.get("exportAll") === "true";
      const { page, limit } = parsePagination(searchParams, { defaultLimit: 5, maxLimit: 500 });
      const result = await getLeaveHistoryByStaffId(session.staffId, {
        ...baseFilters,
        page,
        limit: exportAll ? undefined : limit,
      });
      return NextResponse.json(result);
    }

    // Streaming CSV: page through the DB so we never hold the full dataset in memory.
    return csvStreamResponse({
      filename: "leave_history",
      columns: ["วันที่เขียนใบลา", "วันที่ลา", "ประเภทการลา", "จำนวนวันที่ลา", "สถานะ"],
      rows: async function* () {
        let page = 1;
        while (true) {
          const result = await getLeaveHistoryByStaffId(session.staffId, {
            ...baseFilters,
            page,
            limit: PAGE_SIZE,
          });
          const rows = result.data as unknown as Array<Parameters<typeof buildLeaveHistoryCsvCells>[0]>;
          if (!rows.length) break;
          for (const row of rows) {
            yield buildLeaveHistoryCsvCells(row);
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
