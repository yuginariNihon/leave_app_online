"use client"

import type { TodaysLeaveItem } from "@/lib/services/dashboardService"

export function TodaysLeaveList({ data }: { data: TodaysLeaveItem[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-[#1a1a40] mb-4">พนักงานลาวันนี้</h3>
      {data.length === 0 ? (
        <p className="text-slate-400 text-sm py-4 text-center">ไม่มีพนักงานลาวันนี้</p>
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
              <div>
                <p className="font-medium text-[#1a1a40] text-sm">{item.staffName}</p>
                <p className="text-xs text-slate-500">{item.departmentName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">{item.leaveTypeName}</p>
                <p className="text-xs text-slate-400">{item.leavePeriod}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
