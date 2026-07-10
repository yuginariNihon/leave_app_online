import { LeaveStatus } from "@/lib/generated/prisma/enums";

interface StatusBadgeProps {
  status: LeaveStatus;
  text: string;
}

const config: Record<string, { dot: string; className: string }> = {
  [LeaveStatus.pending]: {
    dot: "bg-blue-500",
    className: "bg-blue-50 text-blue-700 border-blue-100",
  },
  [LeaveStatus.approved]: {
    dot: "bg-emerald-500",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  [LeaveStatus.rejected]: {
    dot: "bg-red-500",
    className: "bg-red-50 text-red-700 border-red-100",
  },
  [LeaveStatus.cancelled]: {
    dot: "bg-gray-400",
    className: "bg-gray-100 text-black border-gray-300",
  },
};

export function StatusBadge({ status, text }: StatusBadgeProps) {
  const c = config[status] ?? { dot: "bg-gray-400", className: "bg-gray-100 text-gray-600 border-gray-300" };
  return (
    <span className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${c.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
      {text}
    </span>
  );
}
