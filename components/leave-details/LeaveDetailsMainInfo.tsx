import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Download, CalendarDays, MoveRight, Palmtree, Info, UserCheck } from "lucide-react";

type AttachmentItem = {
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
};

type LeaveDetailsMainInfoProps = {
  leaveTypeName: string;
  requestedDate: string;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
  reason: string;
  // ⚠️ File upload — not yet implemented (attachments data not used)
  attachments: AttachmentItem[];
  supervisor?: { name: string; role: string };
};

import { formatFullDate, formatFileSize, formatThaiShortDate } from "@/lib/utils";

export function LeaveDetailsMainInfo({
  leaveTypeName,
  requestedDate,
  startDate,
  endDate,
  durationDays,
  reason,
  attachments,
  supervisor,
}: LeaveDetailsMainInfoProps) {
  const firstAttachment = attachments.length > 0 ? attachments[0] : null;

  return (
    <div className="lg:col-span-2 p-6 md:p-8 lg:border-r border-slate-100 space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col space-y-3">
          <label className="text-md font-bold text-slate-400 uppercase tracking-widest">ประเภทการลา</label>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#1a1a40] flex items-center justify-center shadow-lg shadow-[#1a1a40]/20">
              <Palmtree className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="block text-lg font-bold text-[#1a1a40]">{leaveTypeName}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <label className="text-md font-bold text-slate-400 uppercase tracking-widest">วันที่ยื่นคำขอ</label>
          <div className="flex items-center gap-3 py-1">
            <CalendarDays className="w-5 h-5 text-slate-400" />
            <span className="text-lg font-bold text-slate-700">{formatFullDate(requestedDate)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
        <div className="flex flex-col space-y-3">
          <label className="text-md font-bold text-slate-400 uppercase tracking-widest">ระยะเวลา</label>
          <div className="flex items-center gap-4 py-1">
            <div className="text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">เริ่มต้น</div>
              <div className="font-bold text-[#1a1a40] text-lg">{formatThaiShortDate(startDate)}</div>
            </div>
            <MoveRight className="w-6 h-6 text-slate-300" />
            <div className="text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">สิ้นสุด</div>
              <div className="font-bold text-[#1a1a40] text-lg">{formatThaiShortDate(endDate)}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <label className="text-md font-bold text-slate-400 uppercase tracking-widest">จำนวนวันลา</label>
          <div className="flex items-baseline gap-2 py-1">
            <span className="text-4xl font-black text-[#1a1a40]">{durationDays}</span>
            <span className="text-lg font-bold text-slate-400">วัน</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-md font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Info className="w-4 h-4" />
          เหตุผลการลา
        </label>
        <div className="p-5 bg-white border border-slate-200 rounded-xl text-slate-600 leading-relaxed shadow-sm">
          {reason}
        </div>
      </div>

      {supervisor && (
        <div className="space-y-4">
          <label className="text-md font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            ผู้รับผิดชอบงานแทน
          </label>
          <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl w-fit min-w-[300px]">
            <Avatar className="w-10 h-10 border border-white shadow-sm">
              <AvatarImage src="" alt={supervisor.name} />
              <AvatarFallback>{supervisor.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-bold text-[#1a1a40]">{supervisor.name}</div>
              <div className="text-xs text-slate-400 font-medium">{supervisor.role}</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <label className="text-md font-bold text-slate-400 uppercase tracking-widest">เอกสารแนบ</label>
        {firstAttachment ? (
          <div className="flex items-center gap-4 p-4 border border-slate-200 border-dashed rounded-xl bg-white hover:bg-slate-50 hover:border-[#1a1a40]/30 transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#1a1a40]/10 transition-colors">
              <FileText className="w-5 h-5 text-slate-400 group-hover:text-[#1a1a40]" />
            </div>
            <div className="flex-grow">
              <div className="text-sm font-bold text-[#1a1a40]">{firstAttachment.fileName}</div>
              <div className="text-xs text-slate-400 font-medium">
                {firstAttachment.mimeType ?? ""}
                {firstAttachment.fileSize ? ` • ${formatFileSize(firstAttachment.fileSize)}` : ""}
              </div>
            </div>
            <Download className="w-5 h-5 text-slate-300 group-hover:text-[#1a1a40] transition-colors" />
          </div>
        ) : (
          <div className="text-sm text-slate-400 italic">ไม่มีเอกสารแนบ</div>
        )}
      </div>
    </div>
  );
}
