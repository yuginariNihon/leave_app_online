"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useUser } from "@/lib/user-context";

export default function DashboardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const { open } = useSidebar();
  const { roles } = useUser();
  const hasSidebar = roles.some((r) => ["HR", "SUPER_ADMIN", "APPROVER"].includes(r));

  const marginLeft = useMemo(() => {
    if (!hasSidebar) return "0px";
    return open ? "280px" : "80px";
  }, [open, hasSidebar]);

  return (
    <main
      className={cn(
        "flex-grow p-4 md:p-8 mx-auto py-10 w-full",
        hasSidebar && "transition-[margin] duration-200 ease-in-out",
        className,
      )}
      style={{ marginLeft }}
      {...props}
    >
      {children}
    </main>
  );
}
