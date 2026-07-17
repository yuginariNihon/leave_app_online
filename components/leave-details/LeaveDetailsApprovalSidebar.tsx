
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, Clock, Ban, ListTodo, Calendar as CalendarIcon } from "lucide-react";
import { LeaveStatus } from "@/lib/generated/prisma/enums";
import { formatThaiDateTime } from "@/lib/utils";

type ApprovalItem = {
  approverName: string;
  approverRole: string;
  level: number;
  status: string;
  comment: string | null;
  approvedAt: string | null;
};

type ActivityItem = {
  title: string;
  date: string;
  isCurrent?: boolean;
  subtitle?: string;
};

type LeaveDetailsApprovalSidebarProps = {
  approvals: ApprovalItem[];
  status: string;
  quota?: { remaining: number; total: number; percent: number };
  activities?: ActivityItem[];
};

export function LeaveDetailsApprovalSidebar({
  approvals,
  status,
  quota,
  activities,
}: LeaveDetailsApprovalSidebarProps) {
  const isApproved = status === LeaveStatus.approved;
  const isRejected = status === LeaveStatus.rejected;
  const isCancelled = status === LeaveStatus.cancelled;
  const isPending = status === LeaveStatus.pending;

  const latestApproval = approvals.length > 0 ? approvals[approvals.length - 1] : null;

  return (
    <div className="bg-slate-50/50 p-6 md:p-8 space-y-8">
      {!isPending && latestApproval && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-[#1a1a40] flex items-center gap-3">
            <div className="w-1 h-6 bg-[#1a1a40] rounded-full"></div>
            การพิจารณาคำขอ
          </h2>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-14 h-14 border-2 border-white shadow-md">
                  <AvatarImage src="" alt={latestApproval.approverName} />
                  <AvatarFallback>
                    {latestApproval.approverName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                  isApproved ? "bg-green-500" : isRejected ? "bg-red-500" : isCancelled ? "bg-slate-500" : "bg-amber-500"
                }`}>
                  {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-white fill-green-500" />}
                  {isRejected && <XCircle className="w-3.5 h-3.5 text-white fill-red-500" />}
                  {isCancelled && <Ban className="w-3.5 h-3.5 text-white" />}
                  {!isApproved && !isRejected && !isCancelled && <Clock className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <div>
                <div className="font-bold text-[#1a1a40]">{latestApproval.approverName}</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{latestApproval.approverRole}</div>
              </div>
            </div>

            <Card className="bg-white border border-slate-100 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-400">สถานะ:</span>
                    <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                      isApproved ? "text-green-600 bg-green-50" : 
                      isRejected ? "text-red-600 bg-red-50" : 
                      isCancelled ? "text-slate-600 bg-slate-50" :
                      "text-amber-600 bg-amber-50"
                    }`}>
                      {isApproved ? "อนุมัติแล้ว" : isRejected ? "ไม่อนุมัติ" : isCancelled ? "ยกเลิกแล้ว" : "รอพิจารณา"}
                    </span>
                  </div>
                  <Separator className="bg-slate-50" />
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-400">เมื่อวันที่:</span>
                    <span className="text-slate-700">{formatThaiDateTime(latestApproval.approvedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {latestApproval.comment && (
              <div className={`relative p-5 rounded-2xl border-l-4 italic text-sm text-slate-600 leading-relaxed shadow-sm ${
                isApproved ? "bg-green-50 border-green-500" : 
                isRejected ? "bg-red-50 border-red-500" : 
                "bg-slate-50 border-slate-400"
              }`}>
                {latestApproval.comment}
              </div>
            )}
          </div>
        </div>
      )}

      {isPending && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-[#1a1a40] flex items-center gap-3">
            <div className="w-1 h-6 bg-[#1a1a40] rounded-full"></div>
            การพิจารณาคำขอ
          </h2>
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 bg-white rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-[#1a1a40]">อยู่ระหว่างการพิจารณา</p>
              <p className="text-sm text-slate-400">หัวหน้าแผนกกำลังตรวจสอบข้อมูลคำขอของคุณ</p>
            </div>
          </div>
        </div>
      )}

      {activities && (
        <div className="space-y-6 pt-4">
          <h2 className="text-lg font-bold text-[#1a1a40] flex items-center gap-3">
            <ListTodo className="w-5 h-5" />
            กิจกรรมล่าสุด
          </h2>
          <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {activities.map((activity, idx) => (
              <div key={idx} className="relative pl-10">
                <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${
                  activity.isCurrent ? "bg-[#1a1a40]" : "bg-slate-200"
                }`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <p className={`text-sm font-bold ${activity.isCurrent ? "text-[#1a1a40]" : "text-slate-500"}`}>
                  {activity.title}
                </p>
                {activity.subtitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{activity.subtitle}</p>
                )}
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{activity.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {quota && (
        <div className="bg-[#1a1a40] p-6 rounded-2xl text-white shadow-xl shadow-[#1a1a40]/20 space-y-4 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <CalendarIcon className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">โควตาที่เหลือหลังอนุมัติ</div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-black italic">{quota.remaining}</span>
              <span className="text-lg font-bold opacity-60">/ {quota.total} วัน</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ width: `${quota.percent}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
