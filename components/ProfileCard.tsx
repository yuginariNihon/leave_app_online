
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
    <div className="bg-white rounded-xl border border-[#c7c4d7] overflow-hidden shadow-sm">
      <div className="bg-[#e7eeff]/10 p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#e7eeff] flex items-center justify-center text-[#fffbff] text-base font-bold">
          {initials}
        </div>
        <div>
          <h4 className="text-base font-bold text-[#111c2d]">{profile.name}</h4>
          <p className="text-base font-medium text-[#464554] mt-0.5">ID: {profile.staffCode}</p>
          <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold mt-1 uppercase">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            Is Active
          </div>
        </div>
      </div>
      <div className="p-6 border-t border-[#c7c4d7] space-y-5">
        <div className="flex justify-between items-center">
          <span className="text-base text-[#464554] leading-[1.6]">ตำแหน่ง</span>
          <span className="text-base font-semibold text-[#111c2d] leading-[1.6]">{profile.positionName ?? "-"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-base text-[#464554] leading-[1.6]">แผนก</span>
          <span className="text-base font-semibold text-[#111c2d] leading-[1.6]">{profile.departmentName ?? "-"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-base text-[#464554] leading-[1.6]">ประเภทพนักงาน</span>
          <span className="text-base font-semibold text-[#111c2d] leading-[1.6]">{profile.employmentTypeName ?? "-"}</span>
        </div>
      </div>
    </div>
  );
}
