import type { LeaveRightItem } from "@/lib/services/leaveService";

export function LeaveRights({ rights }: { rights: LeaveRightItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e7e6f3] bg-white shadow-[0_1px_2px_rgba(17,28,45,0.06)]">
      <div className="border-b border-[#e7e6f3] bg-gradient-to-r from-[#f3f4ff] to-white px-5 py-4">
        <h4 className="text-sm font-bold text-[#111c2d]">
          สิทธิ์การลาคงเหลือ{" "}
          <span className="font-normal text-[#767586]">Entitlements</span>
        </h4>
      </div>
      <div className="max-h-[350px] overflow-y-auto divide-y divide-[#f0effa]">
        {rights.length === 0 && (
          <div className="p-6 text-sm text-[#767586]">ไม่มีข้อมูลสิทธิลา</div>
        )}
        {rights.map((r) => {
          const remaining = Math.max(0, r.maxDays - r.usedDays);
          const pct = r.maxDays > 0 ? Math.min(100, (r.usedDays / r.maxDays) * 100) : 0;
          return (
            <div
              key={r.leaveTypeId}
              className="px-5 py-4 transition-colors hover:bg-[#f8f8ff]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-[16px] font-semibold text-[#111c2d] leading-[1.6]">
                  {r.leaveTypeName}
                </p>
                <span className="text-[16px] font-bold text-[#4648d4] leading-[1.6]">
                  {remaining.toFixed(2)}
                  <span className="ml-1 text-xs font-normal text-[#767586]">วัน</span>
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef0ff]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#4648d4] to-[#6f73ee] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs text-[#767586] leading-[1.6]">
                  ใช้แล้ว {r.usedDays.toFixed(2)} / {r.maxDays.toFixed(2)} วัน
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}