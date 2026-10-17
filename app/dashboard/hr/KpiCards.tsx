"use client"

import { Clock, ShieldCheck, FileText, CalendarCheck, Timer, Users, UserX, CalendarRange } from "lucide-react"
import { motion } from "motion/react"
import type { DashboardKpiData } from "@/lib/services/dashboardService"

const primary = [
  { key: "pendingApprovals", label: "รออนุมัติ (HR)", icon: Clock, accent: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-400" },
  { key: "approvedToday", label: "อนุมัติวันนี้", icon: ShieldCheck, accent: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-400" },
  { key: "totalLeavesThisMonth", label: "ใบลาเดือนนี้", icon: FileText, accent: "text-blue-600", bg: "bg-blue-50", bar: "bg-blue-400" },
  { key: "leaveToday", label: "ลาวันนี้", icon: CalendarCheck, accent: "text-indigo-600", bg: "bg-indigo-50", bar: "bg-indigo-400" },
] as const

const secondary = [
  { key: "totalLeavesThisYear", label: "ใบลาปีนี้", icon: CalendarRange, suffix: "" },
  { key: "avgApprovalHours", label: "เวลาเฉลี่ยอนุมัติ", icon: Timer, suffix: " ชม." },
  { key: "activeStaffCount", label: "พนักงานเปิดใช้งาน", icon: Users, suffix: "" },
  { key: "terminatedStaffCount", label: "พนักงานลาออก", icon: UserX, suffix: "" },
] as const

export function KpiCards({ data }: { data: DashboardKpiData }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {primary.map((card, i) => {
          const Icon = card.icon
          const value = data[card.key as keyof DashboardKpiData]
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
              className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`absolute inset-x-0 top-0 h-1 ${card.bar}`} />
              <div className={`flex size-10 items-center justify-center rounded-xl ${card.bg}`}>
                <Icon className={`size-5 ${card.accent}`} />
              </div>
              <p className="mt-3 text-3xl font-bold leading-none text-[#0F172A]">{value}</p>
              <p className="mt-1.5 text-sm font-medium text-slate-500">{card.label}</p>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {secondary.map((card, i) => {
          const Icon = card.icon
          const value = data[card.key as keyof DashboardKpiData]
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: (i + 4) * 0.05, ease: "easeOut" }}
              className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 shadow-sm"
            >
              <span className="flex size-9 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-bold leading-tight text-[#0F172A]">
                  {value}
                  {card.suffix}
                </p>
                <p className="truncate text-[11px] text-slate-500">{card.label}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
