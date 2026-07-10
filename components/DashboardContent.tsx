"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function DashboardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const { open } = useSidebar();

  return (
    <main
      className={cn(
        "flex-grow p-4 md:p-8 mx-auto py-10 transition-all duration-300 ease-in-out w-full",
        open
          ? "md:ml-[280px] md:w-[calc(100%-280px)]"
          : "md:ml-[80px] md:w-[calc(100%-80px)]",
        className,
      )}
      {...props}
    >
      {children}
    </main>
  );
}
