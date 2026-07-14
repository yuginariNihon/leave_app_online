"use client";
import { Badge } from "@/components/ui/badge";
import type { RecentLeaveItem } from "@/lib/services/leaveService";
import { useRouter } from "next/navigation";
import { LeaveStatus } from "@/lib/generated/prisma/enums";
import { formatDateOnly } from "@/lib/utils";

const statusStyle: Record<string, { label: string; cls: string }> = {
  [LeaveStatus.pending]: { label: "รออนุมัติ", cls: "bg-orange-100 text-orange-700" },
  [LeaveStatus.approved]: { label: "อนุมัติ", cls: "bg-green-100 text-green-700" },
  [LeaveStatus.rejected]: { label: "ไม่อนุมัติ", cls: "bg-red-100 text-red-700" },
  [LeaveStatus.cancelled]: { label: "ยกเลิก", cls: "bg-gray-100 text-gray-700" },
};

export function RecentLeaveList({ leaves }: { leaves: RecentLeaveItem[] }) {
  const router = useRouter();

  return (
    <section className="bg-white rounded-xl border border-[#c7c4d7] flex flex-col min-h-[400px]">
      <div className="px-6 py-4 border-b border-[#c7c4d7] flex justify-between items-center">
        <h3 className="text-[24px] font-bold text-[#111c2d] leading-[1.6]">
          รายการลาล่าสุด{" "}
          <span className="text-sm font-normal ml-2 text-[#464554] opacity-70">Recent Leave Requests</span>
        </h3>
        <button
          className="text-[#4648d4] text-sm font-semibold hover:underline bg-transparent border-none cursor-pointer"
          onClick={() => router.push("/dashboard/leave-history")}
        >
          ดูทั้งหมด
        </button>
      </div>

      {leaves.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-32 h-32 bg-[#f0f3ff] rounded-full flex items-center justify-center mb-6">
            <svg className="w-16 h-16 text-[#c7c4d7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
            </svg>
          </div>
          <p className="text-[24px] font-semibold text-[#464554] leading-[1.6]">ไม่มีรายการลา</p>
          <p className="text-[18px] text-[#767586] leading-[1.6]">No leave records found in your recent activity.</p>
          <button
            className="mt-8 flex items-center gap-2 bg-[#4648d4] text-white px-10 py-4 rounded-lg text-[20px] font-semibold leading-[1.6] hover:bg-[#6063ee] transition-all active:scale-95 shadow-sm cursor-pointer border-none"
            onClick={() => router.push("/dashboard/leave-request")}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
            </svg>
            Request New Leave
          </button>
        </div>
      ) : (
        <div>
          {leaves.map((item) => {
            const s = statusStyle[item.status] ?? { label: item.status, cls: "bg-gray-100 text-gray-700" };
            return (
              <div
                key={item.leaveId}
                className="flex items-center justify-between px-6 py-4 border-b border-[#c7c4d7] last:border-b-0 cursor-pointer hover:bg-[#f8f9ff] transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#111c2d]">{formatDateOnly(item.createdAt)}</span>
                  <span className="text-xs text-[#464554]">{item.leaveTypeName}</span>
                </div>
                <Badge className={`rounded-full text-xs font-semibold border-none shadow-none ${s.cls}`}>
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
