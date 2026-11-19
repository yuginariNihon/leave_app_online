import type { DashboardLeaveStats } from "@/lib/services/leaveService";

export function LeaveStatsCards({ stats }: { stats: DashboardLeaveStats }) {
  const items = [
    {
      label: "ลาคงเหลือทั้งหมด",
      en: "Remaining Leave",
      value: stats.totalRemainingDays,
      iconClass: "bg-[#eef0ff] text-[#4648d4]",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "รออนุมัติ",
      en: "Pending Approval",
      value: stats.pending,
      iconClass: "bg-amber-50 text-amber-600",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "อนุมัติแล้ว",
      en: "Approved",
      value: stats.approved,
      iconClass: "bg-emerald-50 text-emerald-600",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "ไม่ผ่าน / ยกเลิก",
      en: "Rejected / Cancelled",
      value: stats.rejectedCancelled,
      iconClass: "bg-rose-50 text-rose-500",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((c) => (
        <div
          key={c.label}
          className="group rounded-2xl border border-[#e7e6f3] bg-white p-5 shadow-[0_1px_2px_rgba(17,28,45,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d9d8f4] hover:shadow-[0_10px_24px_rgba(70,72,212,0.12)]"
        >
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.iconClass}`}>
            {c.icon}
          </div>
          <p className="mt-4 text-[28px] font-bold leading-none text-[#111c2d]">{c.value}</p>
          <div className="mt-2">
            <p className="text-sm font-semibold text-[#111c2d] leading-[1.6]">{c.label}</p>
            <p className="text-xs text-[#767586] leading-[1.6]">{c.en}</p>
          </div>
        </div>
      ))}
    </div>
  );
}