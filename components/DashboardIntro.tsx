export function DashboardIntro({ userName }: { userName: string }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 5
      ? "ยินดีต้อนรับกลับ"
      : hour < 12
        ? "สวัสดีตอนเช้า"
        : hour < 17
          ? "สวัสดีตอนบ่าย"
          : "สวัสดีตอนเย็น";
  const dateLabel = now.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4648d4] via-[#5659e2] to-[#6f73ee] px-6 py-7 text-white shadow-[0_8px_28px_rgba(70,72,212,0.3)]">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-28 right-32 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute right-12 top-8 hidden h-20 w-20 rounded-full border-2 border-white/15 md:block" />
      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          Dashboard
        </span>
        <p className="mt-4 text-sm font-medium text-white/85">{dateLabel}</p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight md:text-[30px]">
          {greeting}, {userName}
        </h1>
        <p className="mt-2 text-sm font-medium text-white/85">
          สรุปสิทธิ์การลาและรายการลาล่าสุดของคุณรออยู่ด้านล่าง
        </p>
      </div>
    </section>
  );
}