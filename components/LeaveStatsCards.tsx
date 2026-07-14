import React from "react";
import type { DashboardLeaveStats } from "@/lib/services/leaveService";

export function LeaveStatsCards({ stats }: { stats: DashboardLeaveStats }) {
  const cards = [
    { label: "ลาคงเหลือทั้งหมด", sub: "Remaining Leave", value: stats.totalRemainingDays, color: "text-[#4648d4]" },
    { label: "รออนุมัติ", sub: "Pending Approval", value: stats.pending, color: "text-[#904900]" },
    { label: "อนุมัติแล้ว", sub: "Approved", value: stats.approved, color: "text-[#4648d4]" },
    { label: "ไม่ผ่าน / ยกเลิก", sub: "Rejected / Cancel", value: stats.rejectedCancelled, color: "text-[#ba1a1a]" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white p-4 rounded-xl border border-[#c7c4d7] flex flex-col items-center justify-center text-center transition-transform duration-200 hover:scale-[1.02]"
        >
          <p className="text-sm font-medium text-[#464554] opacity-80 leading-[1.6]">{c.label}</p>
          <p className="text-sm font-semibold text-[#464554] leading-[1.6]">{c.sub}</p>
          <span className={`text-[28px] font-bold ${c.color}`}>{c.value}</span>
        </div>
      ))}
    </div>
  );
}
