"use client"

import type { UpcomingLeaveItem } from "@/lib/services/dashboardService"

export function UpcomingLeave({ data }: { data: UpcomingLeaveItem[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-[#1a1a40] mb-4">การลาที่กำลังจะมาถึง</h3>
      {data.length === 0 ? (
        <p className="text-slate-400 text-sm py-4 text-center">ไม่มีการลาที่กำลังจะมาถึง</p>
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
              <div>
                <p className="font-medium text-[#1a1a40] text-sm">{item.staffName}</p>
                <p className="text-xs text-slate-500">{item.leaveTypeName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">{item.startDate}</p>
                <p className="text-xs text-slate-400">{item.totalDays} วัน</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
