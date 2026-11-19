export function SectionSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70 ${className ?? ""}`}
    />
  );
}
