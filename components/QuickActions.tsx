import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function QuickActions() {
  return (
    <section className="grid grid-cols-1 gap-3">
      <Button
        asChild
        className="w-full bg-[#4b41e1] text-white py-8 rounded-[4px] font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-[#151939] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer h-auto border-none"
      >
        <Link href="/dashboard/leave-request">
          <>
            <svg
              className="!h-8 !w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4v16m8-8H4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
            <span className="text-xl">ขออนุมัติลา</span>
          </>
        </Link>
      </Button>
      <Button
        asChild
        className="w-full bg-[#f59e0b] text-white py-8 rounded-[4px] font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-orange-600 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer h-auto border-none"
      >
        <Link href="/dashboard/leave-history">
          <svg
            className="!h-8 !w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            ></path>
          </svg>
          <span className="text-xl">ประวัติการลา</span>
        </Link>
      </Button>
    </section>
  );
}
