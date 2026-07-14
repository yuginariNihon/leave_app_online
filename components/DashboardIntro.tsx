import React from "react";

export function DashboardIntro({ userName }: { userName: string }) {
  return (
    <section className="mb-8">
      <h1 className="text-[32px] font-bold text-[#111c2d] leading-tight">Dashboard</h1>
      <p className="text-sm font-medium text-[#464554] mt-2">Welcome back, {userName}</p>
    </section>
  );
}
