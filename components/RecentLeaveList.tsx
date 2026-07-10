"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecentLeaveItem } from "@/lib/services/leaveService";
import { useRouter } from "next/navigation";
import { LeaveStatus } from "@/lib/generated/prisma/enums";
import { formatDateOnly } from "@/lib/utils";
import { Button } from "./ui/button";

const statusStyle: Record<string, { label: string; cls: string }> = {
  [LeaveStatus.pending]: { label: "รออนุมัติ", cls: "bg-orange-100 text-orange-700" },
  [LeaveStatus.approved]: { label: "อนุมัติ", cls: "bg-green-100 text-green-700" },
  [LeaveStatus.rejected]: { label: "ไม่อนุมัติ", cls: "bg-red-100 text-red-700" },
  [LeaveStatus.cancelled]: { label: "ยกเลิก", cls: "bg-gray-100 text-gray-700" },
};

export function RecentLeaveList({ leaves }: { leaves: RecentLeaveItem[] }) {
  const router = useRouter();

  return (
    <Card className="bg-white rounded-[8px] border-[#c7c5cf] shadow-sm overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#0b1c30]">รายการลาล่าสุด</h3>
          <Button
            className="bg-transparent text-xs text-[#46464e] hover:text-[#0b1c30] cursor-pointer"
            onClick={() => router.push("/dashboard/leave-history")}
          >
            ดูทั้งหมด
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {leaves.length === 0 && (
            <p className="text-sm text-[#46464e]">ไม่มีรายการลา</p>
          )}
          {leaves.map((item) => {
            const s = statusStyle[item.status] ?? { label: item.status, cls: "bg-gray-100 text-gray-700" };
            return (
              <div
                key={item.leaveId}
                className="flex items-center justify-between pb-3 border-b border-[#c7c5cf] last:border-b-0 cursor-pointer hover:bg-[#f8f9ff] -mx-5 px-5 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#0b1c30]">{formatDateOnly(item.createdAt)}</span>
                  <span className="text-xs text-[#46464e]">{item.leaveTypeName}</span>
                </div>
                <Badge className={`rounded-full text-[12px] font-semibold border-none shadow-none ${s.cls}`}>
                  {s.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
