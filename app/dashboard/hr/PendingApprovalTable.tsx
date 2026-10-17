"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ExternalLink, Inbox } from "lucide-react"
import type { PendingApprovalItem } from "@/lib/services/dashboardService"

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

function amountLabel(item: PendingApprovalItem) {
  return item.leaveMode === "hour" ? `${item.hours ?? 0} ชม. (${item.totalDays} วัน)` : `${item.totalDays} วัน`
}

function dateLabel(item: PendingApprovalItem) {
  if (item.leaveMode === "hour") {
    return `${item.startDate}${item.startTime ? ` ${item.startTime}–${item.endTime ?? ""}` : ""}`
  }
  return `${item.startDate} — ${item.endDate}`
}

export function PendingApprovalTable({ data }: { data: PendingApprovalItem[] }) {
  const router = useRouter()

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[#0F172A]">คำขอลาที่รอดำเนินการ</h3>
          {data.length > 0 && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">
              {data.length}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/approval-requests/hr"
          className="flex items-center gap-1 text-sm text-[#2563EB] hover:underline"
        >
          ดูทั้งหมด <ExternalLink className="size-3.5" />
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-slate-400">
          <Inbox className="size-8" />
          <p className="text-sm">ไม่มีคำขอลาที่รอดำเนินการ</p>
        </div>
      ) : (
        <div className="-mx-2 space-y-1">
          {data.map((item) => (
            <button
              key={item.leaveId}
              type="button"
              onClick={() =>
                router.push(`/dashboard/approval-requests/hr/detail?leaveId=${encodeURIComponent(item.leaveId)}`)
              }
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-slate-50"
            >
              <span className="flex size-9 flex-none items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                {initials(item.staffName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#0F172A]">{item.staffName}</p>
                <p className="truncate text-xs text-slate-500">
                  {item.leaveTypeName} · {item.caseName}
                </p>
              </div>
              <div className="flex-none text-right">
                <p className="whitespace-nowrap text-xs text-slate-600">{dateLabel(item)}</p>
                <p className="whitespace-nowrap text-xs text-slate-400">{amountLabel(item)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
