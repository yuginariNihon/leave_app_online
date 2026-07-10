"use client"

import { useMemo } from "react"
import type { LeaveCalendarDay } from "@/lib/services/dashboardService"

const DAY_NAMES = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

export function LeaveCalendar({
  data,
  year,
  month,
}: {
  data: LeaveCalendarDay[]
  year: number
  month: number
}) {
  const firstDay = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month])

  const blanks = Array.from({ length: firstDay }, (_, i) => i)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-[#1a1a40] mb-4">
        ปฏิทินการลา — {month}/{year}
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-slate-400 font-medium py-1">
            {d}
          </div>
        ))}
        {blanks.map((i) => (
          <div key={`blank-${i}`} />
        ))}
        {data.map((day) => (
          <div
            key={day.date}
            className={`relative p-1.5 rounded-lg min-h-[56px] ${
              day.isToday ? "ring-2 ring-indigo-400 bg-indigo-50" : "hover:bg-slate-50"
            }`}
          >
            <div className="font-medium text-[#1a1a40]">{day.date}</div>
            {day.leaves.length > 0 && (
              <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                {day.leaves.slice(0, 3).map((l, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                    title={`${l.staffName} — ${l.leaveTypeName}`}
                  />
                ))}
                {day.leaves.length > 3 && (
                  <span className="text-[10px] text-indigo-500">+{day.leaves.length - 3}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
