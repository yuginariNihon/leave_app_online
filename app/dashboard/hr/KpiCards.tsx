"use client"

import { Clock, ShieldCheck, FileText, Users, UserX, CalendarCheck, Timer } from "lucide-react"
import type { DashboardKpiData } from "@/lib/services/dashboardService"

const cards = [
  { key: "pendingApprovals", label: "รออนุมัติ (HR)", icon: Clock, bg: "bg-amber-100", color: "text-amber-600" },
  { key: "approvedToday", label: "อนุมัติวันนี้", icon: ShieldCheck, bg: "bg-green-100", color: "text-green-600" },
  { key: "totalLeavesThisMonth", label: "ใบลาเดือนนี้", icon: FileText, bg: "bg-blue-100", color: "text-blue-600" },
  { key: "totalLeavesThisYear", label: "ใบลาปีนี้", icon: FileText, bg: "bg-teal-100", color: "text-teal-600" },
  { key: "leaveToday", label: "ลาวันนี้", icon: CalendarCheck, bg: "bg-indigo-100", color: "text-indigo-600" },
  { key: "avgApprovalHours", label: "เวลาเฉลี่ยอนุมัติ", icon: Timer, bg: "bg-orange-100", color: "text-orange-600", suffix: "ชม." },
  { key: "activeStaffCount", label: "พนักงาน Active", icon: Users, bg: "bg-emerald-100", color: "text-emerald-600" },
  { key: "terminatedStaffCount", label: "พนักงานลาออก", icon: UserX, bg: "bg-red-100", color: "text-red-600" },
] as const

export function KpiCards({ data }: { data: DashboardKpiData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        const value = data[card.key as keyof DashboardKpiData]
        return (
          <div key={card.key} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium whitespace-nowrap">{card.label}</p>
                <p className="text-2xl font-bold text-[#1a1a40] whitespace-nowrap">
                  {value}{"suffix" in card ? ` ${card.suffix}` : ""}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
