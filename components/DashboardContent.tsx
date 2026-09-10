"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useUser } from "@/lib/user-context";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "motion/react";

export default function DashboardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const { open } = useSidebar();
  const { roles } = useUser();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const hasSidebar = roles.some((r) => ["HR", "SUPER_ADMIN", "APPROVER"].includes(r));

  const marginLeft = useMemo(() => {
    if (!hasSidebar || isMobile) return "0px";
    return open ? "280px" : "80px";
  }, [open, hasSidebar, isMobile]);

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
