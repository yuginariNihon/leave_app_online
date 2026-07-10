import React from "react";
import { MainHeader } from "@/components/MainHeader";
import { MainFooter } from "@/components/MainFooter";
import { requireSessionUser } from "@/lib/auth";
import { SidebarLayoutWrapper } from "@/components/ui/sidebar-layout-wrapper";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();

  return (
    <SidebarLayoutWrapper user={{ name: user.name, email: user.email, roles: user.roles }}>
      <MainHeader user={{ name: user.name, email: user.email, roles: user.roles }} />
      {children}
      <MainFooter />
    </SidebarLayoutWrapper>
  );
}
