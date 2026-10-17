"use client"

import { Clock } from "lucide-react"
import type { RecentActivityItem } from "@/lib/services/dashboardService"

const ACTION_STYLE: Record<string, string> = {
  "ยื่นคำขอลา": "bg-blue-50 text-blue-600",
  "อนุมัติคำขอลา": "bg-emerald-50 text-emerald-600",
  "ปฏิเสธคำขอลา": "bg-rose-50 text-rose-600",
  "ยกเลิกคำขอลา": "bg-slate-100 text-slate-500",
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="font-semibold text-[#0F172A]">กิจกรรมล่าสุด</h3>
        {data.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
            {data.length}
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-400">
          <Clock className="size-8" />
          <p className="text-sm">ไม่มีกิจกรรมล่าสุด</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
          {data.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50"
            >
              <span className="flex size-9 flex-none items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                {initials(item.staffName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#0F172A]">
                  <span className="font-medium">{item.staffName}</span>{" "}
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${
                      ACTION_STYLE[item.action] ?? "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.action}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{item.detail}</p>
              </div>
              <span className="flex-none whitespace-nowrap text-xs text-slate-400">{timeAgo(item.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
