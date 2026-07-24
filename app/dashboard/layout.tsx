import React from "react";
import { requireSessionUser } from "@/lib/auth";
import { SidebarLayoutWrapper } from "@/components/ui/sidebar-layout-wrapper";
import { MainHeader } from "@/components/MainHeader";
import { MainFooter } from "@/components/MainFooter";
import { SidebarMenu } from "@/components/sidebar-menu/SidebarMenu";
import DashboardContent from "@/components/DashboardContent";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();
  const userProps = { name: user.name, email: user.email, roles: user.roles, forceChangePassword: user.forceChangePassword };

  return (
    <SidebarLayoutWrapper user={userProps}>
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <MainHeader user={userProps} />
        <div className="flex flex-1">
          <SidebarMenu />
          <DashboardContent>
            {children}
          </DashboardContent>
        </div>
        <MainFooter />
      </div>
    </SidebarLayoutWrapper>
  );
}
