import React from "react";

export function DashboardIntro({ userName }: { userName: string }) {
  return (
    <section>
      <h1 className="text-2xl font-bold text-[#0b1c30] mb-1">Dashboard</h1>
      <p className="text-sm text-[#46464e]">Welcome back, {userName}</p>
    </section>
  );
}
