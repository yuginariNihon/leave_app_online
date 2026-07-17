"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Printer, XCircle, X, AlertTriangle, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { LeaveStatus } from "@/lib/generated/prisma/enums";
import { formatLeaveDateRange } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LeaveDetailsActionsProps = {
  leaveId: string;
  status: string;
  leaveTypeName: string;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
  reason: string;
  onPrint: () => void;
  onCancel?: (cancelReason: string) => void;
  isCancelling?: boolean;
};

export function LeaveDetailsActions({
  leaveId,
  status,
  leaveTypeName,
  startDate,
  endDate,
  durationDays,
  onPrint,
  onCancel,
  isCancelling,
}: LeaveDetailsActionsProps) {
  const isPending = status === LeaveStatus.pending;
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (open) setCancelReason("");
  };

  return (
    <div className="mt-10 flex flex-col md:flex-row justify-center gap-4">
      {isPending && (
        <AlertDialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 px-10 h-14 rounded-xl font-bold hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all flex items-center gap-3"
            onClick={() => setDialogOpen(true)}
          >
            <XCircle className="w-5 h-5" />
            ยกเลิกคำขอลา
          </Button>
          <AlertDialogContent className="max-w-md p-0 overflow-hidden border-none rounded-lg shadow-2xl">
            <header className="bg-red-600 px-6 py-4 flex justify-between items-center">
              <AlertDialogTitle className="text-white text-lg font-bold m-0">ยืนยันยกเลิกคำขอลา</AlertDialogTitle>
              <AlertDialogCancel
                className="bg-transparent border-none p-0 h-auto text-white/80 hover:text-white hover:bg-transparent transition-colors"
                disabled={isCancelling}
              >
                <X className="h-6 w-6" />
              </AlertDialogCancel>
            </header>

            <div className="p-6">
              <AlertDialogDescription className="sr-only">
                คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอลาหยุดครั้งนี้? เมื่อดำเนินการแล้วจะไม่สามารถย้อนกลับได้
              </AlertDialogDescription>
              <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <p className="text-gray-600 font-medium">คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอนี้?</p>
              </div>

              <section className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">ประเภทการลา</span>
                    <span className="text-gray-900 font-semibold">{leaveTypeName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">ช่วงวันที่ลา</span>
                    <span className="text-gray-900 font-semibold text-sm">{formatLeaveDateRange(startDate, endDate)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-1">
                    <span className="text-gray-500 text-sm font-medium">จำนวนวันลา</span>
                    <span className="text-red-600 font-bold text-lg">{durationDays} วัน</span>
                  </div>
                </div>
              </section>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">เหตุผลในการยกเลิก</label>
                <Textarea
                  placeholder="โปรดระบุเหตุผลที่ยกเลิก..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-2 rounded-r">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-[12px] text-amber-800 font-semibold uppercase tracking-tight">
                      **** เมื่อยกเลิกแล้ว คำขอนี้จะไม่ถูกส่งให้ผู้อนุมัติ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <AlertDialogFooter className="px-6 pb-6 pt-0 flex gap-3 flex-row sm:justify-center sm:space-x-0">
              <AlertDialogCancel
                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 h-auto rounded-lg transition-all active:scale-[0.98] mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCancelling}
              >
                ปิด
              </AlertDialogCancel>
              <LoadingButton
                onClick={() => onCancel?.(cancelReason)}
                isLoading={isCancelling}
                loadingText="กำลังยกเลิก..."
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 h-auto rounded-lg shadow-md transition-all active:scale-[0.98] mt-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                ยืนยัน
              </LoadingButton>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {isPending && (
        <Button
          variant="secondary"
          className="bg-white border border-gray-200 text-[#1a1a40] px-8 h-14 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-3"
          onClick={() => {
            router.push(`/dashboard/leave-request/edit?leaveId=${leaveId}`);
          }}
        >
          <Edit className="w-5 h-5" />
          แก้ไขข้อมูล
        </Button>
      )}
      <Button
        className="bg-[#1a1a40] text-white px-10 h-14 rounded-xl font-bold hover:bg-[#1a1a40]/90 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#1a1a40]/20 flex items-center gap-3"
        onClick={onPrint}
      >
        <Printer className="w-5 h-5" />
        พิมพ์รายละเอียดคำขอ
      </Button>
    </div>
  );
}
