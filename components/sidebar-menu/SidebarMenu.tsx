"use client";

import { useState, useTransition } from "react";
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
                  className={cn(btnClass(activePaths.dashboard), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr")}
                  tooltip={showLabels ? undefined : "Dashboard"}
                >
                  <LayoutDashboard className={iconClass(activePaths.dashboard)} />
                  {showLabels && <span>Dashboard</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.hrApproval), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/approval-requests/hr")}
                  tooltip={showLabels ? undefined : "อนุมัติคำขอลา (HR)"}
                >
                  <ShieldCheck className={iconClass(activePaths.hrApproval)} />
                  {showLabels && <span>อนุมัติคำขอลา (HR)</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.hrHistory), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/approval-requests/history?roleType=hr")}
                  tooltip={showLabels ? undefined : "ประวัติการอนุมัติ (HR)"}
                >
                  <History className={iconClass(activePaths.hrHistory)} />
                  {showLabels && <span>ประวัติการอนุมัติ (HR)</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.leaveReport), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/leave-report")}
                  tooltip={showLabels ? undefined : "รายงานการลา"}
                >
                  <BarChart3 className={iconClass(activePaths.leaveReport)} />
                  {showLabels && <span>รายงานการลา</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.leaveCalendar), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/leave-calendar")}
                  tooltip={showLabels ? undefined : "ปฏิทินการลา"}
                >
                  <CalendarDays className={iconClass(activePaths.leaveCalendar)} />
                  {showLabels && <span>ปฏิทินการลา</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenuList>
          </SidebarGroupContent>
          )}
        </SidebarGroup>
        <SidebarGroup className={cn("transition-all duration-200 ease-in-out", showLabels ? "" : "px-0")}>
          <div className={cn("flex items-center justify-between mb-2 cursor-pointer select-none", showLabels ? "px-3" : "justify-center")} onClick={() => setSystemMenuExpanded(!systemMenuExpanded)}>
            {showLabels && (
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                จัดการระบบ
              </SidebarGroupLabel>
            )}
            {showLabels && <ChevronDown className={cn("w-[18px] h-[18px] text-slate-300 transition-transform", systemMenuExpanded ? "" : "-rotate-90")} />}
          </div>
          {systemMenuExpanded && (
          <SidebarGroupContent>
            <SidebarMenuList className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.workflows), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/workflows")}
                  tooltip={showLabels ? undefined : "จัดการลำดับการอนุมัติ"}
                >
                  <GitBranch className={iconClass(activePaths.workflows)} />
                  {showLabels && <span>จัดการลำดับการอนุมัติ</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.staffList || activePaths.staffListAdd || activePaths.staffListImport || activePaths.userManagement), showLabels ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/staff-list")}
                  tooltip={showLabels ? undefined : "รายชื่อพนักงาน"}
                >
                  <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                    <Users className={iconClass(activePaths.staffList || activePaths.staffListAdd || activePaths.staffListImport || activePaths.userManagement)} />
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
                    {canAccessPage("manage_users", roles) && (
                      <SidebarMenuButton className={cn(btnClass(activePaths.userManagement), "!py-2")} onClick={() => handleNav("/dashboard/hr/user-management")}>
                        <div className="flex items-center gap-3">
                          <UserCog className={cn("size-[18px] shrink-0", iconClass(activePaths.userManagement))} />
                          <span>จัดการผู้ใช้</span>
                        </div>
                      </SidebarMenuButton>
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
                    <Building2 className={iconClass(activePaths.departments || activePaths.departmentsAdd || activePaths.sections)} />
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
                  <div className="ml-3 mt-0.5 space-y-0.5">
                    <SidebarMenuButton className={cn(btnClass(activePaths.departmentsAdd), "!py-2")} onClick={() => handleNav("/dashboard/hr/departments/add")}>
                      <div className="flex items-center gap-3">
                        <Plus className={cn("size-[18px] shrink-0", iconClass(activePaths.departmentsAdd))} />
                        <span>เพิ่มแผนก</span>
                      </div>
                    </SidebarMenuButton>
                    <SidebarMenuButton className={cn(btnClass(activePaths.sections), "!py-2")} onClick={() => handleNav("/dashboard/hr/sections")}>
                      <div className="flex items-center gap-3">
                        <Building2 className={cn("size-[18px] shrink-0", iconClass(activePaths.sections))} />
                        <span>จัดการแผนกย่อย</span>
                      </div>
                    </SidebarMenuButton>
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
                    <Briefcase className={iconClass(activePaths.positions || activePaths.positionsAdd)} />
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
                  className={cn(btnClass(activePaths.leaveTypes || activePaths.leaveTypesAdd), showLabels ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/leave-types")}
                  tooltip={showLabels ? undefined : "จัดการประเภทการลา"}
                >
                  <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                    <Tags className={iconClass(activePaths.leaveTypes || activePaths.leaveTypesAdd)} />
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
                  className={cn(btnClass(activePaths.leaveCases || activePaths.leaveCasesAdd), showLabels ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/leave-cases")}
                  tooltip={showLabels ? undefined : "จัดการกรณีการลา"}
                >
                  <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                    <CaseSensitive className={iconClass(activePaths.leaveCases || activePaths.leaveCasesAdd)} />
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
                        <Shield className={iconClass(activePaths.adminRights)} />
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
                      <div className="ml-3 mt-0.5 space-y-0.5">
                        {canAccessPage("manage_roles", roles) && (
                          <SidebarMenuButton className={cn(btnClass(activePaths.adminRoles), "!py-2")} onClick={() => handleNav("/dashboard/admin/roles")}>
                            <div className="flex items-center gap-3">
                              <Shield className={cn("size-[18px] shrink-0", iconClass(activePaths.adminRoles))} />
                              <span>จัดการบทบาทพนักงาน</span>
                            </div>
                          </SidebarMenuButton>
                        )}
                        {canAccessPage("manage_roles_crud", roles) && (
                          <SidebarMenuButton className={cn(btnClass(activePaths.adminRolesCrud), "!py-2")} onClick={() => handleNav("/dashboard/admin/roles/manage")}>
                            <div className="flex items-center gap-3">
                              <UserCog className={cn("size-[18px] shrink-0", iconClass(activePaths.adminRolesCrud))} />
                              <span>จัดการบทบาท</span>
                            </div>
                          </SidebarMenuButton>
                        )}
                        {canAccessPage("manage_staff_roles", roles) && (
                          <SidebarMenuButton className={cn(btnClass(activePaths.staffRoles), "!py-2")} onClick={() => handleNav("/dashboard/hr/staff-roles")}>
                            <div className="flex items-center gap-3">
                              <UserCog className={cn("size-[18px] shrink-0", iconClass(activePaths.staffRoles))} />
                              <span>จัดการสิทธิ์ของพนักงาน</span>
                            </div>
                          </SidebarMenuButton>
                        )}
                        {canAccessPage("manage_page_permissions", roles) && (
                          <SidebarMenuButton className={cn(btnClass(activePaths.adminPagePermissions), "!py-2")} onClick={() => handleNav("/dashboard/admin/page-permissions")}>
                            <div className="flex items-center gap-3">
                              <Shield className={cn("size-[18px] shrink-0", iconClass(activePaths.adminPagePermissions))} />
                              <span>จัดการสิทธิ์การเข้าถึงหน้า</span>
                            </div>
                          </SidebarMenuButton>
                        )}
                      </div>
                    )}
                  </SidebarMenuItem>
                )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.holidays), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/holidays")}
                  tooltip={showLabels ? undefined : "จัดการวันหยุด"}
                >
                  <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                    <CalendarDays className={iconClass(activePaths.holidays)} />
                    {showLabels && <span>จัดการวันหยุด</span>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.employeeTypes || activePaths.employeeTypesAdd), showLabels ? "justify-between" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/hr/employee-types")}
                  tooltip={showLabels ? undefined : "จัดการประเภทพนักงาน"}
                >
                  <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
                    <UserCog className={iconClass(activePaths.employeeTypes || activePaths.employeeTypesAdd)} />
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
        <SidebarGroup className={cn("transition-all duration-200 ease-in-out", showLabels ? "" : "px-0")}>
          {showLabels && (
            <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              การอนุมัติสำหรับหัวหน้างาน
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenuList className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.supervisorApproval), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/approval-requests")}
                  tooltip={showLabels ? undefined : "รายการคำขอลา"}
                >
                  <ClipboardList className={iconClass(activePaths.supervisorApproval)} />
                  {showLabels && <span>รายการคำขอลา</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.supervisorHistory), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/approval-requests/history")}
                  tooltip={showLabels ? undefined : "ประวัติการอนุมัติ"}
                >
                  <History className={iconClass(activePaths.supervisorHistory)} />
                  {showLabels && <span>ประวัติการอนุมัติ</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(btnClass(activePaths.leaveCalendar), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                  onClick={() => handleNav("/dashboard/leave-calendar")}
                  tooltip={showLabels ? undefined : "ปฏิทินการลา"}
                >
                  <CalendarDays className={iconClass(activePaths.leaveCalendar)} />
                  {showLabels && <span>ปฏิทินการลา</span>}
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
        {showLabels && (
          <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            เมนูพนักงาน
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenuList className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                className={cn(btnClass(activePaths.employeeDashboard), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                onClick={() => handleNav("/dashboard")}
                tooltip={showLabels ? undefined : "หน้าหลัก"}
              >
                <LayoutDashboard className={iconClass(activePaths.employeeDashboard)} />
                {showLabels && <span>หน้าหลัก</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                className={cn(btnClass(activePaths.leaveRequest), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                onClick={() => handleNav("/dashboard/leave-request")}
                tooltip={showLabels ? undefined : "คำขอลา"}
              >
                <FileText className={iconClass(activePaths.leaveRequest)} />
                {showLabels && <span>คำขอลา</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                className={cn(btnClass(activePaths.leaveHistory), showLabels ? "" : "!w-10 !h-10 !p-0 !justify-center !mx-auto")}
                onClick={() => handleNav("/dashboard/leave-history")}
                tooltip={showLabels ? undefined : "ประวัติการลา"}
              >
                <History className={iconClass(activePaths.leaveHistory)} />
                {showLabels && <span>ประวัติการลา</span>}
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
      <SidebarHeader className={cn("px-6 py-6 border-b border-[#d8dadc]/50 transition-all duration-200 ease-in-out", showLabels ? "" : "px-3")}>
        <div className="w-full flex items-start gap-3">
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
