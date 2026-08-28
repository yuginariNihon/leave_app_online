"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useUser } from "@/lib/user-context";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

export default function DashboardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const { open } = useSidebar();
  const { roles } = useUser();
  const pathname = usePathname();
  const hasSidebar = roles.some((r) => ["HR", "SUPER_ADMIN", "APPROVER"].includes(r));

  const marginLeft = useMemo(() => {
    if (!hasSidebar) return "0px";
    return open ? "280px" : "80px";
  }, [open, hasSidebar]);

  return (
    <main
      id="dashboard-page-content"
      className={cn(
        "flex-grow p-4 md:p-8 mx-auto py-10 w-full",
        hasSidebar && "transition-[margin] duration-200 ease-in-out",
        className,
      )}
      style={{ marginLeft }}
      {...props}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
