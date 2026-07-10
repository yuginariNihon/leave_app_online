import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardLeaveStats } from "@/lib/services/leaveService";

export function LeaveStatsCards({ stats }: { stats: DashboardLeaveStats }) {
  return (
    <section className="grid grid-cols-2 gap-3" data-purpose="leave-summary">
      <Card className="bg-white rounded-[8px] border-[#c7c5cf] shadow-sm flex flex-col items-center text-center overflow-hidden">
        <CardContent className="p-4 w-full">
          <span className="text-xs text-[#46464e] mb-1 block">ลาคงเหลือทั้งหมด</span>
          <span className="text-base font-bold text-[#0b1c30] leading-tight block">Remaining Leave</span>
          <div className="mt-2 text-2xl font-bold text-[#0b1c30]">{stats.totalRemainingDays}</div>
        </CardContent>
      </Card>
      <Card className="bg-white rounded-[8px] border-[#c7c5cf] shadow-sm flex flex-col items-center text-center overflow-hidden">
        <CardContent className="p-4 w-full">
          <span className="text-xs text-[#46464e] mb-1 block">รออนุมัติ</span>
          <span className="text-base font-bold text-[#0b1c30] leading-tight block">Pending Approval</span>
          <div className="mt-2 text-2xl font-bold text-[#f59e0b]">{stats.pending}</div>
        </CardContent>
      </Card>
      <Card className="bg-white rounded-[8px] border-[#c7c5cf] shadow-sm flex flex-col items-center text-center overflow-hidden">
        <CardContent className="p-4 w-full">
          <span className="text-xs text-[#46464e] mb-1 block">อนุมัติแล้ว</span>
          <span className="text-base font-bold text-[#0b1c30] leading-tight block">Approved</span>
          <div className="mt-2 text-2xl font-bold text-green-600">{stats.approved}</div>
        </CardContent>
      </Card>
      <Card className="bg-white rounded-[8px] border-[#c7c5cf] shadow-sm flex flex-col items-center text-center overflow-hidden">
        <CardContent className="p-4 w-full">
          <span className="text-xs text-[#46464e] mb-1 block">ไม่ผ่าน / ยกเลิก</span>
          <span className="text-base font-bold text-[#0b1c30] leading-tight block">Rejected / Cancel</span>
          <div className="mt-2 text-2xl font-bold text-[#ba1a1a]">{stats.rejectedCancelled}</div>
        </CardContent>
      </Card>
    </section>
  );
}
