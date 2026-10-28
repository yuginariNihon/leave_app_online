import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { Button } from "@/components/ui/button";

type BreadcrumbItem = { label: string; href?: string };

type EntityFormPageProps = {
  breadcrumb: BreadcrumbItem[];
  title: string;
  icon: LucideIcon;
  isSubmitting: boolean;
  loading?: boolean;
  onBack: () => void;
  children: ReactNode;
};

export function EntityFormPage({
  breadcrumb,
  title,
  icon: Icon,
  isSubmitting,
  loading = false,
  onBack,
  children,
}: EntityFormPageProps) {
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-[#45464d] text-sm">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F8FAFC]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#1a1a40]" />
            <p className="font-bold text-[#1a1a40]">กำลังบันทึก...</p>
          </div>
        </div>
      )}
      <main className="flex-1 overflow-y-auto">
        <section className="flex-1 px-4 md:px-10 py-8 md:py-12 bg-[#F8FAFC]">
          <div className="max-w-4xl mx-auto">
            <AppBreadcrumb className="mb-6" items={breadcrumb} />

            <div className="bg-[#1a1a40] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-3">
                  <Icon className="w-6 h-6" />
                  <h2 className="text-xl font-medium tracking-wide">{title}</h2>
                </div>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-white hover:text-[#100d41] rounded-lg bg-white/15 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">ย้อนกลับ</span>
                </Button>
              </div>
            </div>

            <div className="bg-white border-x border-b border-slate-200 p-8 shadow-sm rounded-b-2xl">
              {children}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
