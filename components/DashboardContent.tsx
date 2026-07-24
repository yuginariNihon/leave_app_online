"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export default function DashboardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const { open } = useSidebar();

  const marginLeft = useMemo(() => (open ? "280px" : "80px"), [open]);

  return (
    <main
      className={cn(
        "flex-grow p-4 md:p-8 mx-auto py-10 w-full transition-[margin] duration-200 ease-in-out",
        className,
      )}
      style={{ marginLeft }}
      {...props}
    >
      {children}
    </main>
  );
}
