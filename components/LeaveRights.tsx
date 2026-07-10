import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { LeaveRightItem } from "@/lib/services/leaveService";

export function LeaveRights({ rights }: { rights: LeaveRightItem[] }) {
  return (
    <Card className="bg-white rounded-[8px] border-[#c7c5cf] shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <h3 className="font-bold text-[#0b1c30] mb-4">สิทธิลาคงเหลือ</h3>
        <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
          {rights.length === 0 && (
            <p className="text-xs text-[#46464e]">ไม่มีข้อมูลสิทธิลา</p>
          )}
          {rights.map((r) => {
            const percent = r.maxDays > 0 ? (r.usedDays / r.maxDays) * 100 : 0;
            return (
              <div key={r.leaveTypeId}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#0b1c30]">{r.leaveTypeName}</span>
                  <span className="text-[#46464e]">{r.usedDays} / {r.maxDays} วัน</span>
                </div>
                <Progress value={percent} className="h-2 bg-[#eff4ff]" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
