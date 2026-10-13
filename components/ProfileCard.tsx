import type { StaffProfile } from "@/lib/services/leaveService";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileCard({ profile }: { profile: StaffProfile }) {
  const initials = getInitials(profile.name);
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e7e6f3] bg-white shadow-[0_1px_2px_rgba(17,28,45,0.06)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#4648d4] to-[#6f73ee] p-6">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-base font-bold text-white ring-4 ring-white/25">
            {initials}
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-base font-bold text-white">{profile.name}</h4>
            <p className="text-xs font-medium text-white/80 mt-0.5">ID: {profile.staffCode}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Is Active
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-[#f0effa] px-6">
        <div className="flex items-center justify-between py-4">
          <span className="flex items-center gap-2 text-sm text-[#767586]">
            <svg className="h-4 w-4 text-[#b9b4d8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6h.01M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            ตำแหน่ง
          </span>
          <span className="text-sm font-semibold text-[#111c2d] text-right">{profile.positionName ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between py-4">
          <span className="flex items-center gap-2 text-sm text-[#767586]">
            <svg className="h-4 w-4 text-[#b9b4d8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            แผนก
          </span>
          <span className="text-sm font-semibold text-[#111c2d] text-right">{profile.departmentName ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between py-4">
          <span className="flex items-center gap-2 text-sm text-[#767586]">
            <svg className="h-4 w-4 text-[#b9b4d8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-4 7a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            ประเภทพนักงาน
          </span>
          <span className="text-sm font-semibold text-[#111c2d] text-right">{profile.employmentTypeName ?? "-"}</span>
        </div>
      </div>
    </div>
  );
}