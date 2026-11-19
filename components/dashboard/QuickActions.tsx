import Link from "next/link";

export function QuickActions() {
  return (
    <section className="hidden lg:flex flex-col gap-4">
      <Link
        href="/dashboard/leave-request"
        className="group relative flex cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#4648d4] to-[#6f73ee] px-6 py-5 text-sm font-semibold text-white transition-all hover:shadow-[0_12px_28px_rgba(70,72,212,0.45)] active:scale-[0.98] active:shadow-[0_4px_12px_rgba(70,72,212,0.4)]"
      >
        <span className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/10 blur-xl transition-transform group-hover:scale-125" />
        <span className="pointer-events-none absolute -bottom-10 -left-6 h-20 w-20 rounded-full bg-white/10 blur-lg" />
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="relative text-left leading-[1.4]">
          ขออนุมัติลา
          <span className="block text-xs font-medium text-white/80">Request Leave</span>
        </span>
      </Link>
      <Link
        href="/dashboard/leave-history"
        className="group relative flex cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-2xl border border-[#e0deee] bg-white px-6 py-5 text-sm font-semibold text-[#4648d4] shadow-[0_1px_2px_rgba(17,28,45,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#b9b8ec] hover:bg-[#f7f7ff] hover:shadow-[0_10px_22px_rgba(70,72,212,0.12)] active:scale-[0.98]"
      >
        <span className="pointer-events-none absolute -bottom-10 -right-8 h-20 w-20 rounded-full bg-[#eef0ff] blur-lg transition-transform group-hover:scale-125" />
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#eef0ff] text-[#4648d4]">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9h6m-6 4h6m-8-4h.01M8 16h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="relative text-left leading-[1.4]">
          ประวัติการลา
          <span className="block text-xs font-medium text-[#767586]">Leave History</span>
        </span>
      </Link>
    </section>
  );
}