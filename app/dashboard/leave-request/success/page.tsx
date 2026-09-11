import { requireSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export const dynamic = "force-dynamic";

export default async function LeaveRequestSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ submittedAt?: string }>;
}) {
  const user = await requireSessionUser();
  if (!user?.staffId) redirect("/login");

  const params = await searchParams;
  const submittedAt = params.submittedAt
    ? decodeURIComponent(params.submittedAt)
    : new Date().toLocaleString("th-TH");

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

            <h1 className="mt-7 text-2xl font-bold text-slate-900">ยื่นคำขอลาเรียบร้อย</h1>

            <div className="mt-5 space-y-2 text-base text-slate-700">
              <p>
                <span className="font-bold text-slate-900">ยื่นคำขอเมื่อ : </span>
                <span>{submittedAt}</span>
              </p>
              <p>
                <span className="font-bold text-slate-900">สถานะ : </span>
                <span className="text-[#026e00] font-bold">รอการอนุมัติ</span>
              </p>
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