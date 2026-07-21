import type { ReactNode } from "react";

export function WarningBanner({ message, className = "" }: { message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p className={`text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 ${className}`}>
      {message}
    </p>
  );
}

export function WarningBannerGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
