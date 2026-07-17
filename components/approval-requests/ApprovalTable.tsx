"use client";

import { CheckCircle2, XCircle, FileText, Eye } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { setLeaveDetailId } from "@/lib/navigation-state";
import { formatDateOnly, formatLeaveDateRange, formatDays } from "@/lib/utils";
import type { ApprovalRequestItem } from "@/lib/services/approvalService";

interface ApprovalTableProps {
  data: ApprovalRequestItem[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
  processingIds: string[];
  detailBasePath?: string;
}

export function ApprovalTable({
  data,
  selectedIds,
  onSelectChange,
  onApprove,
  onReject,
  processingIds,
  detailBasePath = "/dashboard/approval-requests/detail",
}: ApprovalTableProps) {
  const router = useRouter();
  const allSelected = data.length > 0 && selectedIds.length === data.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectChange([]);
    } else {
      onSelectChange(data.map((d) => d.approvalId));
    }
  };

  const handleSelectOne = (approvalId: string) => {
    if (selectedIds.includes(approvalId)) {
      onSelectChange(selectedIds.filter((id) => id !== approvalId));
    } else {
      onSelectChange([...selectedIds, approvalId]);
    }
  };

  return (
    <Table containerClassName="overflow-auto max-h-[500px]">
        <TableHeader className="sticky top-0 z-10 bg-[#1e1b4b]">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="text-white font-semibold px-6 py-4 w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#1a1a40]"
              />
            </TableHead>
             <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">ผู้ยื่นคำขอ</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">วันที่ส่ง</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">วันที่ลา</TableHead>
             <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">ประเภทการลา</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">จำนวนวัน</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-[#c8c5d0]">
          {data.length > 0 ? (
            data.map((item) => {
              const isProcessing = processingIds.includes(item.approvalId);
              return (
                <TableRow
                  key={item.approvalId}
                  className="hover:bg-[#eff4ff]/30 transition-all duration-200"
                >
                  <TableCell className="px-6 py-4">
                    <Checkbox
                      checked={selectedIds.includes(item.approvalId)}
                      onCheckedChange={() => handleSelectOne(item.approvalId)}
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold text-[14px]">{item.staffName}</span>
                      <span className="text-[13px] text-[#787680]">{item.staffCode}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[14px] leading-[20px] font-semibold whitespace-nowrap">
                    {formatDateOnly(item.createdAt)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">
                    {formatLeaveDateRange(item.startDate, item.endDate)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{item.leaveTypeName}</TableCell>
                  <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{formatDays(item.totalDays)}</TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
                        onClick={() => {
                          setLeaveDetailId(item.leaveId);
                          router.push(`${detailBasePath}?leaveId=${encodeURIComponent(item.leaveId)}`);
                        }}
                      >
                        <Eye className="w-[20px] h-[20px]" />
                      </button>
                      <LoadingButton
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-green-600 hover:bg-green-50"
                        isLoading={isProcessing}
                        onClick={() => onApprove(item.approvalId)}
                      >
                        <CheckCircle2 className="w-[20px] h-[20px]" />
                      </LoadingButton>
                      <LoadingButton
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-red-600 hover:bg-red-50"
                        isLoading={isProcessing}
                        onClick={() => onReject(item.approvalId)}
                      >
                        <XCircle className="w-[20px] h-[20px]" />
                      </LoadingButton>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-20 text-[#47464f]">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-10 h-10 opacity-20" />
                  <span>ไม่มีรายการรอการอนุมัติ</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
    </Table>
  );
}
