import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import type { StaffProfile } from "@/lib/services/leaveService";

export function ProfileCard({ profile }: { profile: StaffProfile }) {
  return (
    <Card className="bg-white rounded-[8px] border-[#c7c5cf] shadow-sm overflow-hidden" data-purpose="employee-profile">
      <CardContent className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-16 h-16 rounded-full bg-[#cbdbf5] flex items-center justify-center">
            <AvatarFallback className="bg-transparent">
              <svg className="w-10 h-10 text-[#0b1c30]/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
              </svg>
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-bold text-[#0b1c30] leading-tight">{profile.name}</h2>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-[#46464e]">Status: Is Active</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-y-3 text-sm border-t border-[#c7c5cf] pt-4">
          <div className="flex justify-between">
            <span className="text-[#46464e]">Employee ID :</span>
            <span className="font-medium text-[#0b1c30]">{profile.staffCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#46464e]">Position :</span>
            <span className="font-medium text-[#0b1c30]">{profile.positionName ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#46464e]">Department :</span>
            <span className="font-medium text-[#0b1c30]">{profile.departmentName ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#46464e]">Employee Type :</span>
            <span className="font-medium text-[#0b1c30]">{profile.employmentTypeName ?? "-"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
