import React from "react";
import { requireSessionUser } from "@/lib/auth";
import { SidebarLayoutWrapper } from "@/components/ui/sidebar-layout-wrapper";
import { MainHeader } from "@/components/MainHeader";
import { MainFooter } from "@/components/MainFooter";
import { SidebarMenu } from "@/components/sidebar-menu/SidebarMenu";
import DashboardContent from "@/components/DashboardContent";
import { ProgressProvider } from "@/components/ProgressBar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();
  const userProps = { name: user.name, email: user.email, roles: user.roles, forceChangePassword: user.forceChangePassword };

  return (
    <SidebarLayoutWrapper user={userProps}>
      <ProgressProvider>
        <SidebarMenu />
        <div className="flex min-w-0 flex-1 flex-col">
          <MainHeader user={userProps} />
          <DashboardContent>
            {children}
          </DashboardContent>
          <MainFooter />
        </div>
      </ProgressProvider>
    </SidebarLayoutWrapper>
  );
}
