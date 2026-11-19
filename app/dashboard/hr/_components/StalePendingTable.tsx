"use client"

import { useRouter } from "next/navigation"
import { AlertTriangle, ChevronRight } from "lucide-react"
import type { StalePendingItem } from "@/lib/services/leave/stalePending"

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

function dateLabel(item: StalePendingItem) {
  if (item.leaveMode === "hour") {
    return `${item.startDate}${item.startTime ? ` ${item.startTime}–${item.endTime ?? ""}` : ""}`
  }
  return `${item.startDate} — ${item.endDate}`
}

/**
 * การ์ดเตือน "ใบลาค้างอนุมัติเกิน N วัน" (อ่านอย่างเดียว)
 *
 * - ไม่กรองขั้น: แสดงทั้งใบที่ค้างขั้นแรก (cron จะเก็บให้) และใบที่ค้างขั้นถัดไป
 *   (ต้องให้ผู้อนุมัติ/HR จัดการเอง)
 * - คลิกแถว → หน้า detail แบบอ่านอย่างเดียว ไม่มีปุ่มอนุมัติในหน้านี้
 */
export function StalePendingTable({
  days,
  items,
  hasMore,
}: {
  days: number
  items: StalePendingItem[]
  hasMore: boolean
}) {
  const router = useRouter()

  // ไม่มีใบค้าง = ไม่กินพื้นที่ dashboard
  if (items.length === 0) return null

  return (
    <div className="flex h-full flex-col rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0 text-amber-500" />
          <h3 className="font-semibold text-[#0F172A]">ใบลาค้างอนุมัติเกิน {days} วัน</h3>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">
            {items.length}
            {hasMore ? "+" : ""}
          </span>
        </div>
        <p className="hidden text-xs text-slate-400 sm:block">นับจากวันที่เข้าสู่ขั้นปัจจุบัน</p>
      </div>

      <div className="-mx-2 space-y-1">
        {items.map((item) => (
          <button
            key={item.leaveId}
            type="button"
            onClick={() =>
              router.push(`/dashboard/leave-details?leaveId=${encodeURIComponent(item.leaveId)}`)
            }
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-amber-50/60"
          >
            <span className="flex size-9 flex-none items-center justify-center rounded-full bg-amber-50 text-xs font-semibold text-amber-600">
              {initials(item.staffName)}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#0F172A]">{item.staffName}</p>
              <p className="truncate text-xs text-slate-500">
                {item.leaveTypeName} · {item.caseName}
                {item.departmentName ? ` · ${item.departmentName}` : ""}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  item.currentLevel === 1
                    ? "bg-red-50 text-red-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {item.currentLevel === 1
                  ? "ขั้นแรก · จะถูกยกเลิกอัตโนมัติ"
                  : `ขั้น ${item.currentLevel} · ต้องให้ผู้อนุมัติจัดการ`}
              </span>
            </div>

            <div className="flex flex-none items-center gap-2 text-right">
              <div>
                <p className="whitespace-nowrap text-sm font-semibold text-amber-600">
                  {item.waitingDays} วัน
                </p>
                <p className="whitespace-nowrap text-xs text-slate-400">{dateLabel(item)}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-slate-300" />
            </div>
          </button>
        ))}
      </div>

      {hasMore && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
          แสดง {items.length} รายการแรก เรียงตามจำนวนวันที่ค้างมากที่สุด
        </p>
      )}
    </div>
  )
}
