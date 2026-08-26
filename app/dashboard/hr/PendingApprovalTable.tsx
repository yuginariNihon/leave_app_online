"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
import type { PendingApprovalItem } from "@/lib/services/dashboardService"

export function PendingApprovalTable({ data }: { data: PendingApprovalItem[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1a1a40]">คำขอลาที่รอดำเนินการ</h3>
        <Link
          href="/dashboard/approval-requests/hr"
          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          ดูทั้งหมด <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-2 text-slate-500 font-medium whitespace-nowrap">พนักงาน</th>
              <th className="text-left py-2 px-2 text-slate-500 font-medium whitespace-nowrap">ประเภท</th>
              <th className="text-left py-2 px-2 text-slate-500 font-medium whitespace-nowrap">วันที่</th>
              <th className="text-center py-2 px-2 text-slate-500 font-medium whitespace-nowrap">จำนวนวัน</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">ไม่มีคำขอลาที่รอดำเนินการ</td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.leaveId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 px-2 font-medium text-[#1a1a40] whitespace-nowrap">{item.staffName}</td>
                  <td className="py-2.5 px-2 whitespace-nowrap">{item.leaveTypeName}</td>
                  <td className="py-2.5 px-2 whitespace-nowrap text-slate-600">
                    {item.startDate} — {item.endDate}
                  </td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">{item.totalDays}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
