"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/user-context";
import {
  GitBranch, LayoutDashboard, ShieldCheck, History, Users, UserPlus, Upload,
  BarChart3, Building2, Briefcase, Tags, Menu, ChevronDown, ChevronRight, Plus, UserCog,
  ClipboardList, X, CaseSensitive, Shield, CalendarDays, FileText,
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
  "rounded-[8px] px-3 py-2.5 h-auto text-[14px] gap-3 group transition-colors";

function btnClass(isActive: boolean) {
  return cn(
    itemBase,
    isActive
      ? "!bg-[#f2f4f6] !text-[#0F172A] !font-semibold"
      : "!text-slate-600 !hover:bg-[#f2f4f6] !hover:text-[#0F172A]",
  );
}

function iconClass(isActive: boolean) {
  return cn(
    "size-5 shrink-0 transition-colors",
    isActive
      ? "!text-[#0F172A]"
      : "!text-slate-400 group-hover:!text-[#0F172A]",
  );
}

export function SidebarMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { roles, forceChangePassword } = useUser();
  const { open, toggleSidebar, openMobile, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  const isHR = roles.includes("HR") || roles.includes("SUPER_ADMIN");
  const isApprover = roles.includes("APPROVER");
  const [hrMenuExpanded, setHrMenuExpanded] = useState(true);
  const [systemMenuExpanded, setSystemMenuExpanded] = useState(true);
  const [staffListExpanded, setStaffListExpanded] = useState(false);
  const [deptListExpanded, setDeptListExpanded] = useState(false);
  const [posListExpanded, setPosListExpanded] = useState(false);
  const [leaveTypesExpanded, setLeaveTypesExpanded] = useState(false);
  const [empTypesExpanded, setEmpTypesExpanded] = useState(false);
  const [leaveCasesExpanded, setLeaveCasesExpanded] = useState(false);

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
    adminRoles: pathname.startsWith("/dashboard/admin/roles"),
    adminPagePermissions: pathname.startsWith("/dashboard/admin/page-permissions"),
    staffRoles: pathname.startsWith("/dashboard/hr/staff-roles"),
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
        <SidebarGroup className={cn("transition-all duration-200 ease-in-out", open ? "" : "px-0")}>
          {open ? (
            <div className="flex items-center justify-between px-3 mb-2 cursor-pointer select-none" onClick={() => setHrMenuExpanded(!hrMenuExpanded)}>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                เมนู HR
              </SidebarGroupLabel>
              <ChevronDown className={cn("w-[18px] h-[18px] text-slate-300 transition-transform", hrMenuExpanded ? "" : "-rotate-90")} />
            </div>
          ) : (
            <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider sr-only">
              เมนู HR
            </SidebarGroupLabel>
          )}
          {hrMenuExpanded && (
          <SidebarGroupContent>
            <SidebarMenuList className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.dashboard), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr")}
                  tooltip={open ? undefined : "Dashboard"}
                >
                  <LayoutDashboard className={iconClass(activePaths.dashboard)} />
                  {open && <span>Dashboard</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.hrApproval), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/approval-requests/hr")}
                  tooltip={open ? undefined : "อนุมัติคำขอลา (HR)"}
                >
                  <ShieldCheck className={iconClass(activePaths.hrApproval)} />
                  {open && <span>อนุมัติคำขอลา (HR)</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.hrHistory), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/approval-requests/history?roleType=hr")}
                  tooltip={open ? undefined : "ประวัติการอนุมัติ (HR)"}
                >
                  <History className={iconClass(activePaths.hrHistory)} />
                  {open && <span>ประวัติการอนุมัติ (HR)</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.leaveReport), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/leave-report")}
                  tooltip={open ? undefined : "รายงานการลา"}
                >
                  <BarChart3 className={iconClass(activePaths.leaveReport)} />
                  {open && <span>รายงานการลา</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.leaveCalendar), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/leave-calendar")}
                  tooltip={open ? undefined : "ปฏิทินการลา"}
                >
                  <CalendarDays className={iconClass(activePaths.leaveCalendar)} />
                  {open && <span>ปฏิทินการลา</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenuList>
          </SidebarGroupContent>
          )}
        </SidebarGroup>
        <SidebarGroup className={cn("transition-all duration-200 ease-in-out", open ? "" : "px-0")}>
          <div className={cn("flex items-center justify-between mb-2 cursor-pointer select-none", open ? "px-3" : "justify-center")} onClick={() => setSystemMenuExpanded(!systemMenuExpanded)}>
            {open && (
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                จัดการระบบ
              </SidebarGroupLabel>
            )}
            {open && <ChevronDown className={cn("w-[18px] h-[18px] text-slate-300 transition-transform", systemMenuExpanded ? "" : "-rotate-90")} />}
          </div>
          {systemMenuExpanded && (
          <SidebarGroupContent>
            <SidebarMenuList className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.workflows), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/workflows")}
                  tooltip={open ? undefined : "จัดการลำดับการอนุมัติ"}
                >
                  <GitBranch className={iconClass(activePaths.workflows)} />
                  {open && <span>จัดการลำดับการอนุมัติ</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.staffList || activePaths.staffListAdd || activePaths.staffListImport), open ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/staff-list")}
                  tooltip={open ? undefined : "รายชื่อพนักงาน"}
                >
                  <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
                    <Users className={iconClass(activePaths.staffList || activePaths.staffListAdd || activePaths.staffListImport)} />
                    {open && <span>รายชื่อพนักงาน</span>}
                  </div>
                  {open && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setStaffListExpanded(!staffListExpanded); }}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {staffListExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                    </span>
                  )}
                </SidebarMenuButton>
                {open && staffListExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5">
                    <SidebarMenuButton className={cn(btnClass(activePaths.staffListAdd), "!py-2")} onClick={() => handleNav("/dashboard/hr/staff-list/add")}>
                      <div className="flex items-center gap-3">
                        <UserPlus className={cn("size-[18px] shrink-0", iconClass(activePaths.staffListAdd))} />
                        <span>เพิ่มรายชื่อพนักงาน</span>
                      </div>
                    </SidebarMenuButton>
                    <SidebarMenuButton className={cn(btnClass(activePaths.staffListImport), "!py-2")} onClick={() => handleNav("/dashboard/hr/staff-list/import")}>
                      <div className="flex items-center gap-3">
                        <Upload className={cn("size-[18px] shrink-0", iconClass(activePaths.staffListImport))} />
                        <span>นำเข้ารายชื่อพนักงาน</span>
                      </div>
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.departments || activePaths.departmentsAdd), open ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/departments")}
                  tooltip={open ? undefined : "จัดการแผนก"}
                >
                  <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
                    <Building2 className={iconClass(activePaths.departments || activePaths.departmentsAdd)} />
                    {open && <span>จัดการแผนก</span>}
                  </div>
                  {open && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setDeptListExpanded(!deptListExpanded); }}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {deptListExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                    </span>
                  )}
                </SidebarMenuButton>
                {open && deptListExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5">
                    <SidebarMenuButton className={cn(btnClass(activePaths.departmentsAdd), "!py-2")} onClick={() => handleNav("/dashboard/hr/departments/add")}>
                      <div className="flex items-center gap-3">
                        <Plus className={cn("size-[18px] shrink-0", iconClass(activePaths.departmentsAdd))} />
                        <span>เพิ่มแผนก</span>
                      </div>
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.positions || activePaths.positionsAdd), open ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/positions")}
                  tooltip={open ? undefined : "จัดการตำแหน่ง"}
                >
                  <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
                    <Briefcase className={iconClass(activePaths.positions || activePaths.positionsAdd)} />
                    {open && <span>จัดการตำแหน่ง</span>}
                  </div>
                  {open && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setPosListExpanded(!posListExpanded); }}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {posListExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                    </span>
                  )}
                </SidebarMenuButton>
                {open && posListExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5">
                    <SidebarMenuButton className={cn(btnClass(activePaths.positionsAdd), "!py-2")} onClick={() => handleNav("/dashboard/hr/positions/add")}>
                      <div className="flex items-center gap-3">
                        <Plus className={cn("size-[18px] shrink-0", iconClass(activePaths.positionsAdd))} />
                        <span>เพิ่มตำแหน่ง</span>
                      </div>
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.leaveTypes || activePaths.leaveTypesAdd), open ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/leave-types")}
                  tooltip={open ? undefined : "จัดการประเภทการลา"}
                >
                  <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
                    <Tags className={iconClass(activePaths.leaveTypes || activePaths.leaveTypesAdd)} />
                    {open && <span>จัดการประเภทการลา</span>}
                  </div>
                  {open && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setLeaveTypesExpanded(!leaveTypesExpanded); }}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {leaveTypesExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                    </span>
                  )}
                </SidebarMenuButton>
                {open && leaveTypesExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5">
                    <SidebarMenuButton className={cn(btnClass(activePaths.leaveTypesAdd), "!py-2")} onClick={() => handleNav("/dashboard/hr/leave-types/add")}>
                      <div className="flex items-center gap-3">
                        <Plus className={cn("size-[18px] shrink-0", iconClass(activePaths.leaveTypesAdd))} />
                        <span>เพิ่มประเภทการลา</span>
                      </div>
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.leaveCases || activePaths.leaveCasesAdd), open ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/leave-cases")}
                  tooltip={open ? undefined : "จัดการกรณีการลา"}
                >
                  <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
                    <CaseSensitive className={iconClass(activePaths.leaveCases || activePaths.leaveCasesAdd)} />
                    {open && <span>จัดการกรณีการลา</span>}
                  </div>
                  {open && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setLeaveCasesExpanded(!leaveCasesExpanded); }}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {leaveCasesExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                    </span>
                  )}
                </SidebarMenuButton>
                {open && leaveCasesExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5">
                    <SidebarMenuButton className={cn(btnClass(activePaths.leaveCasesAdd), "!py-2")} onClick={() => handleNav("/dashboard/hr/leave-cases/add")}>
                      <div className="flex items-center gap-3">
                        <Plus className={cn("size-[18px] shrink-0", iconClass(activePaths.leaveCasesAdd))} />
                        <span>เพิ่มกรณีการลา</span>
                      </div>
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>
              {canAccessPage("manage_roles", roles) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={cn(btnClass(activePaths.adminRoles), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                    onClick={() => handleNav("/dashboard/admin/roles")}
                    tooltip={open ? undefined : "จัดการบทบาทพนักงาน"}
                  >
                    <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
                      <Shield className={iconClass(activePaths.adminRoles)} />
                      {open && <span>จัดการบทบาทพนักงาน</span>}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canAccessPage("manage_page_permissions", roles) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={cn(btnClass(activePaths.adminPagePermissions), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                    onClick={() => handleNav("/dashboard/admin/page-permissions")}
                    tooltip={open ? undefined : "จัดการสิทธิ์การเข้าถึงหน้า"}
                  >
                    <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
                      <Shield className={iconClass(activePaths.adminPagePermissions)} />
                      {open && <span>จัดการสิทธิ์การเข้าถึงหน้า</span>}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canAccessPage("manage_staff_roles", roles) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={cn(btnClass(activePaths.staffRoles), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                    onClick={() => handleNav("/dashboard/hr/staff-roles")}
                    tooltip={open ? undefined : "จัดการสิทธิ์ของพนักงาน"}
                  >
                    <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
                      <UserCog className={iconClass(activePaths.staffRoles)} />
                      {open && <span>จัดการสิทธิ์ของพนักงาน</span>}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canAccessPage("manage_sections", roles) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={cn(btnClass(activePaths.sections), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                    onClick={() => handleNav("/dashboard/hr/sections")}
                    tooltip={open ? undefined : "จัดการแผนกย่อย"}
                  >
                    <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
                      <Building2 className={iconClass(activePaths.sections)} />
                      {open && <span>จัดการแผนกย่อย</span>}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.userManagement), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/user-management")}
                  tooltip={open ? undefined : "จัดการผู้ใช้"}
                >
                  <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
                    <UserCog className={iconClass(activePaths.userManagement)} />
                    {open && <span>จัดการผู้ใช้</span>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.holidays), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/holidays")}
                  tooltip={open ? undefined : "จัดการวันหยุด"}
                >
                  <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
                    <CalendarDays className={iconClass(activePaths.holidays)} />
                    {open && <span>จัดการวันหยุด</span>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.employeeTypes || activePaths.employeeTypesAdd), open ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/employee-types")}
                  tooltip={open ? undefined : "จัดการประเภทพนักงาน"}
                >
                  <div className={cn("flex items-center", open ? "gap-3" : "justify-center")}>
                    <UserCog className={iconClass(activePaths.employeeTypes || activePaths.employeeTypesAdd)} />
                    {open && <span>จัดการประเภทพนักงาน</span>} 
                  </div>
                  {open && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setEmpTypesExpanded(!empTypesExpanded); }}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {empTypesExpanded ? <ChevronDown className="w-[18px] h-[18px] text-slate-300" /> : <ChevronRight className="w-[18px] h-[18px] text-slate-300" />}
                    </span>
                  )}
                </SidebarMenuButton>
                {open && empTypesExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5">
                    <SidebarMenuButton className={cn(btnClass(activePaths.employeeTypesAdd), "!py-2")} onClick={() => handleNav("/dashboard/hr/employee-types/add")}>
                      <div className="flex items-center gap-3">
                        <Plus className={cn("size-[18px] shrink-0", iconClass(activePaths.employeeTypesAdd))} />
                        <span>เพิ่มประเภทพนักงาน</span>
                      </div>
                    </SidebarMenuButton>
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
        <SidebarGroup className={cn("transition-all duration-200 ease-in-out", open ? "" : "px-0")}>
          {open && (
            <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              การอนุมัติ
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenuList className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.supervisorApproval), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/approval-requests")}
                  tooltip={open ? undefined : "รายการคำขอลา"}
                >
                  <ClipboardList className={iconClass(activePaths.supervisorApproval)} />
                  {open && <span>รายการคำขอลา</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.supervisorHistory), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/approval-requests/history")}
                  tooltip={open ? undefined : "ประวัติการอนุมัติ"}
                >
                  <History className={iconClass(activePaths.supervisorHistory)} />
                  {open && <span>ประวัติการอนุมัติ</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.leaveCalendar), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/leave-calendar")}
                  tooltip={open ? undefined : "ปฏิทินการลา"}
                >
                  <CalendarDays className={iconClass(activePaths.leaveCalendar)} />
                  {open && <span>ปฏิทินการลา</span>}
                </SidebarMenuButton>
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
        {open && (
          <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            เมนูพนักงาน
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenuList className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                className={cn(btnClass(activePaths.employeeDashboard), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                onClick={() => handleNav("/dashboard")}
                tooltip={open ? undefined : "หน้าหลัก"}
              >
                <LayoutDashboard className={iconClass(activePaths.employeeDashboard)} />
                {open && <span>หน้าหลัก</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                className={cn(btnClass(activePaths.leaveRequest), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                onClick={() => handleNav("/dashboard/leave-request")}
                tooltip={open ? undefined : "คำขอลา"}
              >
                <FileText className={iconClass(activePaths.leaveRequest)} />
                {open && <span>คำขอลา</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                className={cn(btnClass(activePaths.leaveHistory), open ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                onClick={() => handleNav("/dashboard/leave-history")}
                tooltip={open ? undefined : "ประวัติการลา"}
              >
                <History className={iconClass(activePaths.leaveHistory)} />
                {open && <span>ประวัติการลา</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenuList>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <SidebarHeader className={cn("px-6 py-6 border-b border-[#d8dadc]/50 transition-all duration-200 ease-in-out", open ? "" : "px-3")}>
        <div className={cn("flex items-center gap-3", !isMobile && open ? "" : "justify-center")}>
          <button
            onClick={isMobile ? () => setOpenMobile(false) : toggleSidebar}
            className="bg-[#0F172A] text-white p-2 rounded-[8px] flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer border-0"
            title={isMobile ? "Close Menu" : open ? "Collapse Menu" : "Expand Menu"}
          >
            {isMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {(!isMobile && open) && (
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Menu</h1>
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
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpenMobile(false)} />
        )}
        <div
          className={cn(
            "fixed top-16 left-0 bottom-0 z-50 w-[280px] bg-white border-r border-[#d8dadc] shadow-sm flex flex-col transition-transform duration-200 ease-in-out",
            openMobile ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div className={cn("fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] transition-[width] duration-200 ease-in-out", open ? "w-[280px]" : "w-[80px]")}>
      <SidebarRoot
        collapsible="none"
        className="flex size-full flex-col bg-white border-r border-[#d8dadc] shadow-sm"
      >
        {sidebarContent}
      </SidebarRoot>
    </div>
  );
}
