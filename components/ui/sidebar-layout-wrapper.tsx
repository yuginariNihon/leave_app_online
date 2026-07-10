"use client";

import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserProvider } from "@/lib/user-context";

type SidebarLayoutWrapperProps = {
  children: React.ReactNode;
  user: { name: string; email: string; roles: string[] };
};

export function SidebarLayoutWrapper({ children, user }: SidebarLayoutWrapperProps) {
  return (
    <UserProvider user={user}>
      <SidebarProvider className="contents">{children}</SidebarProvider>
    </UserProvider>
  );
}
