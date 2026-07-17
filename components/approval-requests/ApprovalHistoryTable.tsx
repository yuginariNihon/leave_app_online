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
import { ApprovalStatus } from "@/lib/generated/prisma/enums";
import { formatLeaveDateRange, formatDays, formatDateTime } from "@/lib/utils";

interface ApprovalHistoryItem {
  approvalId: string;
  leaveId: string;
  staffName: string;
  staffCode: string;
  departmentName: string;
  leaveTypeName: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: string | null;
  reason: string | null;
  status: string;
  comment: string | null;
  actedAt: string | null;
  approvalLevel: number;
}

interface ApprovalHistoryTableProps {
  data: ApprovalHistoryItem[];
}

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  [ApprovalStatus.approved]: {
    label: "อนุมัติ",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  [ApprovalStatus.rejected]: {
    label: "ไม่อนุมัติ",
    className: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-500",
  },
  [ApprovalStatus.skipped]: {
    label: "ข้าม",
    className: "bg-gray-100 text-gray-600 border-gray-300",
    dot: "bg-gray-400",
  },
  [ApprovalStatus.cancelled]: {
    label: "ยกเลิก",
    className: "bg-gray-100 text-black border-gray-300",
    dot: "bg-gray-400",
  },
};

export function ApprovalHistoryTable({ data }: ApprovalHistoryTableProps) {
  const router = useRouter();

  const handleViewDetail = (leaveId: string) => {
    router.push(`/dashboard/leave-details?leaveId=${encodeURIComponent(leaveId)}`);
  };

  return (
    <Table containerClassName="overflow-auto max-h-[500px]">
        <TableHeader className="sticky top-0 z-10 bg-[#1e1b4b]">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">ผู้ยื่นขอ</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">ประเภทการลา</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">วันที่ลา</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">จำนวนวัน</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">ผล</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">วันที่ดำเนินการ</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">หมายเหตุ</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-[#c8c5d0]">
          {data.length > 0 ? (
            data.map((item) => {
              const cfg = statusConfig[item.status] ?? { label: item.status, className: "bg-gray-100 text-gray-600 border-gray-300", dot: "bg-gray-400" };
              return (
                <TableRow key={item.approvalId} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-[14px]">{item.staffName}</div>
                    <div className="text-[13px] text-[#787680]">{item.departmentName}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{item.leaveTypeName}</TableCell>
                  <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">
                    {formatLeaveDateRange(item.startDate, item.endDate)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{formatDays(item.totalDays)}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${cfg.className}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                      {cfg.label}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-[#47464f] whitespace-nowrap">
                    {item.actedAt ? formatDateTime(item.actedAt) : "-"}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-[#787680] max-w-[200px] truncate">
                    {item.comment ?? "-"}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
                      onClick={() => handleViewDetail(item.leaveId)}
                    >
                      <Eye className="w-[20px] h-[20px]" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-20 text-[#47464f]">
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
