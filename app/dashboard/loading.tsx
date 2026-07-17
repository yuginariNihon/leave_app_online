
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a1a40]" />
        <p className="text-sm text-slate-500 font-medium">กำลังโหลด...</p>
      </div>
    </div>
  );
}
