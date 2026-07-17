
import Link from "next/link";

export function QuickActions() {
  return (
    <section className="flex flex-col gap-4">
      <Link
        href="/dashboard/leave-request"
        className="w-full bg-[#4648d4] text-white py-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#6063ee] transition-all shadow-sm active:scale-95 cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        </svg>
        ขออนุมัติลา (Request Leave)
      </Link>
      <Link
        href="/dashboard/leave-history"
        className="w-full bg-white border border-[#c7c4d7] text-[#464554] py-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#f0f3ff] transition-all shadow-sm active:scale-95 cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        </svg>
        ประวัติการลา (Leave History)
      </Link>
    </section>
  );
}
