"use client";

import { useState, useTransition, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useProgressRouter } from "@/components/ProgressBar";
import { useUser } from "@/lib/user-context";
import { logoutAction } from "@/app/login/actions";
import {
  GitBranch, LayoutDashboard, ShieldCheck, History, Users, UserPlus, Upload,
  BarChart3, Building2, Briefcase, Tags, Menu, ChevronDown, ChevronRight, Plus, UserCog,
  ClipboardList, X, CaseSensitive, Shield, CalendarDays, FileText, LogOut, Lock,
} from "lucide-react";
import {
  Sidebar as SidebarRoot,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu as SidebarMenuList,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { canAccessPage } from "@/lib/menu-config";

const itemBase =
  "relative isolate !overflow-visible rounded-xl px-3 py-2.5 h-auto text-[14px] gap-3 group transition-all duration-150";

function btnClass(isActive: boolean) {
  return cn(
    itemBase,
    isActive
      ? "!bg-[linear-gradient(90deg,#0F172A_0,#0F172A_3px,#f2f4f6_3px)] !text-[#0F172A] !font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
      : "!text-slate-600 !hover:bg-[#f2f4f6] !hover:text-[#0F172A]",
  );
}

function leafClass(isActive: boolean) {
  return cn(
    itemBase,
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50",
    isActive
      ? "!bg-transparent !text-white !font-semibold"
      : "!text-slate-600 !hover:bg-[#f2f4f6] !hover:text-[#0F172A]",
  );
}

function iconClass(isActive: boolean) {
  return cn(
    "size-5 shrink-0 transition-colors",
    isActive
      ? "!text-white"
      : "!text-slate-400 group-hover:!text-[#0F172A]",
  );
}

type NavAccent = "blue" | "amber" | "violet" | "emerald" | "indigo" | "rose";

const NAV_ACCENT_VARS: Record<NavAccent, { accent: string; tint: string }> = {
  blue: { accent: "#2563EB", tint: "#EFF6FF" },
  amber: { accent: "#D97706", tint: "#FFFBEB" },
  violet: { accent: "#7C3AED", tint: "#F5F3FF" },
  emerald: { accent: "#059669", tint: "#ECFDF5" },
  indigo: { accent: "#4F46E5", tint: "#EEF2FF" },
  rose: { accent: "#E11D48", tint: "#FFF1F2" },
};

function navIcon(isActive: boolean, accent: NavAccent): { className: string; style: CSSProperties } {
  const a = NAV_ACCENT_VARS[accent];
  return {
    className: cn(
      "!size-8 p-1.5 rounded-lg shrink-0 transition-all duration-150",
      isActive
        ? "!bg-[var(--nav-tint)] !text-[var(--nav-accent)]"
        : "!text-slate-400 group-hover:!bg-[var(--nav-tint)] group-hover:!text-[var(--nav-accent)] group-hover:scale-105",
    ),
    style: { "--nav-tint": a.tint, "--nav-accent": a.accent } as CSSProperties,
  };
}

type NavItemProps = {
  active: boolean;
  className?: string;
  tooltip?: string;
  onClick?: () => void;
  children: ReactNode;
};

function NavItem({ active, className, tooltip, onClick, children }: NavItemProps) {
  return (
    <SidebarMenuButton
      className={cn(leafClass(active), className)}
      tooltip={tooltip}
      onClick={onClick}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 -z-10 rounded-xl bg-[#0F172A] shadow-[0_6px_16px_rgba(15,23,42,0.18)]"
          transition={{ type: "spring", stiffness: 420, damping: 38 }}
        />
      )}
      {children}
    </SidebarMenuButton>
  );
}

export function SidebarMenu() {
  const router = useProgressRouter();
  const pathname = usePathname();
  const { name, email, roles, forceChangePassword } = useUser();
  const { open, toggleSidebar, openMobile, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const showLabels = isMobile || open;
  const [isSigningOut, startSignOutTransition] = useTransition();
  const [profileMenuExpanded, setProfileMenuExpanded] = useState(false);

  const [hrMenuExpanded, setHrMenuExpanded] = useState(true);
  const [systemMenuExpanded, setSystemMenuExpanded] = useState(true);
  const [staffListExpanded, setStaffListExpanded] = useState(false);
  const [deptListExpanded, setDeptListExpanded] = useState(false);
  const [posListExpanded, setPosListExpanded] = useState(false);
  const [leaveTypesExpanded, setLeaveTypesExpanded] = useState(false);
  const [empTypesExpanded, setEmpTypesExpanded] = useState(false);
  const [leaveCasesExpanded, setLeaveCasesExpanded] = useState(false);
  const [permRolesExpanded, setPermRolesExpanded] = useState(false);

  const isHR = roles.includes("HR") || roles.includes("SUPER_ADMIN");
  const isApprover = roles.includes("APPROVER");
  if (!isHR && !isApprover) return null;

  const handleNav = (path: string) => {
    if (isMobile) setOpenMobile(false);
    router.push(path);
  };

  const activePaths = {
    dashboard: pathname === "/dashboard/hr",
    hrApproval: pathname === "/dashboard/approval-requests/hr",
    hrHistory: pathname.startsWith("/dashboard/approval-requests/history"),
    staffList: pathname.startsWith("/dashboard/hr/staff-list") && !pathname.includes("/staff-list/add") && !pathname.includes("/staff-list/import"),
    staffListAdd: pathname.startsWith("/dashboard/hr/staff-list/add"),
    staffListImport: pathname.startsWith("/dashboard/hr/staff-list/import"),
    departments: pathname.startsWith("/dashboard/hr/departments") && !pathname.includes("/departments/add"),
    departmentsAdd: pathname.startsWith("/dashboard/hr/departments/add"),
    positions: pathname.startsWith("/dashboard/hr/positions") && !pathname.includes("/positions/add"),
    positionsAdd: pathname.startsWith("/dashboard/hr/positions/add"),
    leaveTypes: pathname.startsWith("/dashboard/hr/leave-types") && !pathname.includes("/leave-types/add"),
    leaveTypesAdd: pathname.startsWith("/dashboard/hr/leave-types/add"),
    leaveCases: pathname.startsWith("/dashboard/hr/leave-cases") && !pathname.includes("/leave-cases/add"),
    leaveCasesAdd: pathname.startsWith("/dashboard/hr/leave-cases/add"),
    employeeTypes: pathname.startsWith("/dashboard/hr/employee-types") && !pathname.includes("/employee-types/add"),
    employeeTypesAdd: pathname.startsWith("/dashboard/hr/employee-types/add"),
    adminRoles: pathname.startsWith("/dashboard/admin/roles") && !pathname.includes("/roles/manage"),
    adminRolesCrud: pathname.startsWith("/dashboard/admin/roles/manage"),
    adminPagePermissions: pathname.startsWith("/dashboard/admin/page-permissions"),
    staffRoles: pathname.startsWith("/dashboard/hr/staff-roles"),
    leaveQuota: pathname.startsWith("/dashboard/hr/leave-quota"),
    adminRights:
      pathname.startsWith("/dashboard/admin/roles") ||
      pathname.startsWith("/dashboard/hr/staff-roles") ||
      pathname.startsWith("/dashboard/admin/page-permissions"),
    sections: pathname.startsWith("/dashboard/hr/sections"),
    holidays: pathname.startsWith("/dashboard/hr/holidays"),
    userManagement: pathname.startsWith("/dashboard/hr/user-management"),
    leaveReport: pathname.startsWith("/dashboard/hr/leave-report"),
    leaveCalendar: pathname.startsWith("/dashboard/leave-calendar"),
    workflows: pathname.startsWith("/dashboard/hr/workflows"),
    supervisorApproval: pathname === "/dashboard/approval-requests",
    supervisorHistory: pathname.startsWith("/dashboard/approval-requests/history"),
    employeeDashboard: pathname === "/dashboard",
    leaveRequest: pathname.startsWith("/dashboard/leave-request"),
    leaveHistory: pathname.startsWith("/dashboard/leave-history"),
    leaveDetails: pathname.startsWith("/dashboard/leave-details"),
  };

  function renderHRSidebar() {
    return (
      <>
        <SidebarGroup className={cn("transition-all duration-200 ease-in-out", showLabels ? "" : "px-0")}>
          {showLabels ? (
            <div className="flex items-center justify-between px-3 mb-2 cursor-pointer select-none" onClick={() => setHrMenuExpanded(!hrMenuExpanded)}>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-[0.08em]">
                เมนู HR
              </SidebarGroupLabel>
              <ChevronDown className={cn("w-[18px] h-[18px] text-slate-300 transition-transform", hrMenuExpanded ? "" : "-rotate-90")} />
            </div>
          ) : (
            <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-[0.08em] sr-only">
              เมนู HR
            </SidebarGroupLabel>
          )}
          {hrMenuExpanded && (
          <SidebarGroupContent>
            <SidebarMenuList className="gap-1">
              <SidebarMenuItem>
                <NavItem
                  active={activePaths.dashboard}
                  className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                  onClick={() => handleNav("/dashboard/hr")}
                  tooltip={showLabels ? undefined : "Dashboard"}
                >
                  <LayoutDashboard {...navIcon(activePaths.dashboard, "blue")} />
                  {showLabels && <span>Dashboard</span>}
                </NavItem>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavItem
                  active={activePaths.hrApproval}
                  className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                  onClick={() => handleNav("/dashboard/approval-requests/hr")}
                  tooltip={showLabels ? undefined : "อนุมัติคำขอลา (HR)"}
                >
                  <ShieldCheck {...navIcon(activePaths.hrApproval, "amber")} />
                  {showLabels && <span>อนุมัติคำขอลา (HR)</span>}
                </NavItem>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavItem
                  active={activePaths.hrHistory}
                  className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                  onClick={() => handleNav("/dashboard/approval-requests/history?roleType=hr")}
                  tooltip={showLabels ? undefined : "ประวัติการอนุมัติ (HR)"}
                >
                  <History {...navIcon(activePaths.hrHistory, "amber")} />
                  {showLabels && <span>ประวัติการอนุมัติ (HR)</span>}
                </NavItem>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavItem
                  active={activePaths.leaveReport}
                  className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                  onClick={() => handleNav("/dashboard/hr/leave-report")}
                  tooltip={showLabels ? undefined : "รายงานการลา"}
                >
                  <BarChart3 {...navIcon(activePaths.leaveReport, "emerald")} />
                  {showLabels && <span>รายงานการลา</span>}
                </NavItem>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavItem
                  active={activePaths.leaveCalendar}
                  className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                  onClick={() => handleNav("/dashboard/leave-calendar")}
                  tooltip={showLabels ? undefined : "ปฏิทินการลา"}
                >
                  <CalendarDays {...navIcon(activePaths.leaveCalendar, "violet")} />
                  {showLabels && <span>ปฏิทินการลา</span>}
                </NavItem>
              </SidebarMenuItem>
            </SidebarMenuList>
          </SidebarGroupContent>
          )}
        </SidebarGroup>
        <SidebarGroup className={cn("transition-all duration-200 ease-in-out", showLabels ? "" : "px-0", showLabels ? "mt-1 border-t border-slate-200/70 pt-3" : "")}>
          <div className={cn("flex items-center justify-between mb-2 cursor-pointer select-none", showLabels ? "px-3" : "justify-center")} onClick={() => setSystemMenuExpanded(!systemMenuExpanded)}>
            {showLabels && (
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-[0.08em]">
                จัดการระบบ
              </SidebarGroupLabel>
            )}
            {showLabels && <ChevronDown className={cn("w-[18px] h-[18px] text-slate-300 transition-transform", systemMenuExpanded ? "" : "-rotate-90")} />}
          </div>
          {systemMenuExpanded && (
          <SidebarGroupContent>
            <SidebarMenuList className="gap-1">
              <SidebarMenuItem>
                <NavItem
                  active={activePaths.workflows}
                  className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                  onClick={() => handleNav("/dashboard/hr/workflows")}
                  tooltip={showLabels ? undefined : "จัดการลำดับการอนุมัติ"}
                >
                  <GitBranch {...navIcon(activePaths.workflows, "indigo")} />
                  {showLabels && <span>จัดการลำดับการอนุมัติ</span>}
                </NavItem>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.staffList || activePaths.staffListAdd || activePaths.staffListImport || activePaths.userManagement), showLabels ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/staff-list")}
                  tooltip={showLabels ? undefined : "รายชื่อพนักงาน"}
                >
                  <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                    <Users {...navIcon(activePaths.staffList || activePaths.staffListAdd || activePaths.staffListImport || activePaths.userManagement, "indigo")} />
                    {showLabels && <span>รายชื่อพนักงาน</span>}
                  </div>
                  {showLabels && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setStaffListExpanded(!staffListExpanded); }}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {staffListExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                    </span>
                  )}
                </SidebarMenuButton>
                {showLabels && staffListExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
                    <NavItem active={activePaths.staffListAdd} className="!py-2" onClick={() => handleNav("/dashboard/hr/staff-list/add")}>
                      <div className="flex items-center gap-3">
                        <UserPlus className={cn("size-[18px] shrink-0", iconClass(activePaths.staffListAdd))} />
                        <span>เพิ่มรายชื่อพนักงาน</span>
                      </div>
                    </NavItem>
                    <NavItem active={activePaths.staffListImport} className="!py-2" onClick={() => handleNav("/dashboard/hr/staff-list/import")}>
                      <div className="flex items-center gap-3">
                        <Upload className={cn("size-[18px] shrink-0", iconClass(activePaths.staffListImport))} />
                        <span>นำเข้ารายชื่อพนักงาน</span>
                      </div>
                    </NavItem>
                    {canAccessPage("manage_users", roles) && (
                      <NavItem active={activePaths.userManagement} className="!py-2" onClick={() => handleNav("/dashboard/hr/user-management")}>
                        <div className="flex items-center gap-3">
                          <UserCog className={cn("size-[18px] shrink-0", iconClass(activePaths.userManagement))} />
                          <span>จัดการผู้ใช้</span>
                        </div>
                      </NavItem>
                    )}
                  </div>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.departments || activePaths.departmentsAdd || activePaths.sections), showLabels ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/departments")}
                  tooltip={showLabels ? undefined : "จัดการแผนก"}
                >
                  <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                    <Building2 {...navIcon(activePaths.departments || activePaths.departmentsAdd || activePaths.sections, "indigo")} />
                    {showLabels && <span>จัดการแผนก</span>}
                  </div>
                  {showLabels && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setDeptListExpanded(!deptListExpanded); }}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {deptListExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                    </span>
                  )}
                </SidebarMenuButton>
                {showLabels && deptListExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
                    <NavItem active={activePaths.departmentsAdd} className="!py-2" onClick={() => handleNav("/dashboard/hr/departments/add")}>
                      <div className="flex items-center gap-3">
                        <Plus className={cn("size-[18px] shrink-0", iconClass(activePaths.departmentsAdd))} />
                        <span>เพิ่มแผนก</span>
                      </div>
                    </NavItem>
                    <NavItem active={activePaths.sections} className="!py-2" onClick={() => handleNav("/dashboard/hr/sections")}>
                      <div className="flex items-center gap-3">
                        <Building2 className={cn("size-[18px] shrink-0", iconClass(activePaths.sections))} />
                        <span>จัดการแผนกย่อย</span>
                      </div>
                    </NavItem>
                  </div>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.positions || activePaths.positionsAdd), showLabels ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/positions")}
                  tooltip={showLabels ? undefined : "จัดการตำแหน่ง"}
                >
                  <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                    <Briefcase {...navIcon(activePaths.positions || activePaths.positionsAdd, "indigo")} />
                    {showLabels && <span>จัดการตำแหน่ง</span>}
                  </div>
                  {showLabels && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setPosListExpanded(!posListExpanded); }}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {posListExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                    </span>
                  )}
                </SidebarMenuButton>
                {showLabels && posListExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
                    <NavItem active={activePaths.positionsAdd} className="!py-2" onClick={() => handleNav("/dashboard/hr/positions/add")}>
                      <div className="flex items-center gap-3">
                        <Plus className={cn("size-[18px] shrink-0", iconClass(activePaths.positionsAdd))} />
                        <span>เพิ่มตำแหน่ง</span>
                      </div>
                    </NavItem>
                  </div>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.leaveTypes || activePaths.leaveTypesAdd), showLabels ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/leave-types")}
                  tooltip={showLabels ? undefined : "จัดการประเภทการลา"}
                >
                  <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                    <Tags {...navIcon(activePaths.leaveTypes || activePaths.leaveTypesAdd, "indigo")} />
                    {showLabels && <span>จัดการประเภทการลา</span>}
                  </div>
                  {showLabels && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setLeaveTypesExpanded(!leaveTypesExpanded); }}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {leaveTypesExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                    </span>
                  )}
                </SidebarMenuButton>
                {showLabels && leaveTypesExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
                    <NavItem active={activePaths.leaveTypesAdd} className="!py-2" onClick={() => handleNav("/dashboard/hr/leave-types/add")}>
                      <div className="flex items-center gap-3">
                        <Plus className={cn("size-[18px] shrink-0", iconClass(activePaths.leaveTypesAdd))} />
                        <span>เพิ่มประเภทการลา</span>
                      </div>
                    </NavItem>
                  </div>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.leaveCases || activePaths.leaveCasesAdd), showLabels ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/leave-cases")}
                  tooltip={showLabels ? undefined : "จัดการกรณีการลา"}
                >
                  <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                    <CaseSensitive {...navIcon(activePaths.leaveCases || activePaths.leaveCasesAdd, "indigo")} />
                    {showLabels && <span>จัดการกรณีการลา</span>}
                  </div>
                  {showLabels && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setLeaveCasesExpanded(!leaveCasesExpanded); }}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {leaveCasesExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                    </span>
                  )}
                </SidebarMenuButton>
                {showLabels && leaveCasesExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
                    <NavItem active={activePaths.leaveCasesAdd} className="!py-2" onClick={() => handleNav("/dashboard/hr/leave-cases/add")}>
                      <div className="flex items-center gap-3">
                        <Plus className={cn("size-[18px] shrink-0", iconClass(activePaths.leaveCasesAdd))} />
                        <span>เพิ่มกรณีการลา</span>
                      </div>
                    </NavItem>
                  </div>
                )}
              </SidebarMenuItem>
              {canAccessPage("manage_leave_quota", roles) && (
                <SidebarMenuItem>
                  <NavItem
                    active={activePaths.leaveQuota}
                    className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                    onClick={() => handleNav("/dashboard/hr/leave-quota")}
                    tooltip={showLabels ? undefined : "จัดการสิทธิ์วันลา"}
                  >
                    <FileText {...navIcon(activePaths.leaveQuota, "emerald")} />
                    {showLabels && <span>จัดการสิทธิ์วันลา</span>}
                  </NavItem>
                </SidebarMenuItem>
              )}
              {(canAccessPage("manage_roles", roles) ||
                canAccessPage("manage_roles_crud", roles) ||
                canAccessPage("manage_staff_roles", roles) ||
                canAccessPage("manage_page_permissions", roles)) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className={cn(btnClass(activePaths.adminRights), showLabels ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                      onClick={() => handleNav("/dashboard/admin/roles")}
                      tooltip={showLabels ? undefined : "สิทธิ์และบทบาท"}
                    >
                      <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                        <Shield {...navIcon(activePaths.adminRights, "rose")} />
                        {showLabels && <span>สิทธิ์และบทบาท</span>}
                      </div>
                      {showLabels && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setPermRolesExpanded(!permRolesExpanded); }}
                          className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          {permRolesExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                        </span>
                      )}
                    </SidebarMenuButton>
                    {showLabels && permRolesExpanded && (
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
                        {canAccessPage("manage_roles", roles) && (
                          <NavItem active={activePaths.adminRoles} className="!py-2" onClick={() => handleNav("/dashboard/admin/roles")}>
                            <div className="flex items-center gap-3">
                              <Shield className={cn("size-[18px] shrink-0", iconClass(activePaths.adminRoles))} />
                              <span>จัดการบทบาทพนักงาน</span>
                            </div>
                          </NavItem>
                        )}
                        {canAccessPage("manage_roles_crud", roles) && (
                          <NavItem active={activePaths.adminRolesCrud} className="!py-2" onClick={() => handleNav("/dashboard/admin/roles/manage")}>
                            <div className="flex items-center gap-3">
                              <UserCog className={cn("size-[18px] shrink-0", iconClass(activePaths.adminRolesCrud))} />
                              <span>จัดการบทบาท</span>
                            </div>
                          </NavItem>
                        )}
                        {canAccessPage("manage_staff_roles", roles) && (
                          <NavItem active={activePaths.staffRoles} className="!py-2" onClick={() => handleNav("/dashboard/hr/staff-roles")}>
                            <div className="flex items-center gap-3">
                              <UserCog className={cn("size-[18px] shrink-0", iconClass(activePaths.staffRoles))} />
                              <span>จัดการสิทธิ์ของพนักงาน</span>
                            </div>
                          </NavItem>
                        )}
                        {canAccessPage("manage_page_permissions", roles) && (
                          <NavItem active={activePaths.adminPagePermissions} className="!py-2" onClick={() => handleNav("/dashboard/admin/page-permissions")}>
                            <div className="flex items-center gap-3">
                              <Shield className={cn("size-[18px] shrink-0", iconClass(activePaths.adminPagePermissions))} />
                              <span>จัดการสิทธิ์การเข้าถึงหน้า</span>
                            </div>
                          </NavItem>
                        )}
                      </div>
                    )}
                  </SidebarMenuItem>
                )}
              <SidebarMenuItem>
                <NavItem
                  active={activePaths.holidays}
                  className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                  onClick={() => handleNav("/dashboard/hr/holidays")}
                  tooltip={showLabels ? undefined : "จัดการวันหยุด"}
                >
                  <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                    <CalendarDays {...navIcon(activePaths.holidays, "violet")} />
                    {showLabels && <span>จัดการวันหยุด</span>}
                  </div>
                </NavItem>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.employeeTypes || activePaths.employeeTypesAdd), showLabels ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/employee-types")}
                  tooltip={showLabels ? undefined : "จัดการประเภทพนักงาน"}
                >
                  <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                    <UserCog {...navIcon(activePaths.employeeTypes || activePaths.employeeTypesAdd, "indigo")} />
                    {showLabels && <span>จัดการประเภทพนักงาน</span>} 
                  </div>
                  {showLabels && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setEmpTypesExpanded(!empTypesExpanded); }}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {empTypesExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                    </span>
                  )}
                </SidebarMenuButton>
                {showLabels && empTypesExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
                    <NavItem active={activePaths.employeeTypesAdd} className="!py-2" onClick={() => handleNav("/dashboard/hr/employee-types/add")}>
                      <div className="flex items-center gap-3">
                        <Plus className={cn("size-[18px] shrink-0", iconClass(activePaths.employeeTypesAdd))} />
                        <span>เพิ่มประเภทพนักงาน</span>
                      </div>
                    </NavItem>
                  </div>
                )}
              </SidebarMenuItem>
            </SidebarMenuList>
          </SidebarGroupContent>
          )}
        </SidebarGroup>
      </>
    );
  }

  function renderSupervisorSidebar() {
    return (
      <>
        <SidebarGroup className={cn("transition-all duration-200 ease-in-out", showLabels ? "" : "px-0")}>
          {showLabels && (
            <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-[0.08em]">
              การอนุมัติสำหรับหัวหน้างาน
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenuList className="gap-1">
              <SidebarMenuItem>
                <NavItem
                  active={activePaths.supervisorApproval}
                  className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                  onClick={() => handleNav("/dashboard/approval-requests")}
                  tooltip={showLabels ? undefined : "รายการคำขอลา"}
                >
                  <ClipboardList {...navIcon(activePaths.supervisorApproval, "amber")} />
                  {showLabels && <span>รายการคำขอลา</span>}
                </NavItem>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavItem
                  active={activePaths.supervisorHistory}
                  className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                  onClick={() => handleNav("/dashboard/approval-requests/history")}
                  tooltip={showLabels ? undefined : "ประวัติการอนุมัติ"}
                >
                  <History {...navIcon(activePaths.supervisorHistory, "amber")} />
                  {showLabels && <span>ประวัติการอนุมัติ</span>}
                </NavItem>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavItem
                  active={activePaths.leaveCalendar}
                  className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                  onClick={() => handleNav("/dashboard/leave-calendar")}
                  tooltip={showLabels ? undefined : "ปฏิทินการลา"}
                >
                  <CalendarDays {...navIcon(activePaths.leaveCalendar, "violet")} />
                  {showLabels && <span>ปฏิทินการลา</span>}
                </NavItem>
              </SidebarMenuItem>
            </SidebarMenuList>
          </SidebarGroupContent>
        </SidebarGroup>
      </>
    );
  }

  function renderEmployeeSidebar() {
    return (
      <SidebarGroup>
        {showLabels && (
          <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-[0.08em]">
            เมนูพนักงาน
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenuList className="gap-1">
            <SidebarMenuItem>
              <NavItem
                active={activePaths.employeeDashboard}
                className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                onClick={() => handleNav("/dashboard")}
                tooltip={showLabels ? undefined : "หน้าหลัก"}
              >
                <LayoutDashboard {...navIcon(activePaths.employeeDashboard, "blue")} />
                {showLabels && <span>หน้าหลัก</span>}
              </NavItem>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavItem
                active={activePaths.leaveRequest}
                className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                onClick={() => handleNav("/dashboard/leave-request")}
                tooltip={showLabels ? undefined : "คำขอลา"}
              >
                <FileText {...navIcon(activePaths.leaveRequest, "blue")} />
                {showLabels && <span>คำขอลา</span>}
              </NavItem>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavItem
                active={activePaths.leaveHistory}
                className={showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto"}
                onClick={() => handleNav("/dashboard/leave-history")}
                tooltip={showLabels ? undefined : "ประวัติการลา"}
              >
                <History {...navIcon(activePaths.leaveHistory, "amber")} />
                {showLabels && <span>ประวัติการลา</span>}
              </NavItem>
            </SidebarMenuItem>
          </SidebarMenuList>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <SidebarHeader className={cn("px-6 py-6 border-b border-[#d8dadc]/50 transition-all duration-200 ease-in-out", showLabels ? "" : "px-3")}>
        <div className="w-full flex items-center gap-3">
          <button
            onClick={isMobile ? () => setOpenMobile(false) : toggleSidebar}
            className="bg-[#0F172A] text-white p-2 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer border-0 shadow-sm shrink-0"
            title={isMobile ? "Close Menu" : open ? "Collapse Menu" : "Expand Menu"}
          >
            {isMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {showLabels && (
            <Image
              src="/logo2_rv2.png"
              alt="Leave Online System"
              width={40}
              height={40}
              className="h-8 w-8 shrink-0 object-contain"
            />
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className={cn("py-4 overflow-y-auto transition-all duration-200 ease-in-out ![&::-webkit-scrollbar]:block ![&::-webkit-scrollbar]:w-1.5 ![&::-webkit-scrollbar-thumb]:bg-slate-300 ![&::-webkit-scrollbar-thumb]:rounded-full", !isMobile && open ? "px-3" : "px-2")}>
        {forceChangePassword ? (
          <div className="px-4 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#374151]">กรุณาเปลี่ยนรหัสผ่าน</p>
            <p className="text-xs text-[#6b7280] mt-1">ก่อนเข้าใช้งานระบบ</p>
          </div>
        ) : isHR ? renderHRSidebar() : isApprover ? renderSupervisorSidebar() : renderEmployeeSidebar()}
      </SidebarContent>
    </>
  );

  if (isMobile) {
    return (
      <>
        {openMobile && (
          <div className="fixed inset-0 z-[105] bg-black/40" onClick={() => setOpenMobile(false)} />
        )}
        <div
          className={cn(
            "fixed top-16 left-0 bottom-0 z-[110] w-[280px] bg-white border-r border-[#d8dadc] shadow-sm flex flex-col transition-transform duration-200 ease-in-out",
            openMobile ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent}
          <div className="mt-auto border-t border-[#d8dadc] p-4">
            <button
              type="button"
              onClick={() => setProfileMenuExpanded(!profileMenuExpanded)}
              className="flex w-full items-center gap-3 text-left cursor-pointer border-0 bg-transparent p-0"
              aria-expanded={profileMenuExpanded}
            >
              <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shrink-0">
                {name.trim().charAt(0).toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#0F172A] truncate">{name}</p>
                <p className="text-xs text-[#6b7280] truncate">{email}</p>
              </div>
              <ChevronDown className={cn("w-[18px] h-[18px] text-slate-400 transition-transform shrink-0", profileMenuExpanded ? "rotate-180" : "")} />
            </button>
            <div
              className={cn(
                "mt-3 flex flex-col gap-1 overflow-hidden transition-all duration-300 ease-in-out",
                profileMenuExpanded ? "max-h-24 opacity-100" : "max-h-0 opacity-0 pointer-events-none",
              )}
              aria-hidden={!profileMenuExpanded}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenMobile(false);
                  router.push("/dashboard/reset-password");
                }}
                className="flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#f2f4f6] transition-colors cursor-pointer border-0"
              >
                <Lock className="w-[18px] h-[18px] text-slate-400" />
                เปลี่ยนรหัสผ่าน
              </button>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={() => startSignOutTransition(() => { logoutAction(); })}
                className="flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-sm font-semibold text-[#ef4444] hover:bg-red-50 transition-colors cursor-pointer border-0 disabled:opacity-60"
              >
                <LogOut className="w-[18px] h-[18px] text-[#ef4444]" />
                {isSigningOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <SidebarRoot
      collapsible="icon"
      className="bg-white border-r border-[#d8dadc] shadow-sm"
    >
      {sidebarContent}
    </SidebarRoot>
  );
}
