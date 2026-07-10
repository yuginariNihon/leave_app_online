"use client"

import type { LeaveBalanceSummaryItem } from "@/lib/services/dashboardService"

export function LeaveBalanceSummary({ data }: { data: LeaveBalanceSummaryItem[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-[#1a1a40] mb-4">สรุปยอดคงเหลือการลา</h3>
      {data.length === 0 ? (
        <p className="text-slate-400 text-sm py-4 text-center">ไม่มีข้อมูลยอดคงเหลือ</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-slate-500 font-medium whitespace-nowrap">ประเภทการลา</th>
                <th className="text-center py-2 px-2 text-slate-500 font-medium whitespace-nowrap">พนักงาน</th>
                <th className="text-center py-2 px-2 text-slate-500 font-medium whitespace-nowrap">โควตาทั้งหมด</th>
                <th className="text-center py-2 px-2 text-slate-500 font-medium whitespace-nowrap">ใช้ไป</th>
                <th className="text-center py-2 px-2 text-slate-500 font-medium whitespace-nowrap">คงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.leaveTypeName} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 px-2 font-medium text-[#1a1a40] whitespace-nowrap">{item.leaveTypeName}</td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">{item.totalStaff}</td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">{item.totalQuota}</td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">{item.totalUsed}</td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap font-medium text-emerald-600">{item.totalRemaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
