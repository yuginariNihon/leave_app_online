"use client"

import { Clock } from "lucide-react"
import type { RecentActivityItem } from "@/lib/services/dashboardService"

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`
  const days = Math.floor(hrs / 24)
  return `${days} วันที่แล้ว`
}

export function RecentActivities({ data }: { data: RecentActivityItem[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-[#1a1a40] mb-4">กิจกรรมล่าสุด</h3>
      {data.length === 0 ? (
        <p className="text-slate-400 text-sm py-4 text-center">ไม่มีกิจกรรมล่าสุด</p>
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <div key={i} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1a1a40]">
                  <span className="font-medium">{item.staffName}</span> {item.action}
                </p>
                <p className="text-xs text-slate-500 truncate">{item.detail}</p>
              </div>
              <p className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(item.timestamp)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
