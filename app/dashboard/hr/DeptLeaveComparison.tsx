"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { DeptLeaveComparisonItem } from "@/lib/services/dashboardService"

export function DeptLeaveComparison({ data }: { data: DeptLeaveComparisonItem[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
      <h3 className="font-semibold text-[#0F172A] mb-3">เปรียบเทียบการลาแยกแผนก</h3>
      <ResponsiveContainer width="100%" height={220} debounce={120}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
          <YAxis type="category" dataKey="departmentName" tick={{ fontSize: 12 }} stroke="#94a3b8" width={140} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          />
          <Bar dataKey="totalLeaves" fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
