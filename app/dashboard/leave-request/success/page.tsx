import { requireSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { getLeaveDetailById } from "@/lib/services/leaveService";
import { formatThaiShortDate, buildLeaveReferenceId } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SuccessMode = "submit" | "edit" | "cancel";

const MODE_CONFIG: Record<
  SuccessMode,
  {
    title: string;
    rowLabel: string;
    status?: { label: string; className: string };
  }
> = {
  submit: {
    title: "ยื่นคำขอลาเรียบร้อย",
    rowLabel: "ยื่นคำขอเมื่อ",
    status: { label: "รอการอนุมัติ", className: "text-[#026e00] font-bold" },
  },
  edit: {
    title: "แก้ไขคำขอลาเรียบร้อย",
    rowLabel: "แก้ไขเมื่อ",
  },
  cancel: {
    title: "ยกเลิกคำขอลาเรียบร้อย",
    rowLabel: "ยกเลิกเมื่อ",
    status: { label: "ยกเลิกแล้ว", className: "text-[#ef4444] font-bold" },
  },
};

type EditDetail = {
  leaveTypeName: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: number;
  reason: string | null;
  cancelReason: string | null;
};

export default async function LeaveRequestSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; submittedAt?: string; leaveId?: string }>;
}) {
  const user = await requireSessionUser();
  if (!user?.staffId) redirect("/login");

  const params = await searchParams;
  const mode: SuccessMode = params.mode === "edit" || params.mode === "cancel" ? params.mode : "submit";
  const submittedAt = params.submittedAt
    ? decodeURIComponent(params.submittedAt)
    : new Date().toLocaleString("th-TH");
  const config = MODE_CONFIG[mode];

  let detail: EditDetail | null = null;
  if (params.leaveId) {
    try {
      const found = await getLeaveDetailById(params.leaveId, user.staffId, user.roles);
      if (found) {
        detail = {
          leaveTypeName: found.leaveTypeName,
          startDate: found.startDate,
          endDate: found.endDate,
          totalDays: found.totalDays,
          reason: found.reason,
          cancelReason: found.cancelReason,
        };
      }
    } catch {
      detail = null;
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
      <main className="flex-grow p-4 md:p-8 max-w-2xl mx-auto w-full flex flex-col justify-center pb-24">
        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "Leave Request" }]}
          className="mb-6"
        />
        <div className="bg-white rounded-2xl shadow-xl border border-[#e4e2ef] p-8 md:p-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-[#00f900] rounded-full flex items-center justify-center shadow-lg shadow-green-200">
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>

            <h1 className="mt-7 text-2xl font-bold text-slate-900">{config.title}</h1>

            <div className="mt-6 w-full max-w-sm mx-auto overflow-hidden rounded-xl border border-[#e4e2ef]">
              <table className="w-full text-left text-base">
                <tbody>
                  {params.leaveId && (
                    <tr>
                      <th scope="row" className="w-1/3 bg-[#f7f7fd] px-4 py-3 text-sm font-bold text-slate-900 border-b border-[#e4e2ef]">
                        รหัสคำขอ
                      </th>
                      <td className="px-4 py-3 text-slate-900 font-bold border-b border-[#e4e2ef]">
                        {buildLeaveReferenceId(params.leaveId)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th scope="row" className="w-1/3 bg-[#f7f7fd] px-4 py-3 text-sm font-bold text-slate-900 border-b border-[#e4e2ef]">
                      {config.rowLabel}
                    </th>
                    <td className="px-4 py-3 text-slate-700 border-b border-[#e4e2ef]">
                      {submittedAt}
                    </td>
                  </tr>
                  {config.status && (
                    <tr>
                      <th scope="row" className="w-1/3 bg-[#f7f7fd] px-4 py-3 text-sm font-bold text-slate-900">
                        สถานะ
                      </th>
                      <td className={`px-4 py-3 ${config.status.className}`}>
                        {config.status.label}
                      </td>
                    </tr>
                  )}
                  {detail && (
                    <>
                      <tr>
                        <th scope="row" className="w-1/3 bg-[#f7f7fd] px-4 py-3 text-sm font-bold text-slate-900 border-b border-[#e4e2ef] align-top">
                          ประเภทการลา
                        </th>
                        <td className="px-4 py-3 text-slate-700 border-b border-[#e4e2ef]">
                          {detail.leaveTypeName}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row" className="w-1/3 bg-[#f7f7fd] px-4 py-3 text-sm font-bold text-slate-900 border-b border-[#e4e2ef] align-top">
                          วันที่ลา
                        </th>
                        <td className="px-4 py-3 text-slate-700 border-b border-[#e4e2ef]">
                          {formatThaiShortDate(detail.startDate)} ถึง {formatThaiShortDate(detail.endDate)}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row" className="w-1/3 bg-[#f7f7fd] px-4 py-3 text-sm font-bold text-slate-900 border-b border-[#e4e2ef] align-top">
                          จำนวนวัน
                        </th>
                        <td className="px-4 py-3 text-slate-700 border-b border-[#e4e2ef]">
                          {detail.totalDays} วัน
                        </td>
                      </tr>
                      {detail.reason && (
                        <tr>
                          <th scope="row" className="w-1/3 bg-[#f7f7fd] px-4 py-3 text-sm font-bold text-slate-900 align-top">
                            เหตุผล
                          </th>
                          <td className="px-4 py-3 text-slate-700 whitespace-pre-line">
                            {detail.reason}
                          </td>
                        </tr>
                      )}
                      {mode === "cancel" && detail.cancelReason && (
                        <tr>
                          <th scope="row" className="w-1/3 bg-[#f7f7fd] px-4 py-3 text-sm font-bold text-slate-900 align-top">
                            เหตุผลการยกเลิก
                          </th>
                          <td className="px-4 py-3 text-slate-700 whitespace-pre-line">
                            {detail.cancelReason}
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div className="w-full h-px bg-slate-200 my-10" />

            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
              <Button
                asChild
                variant="outline"
                className="h-12 flex-1 rounded-lg border-2 border-slate-900 bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 shadow-none"
              >
                <Link href="/dashboard">กลับหน้าหลัก</Link>
              </Button>
              <Button
                asChild
                className="h-12 flex-1 rounded-lg bg-[#100d41] text-white hover:bg-[#1a1752] font-bold text-sm shadow-lg shadow-[#100d41]/20 transition-all active:scale-95"
              >
                <Link href="/dashboard/leave-history">ดูประวัติการลา</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}