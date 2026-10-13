import Link from "next/link";

export function BottomActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-3 border-t border-[#e4e2ef] bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <Link
        href="/dashboard/leave-request"
        className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4648d4] to-[#6f73ee] text-white text-sm font-semibold transition-all hover:brightness-110 hover:shadow-[0_6px_18px_rgba(70,72,212,0.4)] active:scale-[0.98] active:shadow-[0_2px_8px_rgba(70,72,212,0.35)]"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        </svg>
        ขอลา
      </Link>
      <Link
        href="/dashboard/leave-history"
        className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white border border-[#dfddf0] text-[#4648d4] text-sm font-semibold shadow-sm transition-all hover:bg-[#f7f7ff] active:scale-[0.98]"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
        </svg>
        ประวัติการลา
      </Link>
    </div>
  );
}