"use client";

import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ResultErrorOverlayProps = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function ResultErrorOverlay({
  open,
  title,
  message,
  onClose,
}: ResultErrorOverlayProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f8f9ff]/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#e4e2ef] p-8 md:p-12">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-[#ef4444] rounded-full flex items-center justify-center shadow-lg shadow-red-200">
            <XCircle className="w-16 h-16 text-white" />
          </div>

          <h2 className="mt-7 text-2xl font-bold text-slate-900">{title}</h2>

          <p className="mt-4 text-base text-slate-700 break-words">{message}</p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 w-full mt-10">
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-lg border-2 border-slate-900 bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 shadow-none"
              onClick={onClose}
            >
              ลองอีกครั้ง
            </Button>
            <Button
              className="h-12 flex-1 rounded-lg bg-[#100d41] text-white hover:bg-[#1a1752] font-bold text-sm shadow-lg shadow-[#100d41]/20 transition-all active:scale-95"
              onClick={() => router.push("/dashboard")}
            >
              กลับหน้าหลัก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}