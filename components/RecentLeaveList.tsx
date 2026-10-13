"use client";
import { Badge } from "@/components/ui/badge";
import type { RecentLeaveItem } from "@/lib/services/leaveService";
import { useRouter } from "next/navigation";
import { LeaveStatus } from "@/lib/generated/prisma/enums";
import { formatDateOnly } from "@/lib/utils";

const statusStyle: Record<string, { label: string; cls: string; dot: string }> = {
  [LeaveStatus.pending]: { label: "รออนุมัติ", cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  [LeaveStatus.approved]: { label: "อนุมัติ", cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  [LeaveStatus.rejected]: { label: "ไม่อนุมัติ", cls: "bg-rose-50 text-rose-600", dot: "bg-rose-500" },
  [LeaveStatus.cancelled]: { label: "ยกเลิก", cls: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
};

function periodLabel(item: RecentLeaveItem): string {
  if (item.leaveMode === "hour") {
    const time =
      item.startTime && item.endTime ? `${item.startTime} – ${item.endTime}` : "";
    const parts = [time, item.hours ? `${item.hours} ชม.` : ""].filter(Boolean);
    if (item.totalDays) parts.push(`(${item.totalDays} วัน)`);
    return parts.join(" · ") || "—";
  }
  const s = item.startDate ? formatDateOnly(item.startDate) : null;
  const e = item.endDate ? formatDateOnly(item.endDate) : null;
  if (!s && !e) return "—";
  if (!e || s === e) return s ?? e ?? "—";
  return `${s} – ${e}`;
}

export function RecentLeaveList({ leaves }: { leaves: RecentLeaveItem[] }) {
  const router = useRouter();

  return (
    <section className="flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-[#e7e6f3] bg-white shadow-[0_1px_2px_rgba(17,28,45,0.06)]">
      <div className="flex items-center justify-between border-b border-[#e7e6f3] bg-gradient-to-r from-[#f3f4ff] to-white px-6 py-4">
        <h3 className="flex items-center gap-2.5 text-[18px] font-bold text-[#111c2d] leading-[1.6]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef0ff] text-[#4648d4]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          รายการลาล่าสุด
          <span className="hidden text-xs font-normal text-[#767586] sm:inline">Recent Leave Requests</span>
        </h3>
        <button
          className="flex items-center gap-1 bg-transparent border-none text-[#4648d4] text-sm font-semibold hover:underline cursor-pointer"
          onClick={() => router.push("/dashboard/leave-history")}
        >
          ดูทั้งหมด
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {leaves.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#eef0ff] to-[#f7f7ff]">
            <svg className="h-14 w-14 text-[#b9b8ec]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[18px] font-semibold text-[#464554] leading-[1.6]">ไม่มีรายการลา</p>
          <p className="text-sm text-[#767586] leading-[1.6]">No leave records found in your recent activity.</p>
          <button
            className="mt-6 flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#4648d4] to-[#6f73ee] px-8 py-3 text-[15px] font-semibold text-white leading-[1.6] shadow-[0_8px_20px_rgba(70,72,212,0.3)] transition-all hover:shadow-[0_10px_24px_rgba(70,72,212,0.4)] active:scale-[0.98] border-none"
            onClick={() => router.push("/dashboard/leave-request")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Request New Leave
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#f0effa]">
          {leaves.map((item) => {
            const s = statusStyle[item.status] ?? { label: item.status, cls: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
            return (
              <div
                key={item.leaveId}
                onClick={() => router.push(`/dashboard/leave-details?leaveId=${encodeURIComponent(item.leaveId)}`)}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#f8f8ff] cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#111c2d]">{item.leaveTypeName}</p>
                  <p className="mt-0.5 truncate text-xs text-[#767586]">{periodLabel(item)}</p>
                </div>
                <Badge className={`shrink-0 flex items-center gap-1.5 rounded-full text-xs font-semibold border-none shadow-none ${s.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}