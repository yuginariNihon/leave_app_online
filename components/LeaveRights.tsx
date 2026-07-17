
import type { LeaveRightItem } from "@/lib/services/leaveService";

export function LeaveRights({ rights }: { rights: LeaveRightItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-[#c7c4d7] overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[#c7c4d7] bg-[#f0f3ff]">
        <h4 className="text-sm font-semibold text-[#111c2d]">
          สิทธิ์การลาคงเหลือ{" "}
          <span className="font-normal text-[#464554] opacity-70">Entitlements</span>
        </h4>
      </div>
      <div className="max-h-[350px] overflow-y-auto divide-y divide-[#c7c4d7]">
        {rights.length === 0 && (
          <div className="p-4 text-sm text-[#464554]">ไม่มีข้อมูลสิทธิลา</div>
        )}
        {rights.map((r) => {
          const remaining = r.maxDays - r.usedDays;
          return (
            <div
              key={r.leaveTypeId}
              className="p-4 flex justify-between items-center hover:bg-[#f9f9ff] transition-colors"
            >
              <div>
                <p className="text-[18px] font-medium text-[#111c2d] leading-[1.6]">{r.leaveTypeName}</p>
                <p className="text-[16px] text-[#464554] opacity-60 leading-[1.6]">โควตา: {r.maxDays.toFixed(2)} วัน</p>
              </div>
              <span className="text-[16px] font-bold text-[#4648d4] leading-[1.6]">{remaining.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
