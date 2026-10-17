"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock } from "lucide-react"
import type { TodaysLeaveItem, UpcomingLeaveItem } from "@/lib/services/dashboardService"

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-slate-400">
      <CalendarClock className="size-8" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function LeaveTimelineCard({
  todays,
  upcoming,
}: {
  todays: TodaysLeaveItem[]
  upcoming: UpcomingLeaveItem[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<"today" | "upcoming">("today")

  const openLeave = (leaveId: string) =>
    router.push(`/dashboard/leave-details?leaveId=${encodeURIComponent(leaveId)}`)

  const tabs = [
    { key: "today" as const, label: "ลาวันนี้", count: todays.length },
    { key: "upcoming" as const, label: "กำลังจะมาถึง", count: upcoming.length },
  ]

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-[#0F172A]">ตารางการลา</h3>
        <div className="flex rounded-xl bg-slate-100 p-1">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                tab === item.key ? "bg-white text-[#0F172A] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {item.label}
              {item.count > 0 && <span className="ml-1 text-slate-400">{item.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1">
        {tab === "today" ? (
          todays.length === 0 ? (
            <EmptyState message="ไม่มีพนักงานลาวันนี้" />
          ) : (
            <div className="-mx-2 space-y-1">
              {todays.map((item) => (
                <button
                  key={item.leaveId}
                  type="button"
                  onClick={() => openLeave(item.leaveId)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50"
                >
                  <span className="flex size-9 flex-none items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                    {initials(item.staffName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0F172A]">{item.staffName}</p>
                    <p className="truncate text-xs text-slate-500">{item.departmentName}</p>
                  </div>
                  <div className="flex-none text-right">
                    <p className="truncate text-xs text-slate-600">{item.leaveTypeName}</p>
                    <p className="whitespace-nowrap text-xs text-slate-400">
                      {item.leaveMode === "hour"
                        ? `${item.startTime ?? ""}–${item.endTime ?? ""} น. (${item.hours ?? 0} ชม.)`
                        : item.leavePeriod}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : upcoming.length === 0 ? (
          <EmptyState message="ไม่มีการลาที่กำลังจะมาถึง" />
        ) : (
          <div className="space-y-1">
            {upcoming.map((item) => (
              <button
                key={item.leaveId}
                type="button"
                onClick={() => openLeave(item.leaveId)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50"
              >
                <span className="flex size-9 flex-none items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                  {initials(item.staffName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#0F172A]">{item.staffName}</p>
                  <p className="truncate text-xs text-slate-500">{item.leaveTypeName}</p>
                </div>
                <div className="flex-none text-right">
                  <p className="whitespace-nowrap text-xs text-slate-600">
                    {item.leaveMode === "hour" && item.startTime
                      ? `${item.startDate} ${item.startTime}–${item.endTime ?? ""}`
                      : item.startDate}
                  </p>
                  <p className="whitespace-nowrap text-xs text-slate-400">
                    {item.leaveMode === "hour"
                      ? `${item.hours ?? 0} ชม. (${item.totalDays} วัน)`
                      : `${item.totalDays} วัน`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
