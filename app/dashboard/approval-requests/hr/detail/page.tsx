"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Download,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Clock,
  Info,
  ListOrdered,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import { MdCancel } from "react-icons/md";
import { formatThaiDate, formatDateTime } from "@/lib/utils";
import type { LeaveDetailResponse } from "@/lib/services/leaveService";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export default function HrApprovalDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leaveId = searchParams.get("leaveId");

  const [detail, setDetail] = useState<LeaveDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!leaveId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("ไม่พบข้อมูลคำขอลา");
      setLoading(false);
      return;
    }

    async function fetchDetail() {
      try {
        const res = await fetch(`/api/leaves/detail?leaveId=${leaveId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to fetch detail");
        setDetail(json.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch detail");
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [leaveId]);

  const handleAction = async (status: "approved" | "rejected", comment?: string) => {
    const pendingApproval = detail?.approvals?.find((a) => a.status === "pending");
    if (!pendingApproval) {
      toast.error("ไม่พบรายการรออนุมัติ");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/leaves/approvals/hr/${pendingApproval.approvalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "ไม่สามารถดำเนินการได้");

      router.replace(`/dashboard/approval-requests/hr?approvalResult=${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถดำเนินการได้");
    } finally {
      setProcessing(false);
      setRejectDialogOpen(false);
      setRejectReason("");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;
  if (error || !detail) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || "ไม่พบข้อมูล"}</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-6 md:p-10">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "HR Approvals" }, { label: "Detail" }]}
          className="mb-4"
        />
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="text-[#46464f] hover:text-[#131645] font-medium gap-2 p-0">
            <ArrowLeft className="w-4 h-4" /> กลับหน้ารายการคำขอลา (HR)
          </Button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#131645] mb-1">รายละเอียดคำขอลา</h1>
            <p className="text-[#46464f] text-sm">รหัสอ้างอิง: #NFT-{detail.leaveId.slice(0,4)}</p>
          </div>
           <div className="bg-[#ffe0b2] h-20 px-6 py-3 rounded-xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#E65100] fill-[#E65100]" />
            <span className="text-[#E65100] font-bold text-lg">รอการอนุมัติ</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 space-y-8 rounded-2xl shadow-sm border border-[#c7c5d0]/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InfoSection icon={<FileCheck2 className="w-6 h-6 text-white"/>} label="ประเภทการลา" value={detail.leaveTypeName} bg="bg-[#131645]" />
                <InfoSection icon={<Clock className="w-6 h-6 text-[#46464f]"/>} label="วันที่ยื่นคำขอ" value={formatThaiDate(detail.createdAt)} bg="bg-[#efecff]" />
              </div>

              <div className="bg-[#F1F3FB] rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-bold text-[#46464f]/60 uppercase tracking-widest">ระยะเวลา</label>
                  <div className="flex items-center gap-4">
                    <div><p className="text-[10px] text-[#46464f] uppercase font-semibold">เริ่มต้น</p><p className="font-bold text-[#131645]">{formatThaiDate(detail.startDate)}</p></div>
                    <ArrowLeft className="w-4 h-4 text-[#c7c5d0] rotate-180" />
                    <div><p className="text-[10px] text-[#46464f] uppercase font-semibold">สิ้นสุด</p><p className="font-bold text-[#131645]">{formatThaiDate(detail.endDate)}</p></div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#46464f]/60 uppercase tracking-widest">จำนวนวันลา</label>
                  <p className="text-4xl font-bold text-[#131645] mt-2">{detail.totalDays} <span className="text-lg">วัน</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-[#46464f]/60 flex items-center gap-2"><Info className="w-4 h-4"/> เหตุผลการลา</label>
                <div className="p-6 bg-white border border-[#c7c5d0]/30 rounded-xl text-[#181934] leading-relaxed italic">{detail.reason}</div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-[#46464f]/60 flex items-center gap-2"><User className="w-4 h-4"/> ข้อมูลพนักงาน</label>
                <div className="grid grid-cols-2 gap-4">
                  <StaffInfoTile label="ชื่อ - นามสกุล" value={detail.staffName} />
                  <StaffInfoTile label="รหัสพนักงาน" value={detail.staffCode} />
                  <StaffInfoTile label="แผนก" value={detail.departmentName ?? "-"} />
                  <StaffInfoTile label="ตำแหน่ง" value={detail.positionName ?? "-"} />
                </div>
              </div>

              {detail.attachments && detail.attachments.length > 0 && (
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#46464f]/60">เอกสารแนบ</label>
                  {detail.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-[#c7c5d0]/30 rounded-xl bg-white hover:border-[#131645] transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#E8E6FF] flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#131645]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#131645]">{att.fileName}</p>
                          <p className="text-[10px] text-[#46464f]">
                            {(att.mimeType ?? "Unknown").toUpperCase()} • {att.fileSize ? `${(att.fileSize / 1024 / 1024).toFixed(1)} MB` : "N/A"}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-xs font-bold text-[#131645] hover:underline gap-1 px-2">
                        ดาวน์โหลด
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
              <AlertDialogContent className="max-w-md p-0 overflow-hidden border-none rounded-lg shadow-2xl">
                <AlertDialogHeader className="bg-red-600 px-6 py-4">
                  <AlertDialogTitle className="text-white text-lg font-bold m-0 flex items-center gap-2">
                    <MdCancel className="w-6 h-6" /> ยืนยันการไม่อนุมัติ
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription className="sr-only">
                  กรุณาระบุเหตุผลที่ไม่อนุมัติคำขอลานี้
                </AlertDialogDescription>
                <div className="p-6 space-y-4">
                  <label className="text-sm font-medium text-gray-700">
                    โปรดระบุเหตุผลที่ไม่อนุมัติ
                  </label>
                  <Textarea
                    placeholder="ระบุเหตุผล..."
                    className="bg-white border-gray-200 min-h-[100px] resize-none"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <AlertDialogFooter className="px-6 pb-6 pt-0 flex gap-3 flex-row sm:justify-end sm:space-x-0">
                  <AlertDialogCancel
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 h-auto rounded-lg transition-all active:scale-[0.98] mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={processing}
                  >
                    ปิด
                  </AlertDialogCancel>
                  <LoadingButton
                    onClick={() => handleAction("rejected", rejectReason)}
                    isLoading={processing}
                    loadingText="กำลังดำเนินการ..."
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 h-auto rounded-lg shadow-md transition-all active:scale-[0.98] mt-3"
                  >
                    ยืนยันการไม่อนุมัติ
                  </LoadingButton>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex justify-end gap-4 pt-4">
              <LoadingButton size="lg" className="px-10 h-14 bg-white border-2 border-[#b7102a] text-[#b7102a] hover:bg-[#b7102a] hover:text-white rounded-xl font-bold" onClick={() => setRejectDialogOpen(true)} isLoading={processing} loadingText="กำลังดำเนินการ...">
                <XCircle className="w-5 h-5 mr-2" /> ไม่อนุมัติ
              </LoadingButton>
              <LoadingButton size="lg" className="px-10 h-14 bg-[#131645] hover:bg-black text-white rounded-xl font-bold" onClick={() => handleAction("approved")} isLoading={processing} loadingText="กำลังดำเนินการ...">
                <CheckCircle className="w-5 h-5 mr-2" /> อนุมัติคำขอ
              </LoadingButton>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6 space-y-6 rounded-2xl shadow-sm border border-[#c7c5d0]/30">
              <h3 className="font-bold text-[#131645] flex items-center gap-2 border-l-4 border-[#131645] pl-3">การพิจารณาคำขอ</h3>
              <div className="p-8 border-2 border-dashed border-[#c7c5d0]/40 rounded-xl bg-[#FBFBFF] flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <Clock className="w-8 h-8 text-[#E65100]" />
                </div>
                <p className="font-bold">อยู่ระหว่างการพิจารณา</p>
              </div>
            </Card>

            <Card className="p-6 space-y-6 rounded-2xl shadow-sm border border-[#c7c5d0]/30">
              <h3 className="font-bold text-[#131645] flex items-center gap-2">
                <ListOrdered className="w-4 h-4" /> กิจกรรมล่าสุด
              </h3>
              <div className="space-y-8">
                <div className="relative flex gap-5">
                  <div className="w-[2px] bg-[#e2dfff] absolute left-2 top-5 bottom-[-20px]" />
                  <div className="w-4 h-4 shrink-0 rounded-full border-2 border-[#131645] bg-white z-10" />
                  <div>
                    <p className="font-bold text-sm">ส่งคำขอลาหยุด</p>
                    <p className="text-[10px] text-[#46464f]">{formatDateTime(detail.createdAt)}</p>
                  </div>
                </div>

                {detail.approvals
                  ?.filter((a) => a.status !== "pending")
                  .sort((a, b) => a.level - b.level)
                  .map((a) => (
                    <div key={a.approvalId} className="relative flex gap-5">
                      <div className="w-[2px] bg-[#e2dfff] absolute left-2 top-5 bottom-[-20px]" />
                      <div className={`w-4 h-4 shrink-0 rounded-full z-10 ${a.status === "approved" ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
                      <div>
                      <p className="font-bold text-sm">
                        {a.status === "approved" ? "อนุมัติ" : "ไม่อนุมัติ"}
                        {a.approverName ? ` โดย ${a.approverName}` : ""}<br/>
                        {a.approverRole ? ` ( ${a.approverRole} )` : ""}
                      </p>
                        <p className="text-[10px] text-[#46464f]">{a.approvedAt ? formatDateTime(a.approvedAt) : "-"}</p>
                        {a.comment && <p className="text-xs text-[#46464f] mt-0.5 italic">&quot;{a.comment}&quot;</p>}
                      </div>
                    </div>
                  ))}

                {detail.status === "pending" ? (
                  (() => {
                    const pendingApproval = detail.approvals?.find((a) => a.status === "pending");
                    return (
                      <div className="relative flex gap-5">
                        <div className="w-4 h-4 shrink-0 rounded-full bg-[#131645] z-10" />
                        <div>
                          <p className="font-bold text-sm text-[#131645]">
                            รอการพิจารณา{pendingApproval?.approverRole ? ` (${pendingApproval.approverRole})` : ""}
                          </p>
                          <p className="text-[10px] text-[#131645] font-bold">ปัจจุบัน</p>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="relative flex gap-5">
                    <div className={`w-4 h-4 shrink-0 rounded-full z-10 ${detail.status === "approved" ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
                    <div>
                      <p className={`font-bold text-sm ${detail.status === "approved" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {detail.status === "approved" ? "อนุมัติครบทุกขั้นตอนแล้ว" : "คำขอถูกปฏิเสธ"}
                      </p>
                      <p className="text-[10px] text-[#46464f]">สิ้นสุด</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoSection({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className="flex flex-col space-y-4">
      <label className="text-xs font-bold uppercase text-[#46464f]/60">{label}</label>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
        <span className="text-xl font-bold text-[#131645]">{value}</span>
      </div>
    </div>
  );
}

function StaffInfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-[#fcf8ff] border border-[#c7c5d0]/20 rounded-xl">
      <p className="text-[10px] font-semibold text-[#46464f]/60 mb-1">{label}</p>
      <p className="text-lg font-bold text-[#181934]">{value}</p>
    </div>
  );
}
