"use client";

import { Eye, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import type { LeaveRecord } from "./types";
import { statusTextMap } from "./types";
import { setLeaveDetailId } from "@/lib/navigation-state";
import { formatDateOnly, formatLeaveDateRange, formatDays } from "@/lib/utils";

interface LeaveTableProps {
  data: LeaveRecord[];
}

export function LeaveTable({ data }: LeaveTableProps) {
  const router = useRouter();

  const handleViewDetail = (leaveId: string) => {
    setLeaveDetailId(leaveId);
    router.push(`/dashboard/leave-details?leaveId=${encodeURIComponent(leaveId)}`);
  };

  return (
    <Table containerClassName="overflow-auto max-h-[500px]">
        <TableHeader className="sticky top-0 z-10 bg-[#1e1b4b]">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">วันที่เขียนใบลา</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">วันที่ลา</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">ประเภทการลา</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">จำนวนวันที่ลา</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">สถานะ</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-[#c8c5d0]">
          {data.length > 0 ? (
            data.map((leave) => (
              <TableRow key={leave.leaveId} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                <TableCell className="px-6 py-4 text-[14px] leading-[20px] font-semibold whitespace-nowrap">
                  {formatDateOnly(leave.createdAt)}
                </TableCell>
                <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">
                  {formatLeaveDateRange(leave.startDate, leave.endDate)}
                </TableCell>
                <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{leave.leaveTypeName}</TableCell>
                <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{formatDays(leave.totalDays)}</TableCell>
                <TableCell className="px-6 py-4">
                  <StatusBadge status={leave.status} text={statusTextMap[leave.status] ?? leave.status} />
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
                      onClick={() => handleViewDetail(leave.leaveId)}
                    >
                      <Eye className="w-[20px] h-[20px]" />
                    </button>
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
                    >
                      <FileText className="w-[20px] h-[20px]" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-20 text-[#47464f]">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-10 h-10 opacity-20" />
                  <span>ไม่พบข้อมูลที่ค้นหา</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
    </Table>
  );
}
