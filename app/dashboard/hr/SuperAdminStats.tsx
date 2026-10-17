import { ShieldCheck, Users, UserX, LayoutGrid } from "lucide-react"

export type SuperAdminStatsData = {
  totalRoles: number
  activeRoles: number
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalPages: number
}

export function SuperAdminStats({ data }: { data: SuperAdminStatsData }) {
  const items = [
    {
      label: "บทบาททั้งหมด",
      value: data.totalRoles,
      sub: `${data.activeRoles} เปิดใช้งาน`,
      icon: ShieldCheck,
      accent: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "ผู้ใช้ทั้งหมด",
      value: data.totalUsers,
      sub: `${data.activeUsers} เปิดใช้งาน`,
      icon: Users,
      accent: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "ผู้ใช้ที่ปิดใช้งาน",
      value: data.inactiveUsers,
      sub: "ถูกระงับการเข้าใช้",
      icon: UserX,
      accent: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "หน้าทั้งหมด",
      value: data.totalPages,
      sub: "รายการสิทธิ์การเข้าถึง",
      icon: LayoutGrid,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ]

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="font-semibold text-[#0F172A]">ภาพรวมระบบ</h3>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
          SUPER ADMIN
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5"
            >
              <span className={`flex size-10 flex-none items-center justify-center rounded-xl ${item.bg}`}>
                <Icon className={`size-5 ${item.accent}`} />
              </span>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none text-[#0F172A]">{item.value}</p>
                <p className="mt-1 truncate text-xs font-medium text-slate-600">{item.label}</p>
                <p className="truncate text-[11px] text-slate-400">{item.sub}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
