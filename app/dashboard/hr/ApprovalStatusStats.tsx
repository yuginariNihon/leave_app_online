"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { PieLabelRenderProps } from "recharts"
import type { ApprovalStatusStat } from "@/lib/services/dashboardService"

const LABEL_MAP: Record<string, string> = {
  pending: "รอดำเนินการ",
  approved: "อนุมัติ",
  rejected: "ปฏิเสธ",
  cancelled: "ยกเลิก",
}

export function ApprovalStatusStats({ data }: { data: ApprovalStatusStat[] }) {
  const chartData = data.map((d) => ({ ...d, label: LABEL_MAP[d.status] ?? d.status }))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <h3 className="font-semibold text-[#1a1a40] text-sm mb-2">สถานะคำขอทั้งหมด</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            dataKey="count"
            nameKey="label"
            label={({ name, percent }: PieLabelRenderProps) =>
              `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
            labelLine
          >
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
