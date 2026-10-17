import Link from "next/link";
import { ShieldCheck, History, List, CalendarDays } from "lucide-react";

const actions = [
  { href: "/dashboard/approval-requests/hr", label: "อนุมัติคำขอลา (HR)", icon: ShieldCheck },
  { href: "/dashboard/approval-requests/history?roleType=hr", label: "ประวัติการอนุมัติ", icon: History },
  { href: "/dashboard/leave-history", label: "รายการลา", icon: List },
  { href: "/dashboard/leave-calendar", label: "ปฏิทินการลา", icon: CalendarDays },
];

export function DashboardHeader({ name, isSuperAdmin }: { name: string; isSuperAdmin: boolean }) {
  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex size-12 flex-none items-center justify-center rounded-2xl bg-[#0F172A] text-white">
          <ShieldCheck className="size-6" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A] sm:text-2xl">สวัสดี, {name}</h1>
            {isSuperAdmin && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                SUPER ADMIN
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{today} · ภาพรวมระบบการลา</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-[#0F172A]/20 hover:bg-slate-50 hover:text-[#0F172A]"
            >
              <Icon className="size-4 text-slate-400 transition group-hover:text-[#2563EB]" />
              {action.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
