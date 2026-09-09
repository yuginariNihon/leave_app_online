import { CheckCircle2, XCircle, Ban, Clock } from "lucide-react";
import { LeaveStatus } from "@/lib/generated/prisma/enums";
import { formatDateTime } from "@/lib/utils";

type LeaveDetailsHeaderProps = {
  title: string;
  referenceId: string;
  status: string;
  statusDate?: string;
};

const statusTextMap: Record<string, string> = {
  [LeaveStatus.pending]: "รอการอนุมัติ",
  [LeaveStatus.approved]: "ได้รับการอนุมัติ",
  [LeaveStatus.rejected]: "ไม่ได้รับการอนุมัติ",
  [LeaveStatus.cancelled]: "ยกเลิกการลา",
};

export function LeaveDetailsHeader({
  title,
  referenceId,
  status,
  statusDate,
}: LeaveDetailsHeaderProps) {
  const isApproved = status === LeaveStatus.approved;
  const isRejected = status === LeaveStatus.rejected;
  const isCancelled = status === LeaveStatus.cancelled;
  const isPending = status === LeaveStatus.pending;

  return (
    <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a40]">{title}</h1>
        <p className="text-slate-500 font-medium">รหัสอ้างอิง: {referenceId}</p>
      </div>
      <div className="flex items-center">
        <div
          className={`
            border px-6 md:px-12 py-7 min-h-[100px] rounded-2xl flex items-center gap-4 md:gap-6 text-2xl font-black shadow-lg
            ${isApproved ? "bg-green-100 text-green-700 border-green-200" : ""}
            ${isRejected ? "bg-red-100 text-red-700 border-red-200" : ""}
            ${isCancelled ? "bg-slate-100 text-slate-600 border-slate-200" : ""}
            ${isPending ? "bg-amber-100 text-amber-700 border-amber-200" : ""}
          `}
        >
          {isApproved && <CheckCircle2 className="w-12 h-12 shrink-0 fill-green-700 text-white" />}
          {isRejected && <XCircle className="w-12 h-12 shrink-0 fill-red-700 text-white" />}
          {isCancelled && <Ban className="w-12 h-12 shrink-0 text-slate-600" />}
          {isPending && <Clock className="w-12 h-12 shrink-0 fill-amber-700 text-white" />}
          <div className="flex flex-col items-start gap-1">
            <span className="leading-tight">{statusTextMap[status] ?? status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
