"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

export default function DashboardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <main
      id="dashboard-page-content"
      className={cn(
        "flex-1 w-full min-w-0 p-4 md:p-8 py-10",
        className,
      )}
      {...props}
    >
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </main>
  );
}



