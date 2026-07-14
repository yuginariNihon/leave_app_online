"use client";
import React, { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logoutAction } from "@/app/login/actions";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { ClipboardList, FileText, Menu } from "lucide-react";
import { FaUserGroup } from "react-icons/fa6";
import { IoSettings } from "react-icons/io5";
import { useSidebar } from "@/components/ui/sidebar";

type MainHeaderUser = {
  name: string;
  email: string;
  roles: string[];
};

export function MainHeader({ user }: { user: MainHeaderUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, startSignOutTransition] = useTransition();
  const { setOpenMobile } = useSidebar();
  const initial = user.name.trim().charAt(0).toUpperCase() || "U";

  if (pathname?.startsWith("/login")) return null;

  return (
    <header className="bg-[#151939] border-b border-[#c7c5cf] sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2" data-purpose="brand-identity">
            <Button
              type="button"
              onClick={() => router.replace(
                user.roles.includes("HR") || user.roles.includes("SUPER_ADMIN")
                  ? "/dashboard/hr"
                  : "/dashboard"
              )}
              className="flex items-center gap-2 p-0 m-0 bg-transparent border-0 cursor-pointer"
              aria-label="Go to dashboard"
            >
              <Image
                src="/logo.png"
                alt="Logo"
                width={35}
                height={35}
                className="w-7 h-7 sm:w-[35px] sm:h-[35px] object-contain"
                priority
              />
              <div className="text-xl text-white font-bold hidden sm:inline">
                Leave Online System
              </div>
            </Button>
            
          </div>
          <button
            onClick={() => setOpenMobile(true)}
            className="md:hidden ml-auto mr-2 p-2 bg-transparent border-0 cursor-pointer text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative" data-purpose="notifications">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            ></path>
          </svg>
          <span className="absolute -top-1 -right-1 bg-[#f59e0b] text-white text-[8px] w-3.5 h-3.5 sm:text-[10px] sm:w-4 sm:h-4 rounded-full flex items-center justify-center">
            {3}
          </span>
        </div>

        {/**For Approver — only Approver or SUPER_ADMIN */}
        {(user.roles.includes("APPROVER") || user.roles.includes("SUPER_ADMIN")) && (
          <div>
            <Button
              variant="ghost"
              className="p-0 m-0 bg-transparent border-0 cursor-pointer hover:bg-transparent w-6 h-6"
              onClick={() => router.push("/dashboard/approval-requests")}
            >
              <ClipboardList className="text-white !h-5 !w-5"/>
            </Button>
          </div>
        )}

        {/**For SUPER_ADMIN */}
        {(user.roles.includes("SUPER_ADMIN")) && (
          <div>
            <Button
              variant="ghost"
              className="p-0 m-0 bg-transparent border-0 cursor-pointer hover:bg-transparent w-6 h-6"
              onClick={() => router.push("/dashboard/approval-requests/hr")}
              title="HR Approvals"
            >
              <IoSettings className="text-white !h-5 !w-5"/>
            </Button>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
              {initial}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={8} className="w-[320px] p-0 rounded-lg bg-white border border-gray-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1),0_2px_10px_-2px_rgba(0,0,0,0.05)]">
            <DropdownMenuLabel className="p-5 bg-[#f9f9ff] block w-full">
              <h2 className="text-[#4b5563] text-lg font-bold leading-tight tracking-tight">{user.name}</h2>
              <p className="text-[#6b7280] text-sm mt-1 truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="block w-full px-5 py-4 text-[#374151] hover:bg-[#f0f3ff] focus:bg-[#f0f3ff] focus:text-[#374151] transition-colors duration-200 text-[15px] font-medium rounded-none cursor-pointer border-t border-gray-100"
              onSelect={() => router.push("/dashboard/reset-password")}
            >
              เปลี่ยนรหัสผ่าน
            </DropdownMenuItem>
            <div className="h-px bg-gray-100" />
            <DropdownMenuItem
              className="block w-full px-5 py-4 text-[#ef4444] hover:bg-red-50 focus:bg-red-50 focus:text-[#ef4444] transition-colors duration-200 text-[15px] font-semibold rounded-none cursor-pointer"
              disabled={isSigningOut}
              onSelect={(event) => {
                event.preventDefault();
                startSignOutTransition(() => {
                  logoutAction();
                });
              }}
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
