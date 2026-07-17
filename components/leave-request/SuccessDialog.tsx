"use client";

import { toast } from "sonner";
import { CheckCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitTime: string;
  title?: string;
  statusText?: string;
  redirectTo?: string;
  toastMessage?: string;
  styleAlert?: string;
}

export function SuccessDialog({ open, onOpenChange, submitTime, title, statusText, redirectTo, toastMessage, styleAlert }: SuccessDialogProps) {
  const router = useRouter();
  const displayTitle = title ?? "ยื่นคำขอลาเรียบร้อย";
  const displayStatus = statusText ?? "รอการอนุมัติ";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg p-0 overflow-hidden border-none rounded-lg shadow-[0px_4px_20px_rgba(0,0,0,0.15)] bg-white">
        {/* TopAppBar */}
        <header className="flex items-center justify-between px-6 h-16 w-full bg-[#100d41] text-white">
          <AlertDialogTitle className="text-xl font-medium tracking-wide">{displayTitle}</AlertDialogTitle>
          <button 
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform"
          >
            <X className="w-6 h-6" />
          </button>
        </header>
        
        <AlertDialogDescription className="sr-only">
          ยื่นคำขอลาสำเร็จและอยู่ระหว่างรอการอนุมัติ
        </AlertDialogDescription>

        {/* Content Canvas */}
        <div className="px-8 pt-10 pb-8">
          <div className="flex flex-col items-center text-center">
            {/* Success Status Indicator */}
            <div className="w-24 h-24 bg-[#00f900] rounded-full flex items-center justify-center shadow-lg shadow-green-200">
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>

            <h2 className="mt-7 text-2xl font-bold text-slate-900">{displayTitle}</h2>

            <div className="mt-5 space-y-2">
              <p className="text-base text-slate-700">
                <span className="font-bold text-slate-900">ยื่นคำขอเมื่อ : </span>
                <span>{submitTime}</span>
              </p>
              <p className="text-base text-slate-700">
                <span className="font-bold text-slate-900">สถานะ : </span>
                <span className="text-[#026e00] font-bold">{displayStatus}</span>
              </p>
            </div>
          </div>

          {/* Visual Separation */}
          <div className="w-full h-px bg-slate-200 my-10"></div>

          {/* Action Section */}
          <div className="flex justify-center">
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  router.push(redirectTo ?? "/dashboard/leave-history");
                  toast.success(toastMessage, {
                    className: styleAlert,
                   });
                }}
                className="h-12 w-40 rounded-lg border-2 border-slate-900 bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 shadow-none"
              >
                ปิด
              </Button>
            </AlertDialogAction>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
