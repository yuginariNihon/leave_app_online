export type MenuItem = {
  path: string;
  pageKey: string;
  label: string;
  icon: string;
  groupName: string;
  roles: string[];
};

export const MENU_ITEMS: MenuItem[] = [
  // ── HR menu (เมนู HR) ──
  { path: "/dashboard/hr",                    pageKey: "hr_dashboard",        label: "Dashboard",              icon: "LayoutDashboard", groupName: "เมนู HR",    roles: ["HR", "SUPER_ADMIN"] },
  { path: "/dashboard/approval-requests/hr",   pageKey: "hr_approval",        label: "อนุมัติคำขอลา (HR)",     icon: "ShieldCheck",     groupName: "เมนู HR",    roles: ["HR"] },
  { path: "/dashboard/hr/leave-report",        pageKey: "leave_report",       label: "รายงานการลา",            icon: "BarChart3",       groupName: "เมนู HR",    roles: ["HR"] },
  { path: "/dashboard/leave-calendar",         pageKey: "leave_calendar",     label: "ปฏิทินการลา",            icon: "CalendarDays",    groupName: "เมนู HR",    roles: ["HR", "APPROVER"] },

  // ── System management (จัดการระบบ) ──
  { path: "/dashboard/hr/workflows",           pageKey: "manage_workflows",   label: "จัดการลำดับการอนุมัติ",  icon: "GitBranch",       groupName: "จัดการระบบ", roles: ["HR"] },
  { path: "/dashboard/hr/staff-list",          pageKey: "manage_staff",       label: "รายชื่อพนักงาน",        icon: "Users",           groupName: "จัดการระบบ", roles: ["HR"] },
  { path: "/dashboard/hr/departments",         pageKey: "manage_departments", label: "จัดการแผนก",            icon: "Building2",       groupName: "จัดการระบบ", roles: ["HR"] },
  { path: "/dashboard/hr/positions",           pageKey: "manage_positions",   label: "จัดการตำแหน่ง",          icon: "Briefcase",       groupName: "จัดการระบบ", roles: ["HR"] },
  { path: "/dashboard/hr/leave-types",         pageKey: "manage_leave_types", label: "จัดการประเภทการลา",      icon: "Tags",            groupName: "จัดการระบบ", roles: ["HR"] },
  { path: "/dashboard/hr/leave-cases",         pageKey: "manage_leave_cases", label: "จัดการกรณีการลา",        icon: "CaseSensitive",   groupName: "จัดการระบบ", roles: ["HR"] },
  { path: "/dashboard/hr/employee-types",      pageKey: "manage_emp_types",   label: "จัดการประเภทพนักงาน",    icon: "UserCog",         groupName: "จัดการระบบ", roles: ["HR"] },
  { path: "/dashboard/hr/sections",            pageKey: "manage_sections",    label: "จัดการแผนกย่อย",        icon: "Building2",       groupName: "จัดการระบบ", roles: ["HR"] },
  { path: "/dashboard/hr/leave-quota",         pageKey: "manage_leave_quota", label: "จัดการสิทธิ์วันลา",      icon: "FileText",        groupName: "จัดการระบบ", roles: ["HR"] },
  { path: "/dashboard/hr/holidays",            pageKey: "manage_holidays",    label: "จัดการวันหยุด",          icon: "CalendarDays",    groupName: "จัดการระบบ", roles: ["HR"] },
  { path: "/dashboard/hr/user-management",     pageKey: "manage_users",       label: "จัดการผู้ใช้",           icon: "UserCog",         groupName: "จัดการระบบ", roles: ["HR", "SUPER_ADMIN"] },
  { path: "/dashboard/admin/roles",            pageKey: "manage_roles",       label: "จัดการบทบาทพนักงาน",    icon: "Shield",          groupName: "จัดการระบบ", roles: ["SUPER_ADMIN"] },
  { path: "/dashboard/hr/staff-roles",         pageKey: "manage_staff_roles", label: "จัดการสิทธิ์ของพนักงาน", icon: "UserCog",         groupName: "จัดการระบบ", roles: ["SUPER_ADMIN"] },
  { path: "/dashboard/admin/page-permissions", pageKey: "manage_page_permissions", label: "จัดการสิทธิ์การเข้าถึงหน้า", icon: "Shield", groupName: "จัดการระบบ", roles: ["SUPER_ADMIN"] },

  // ── Employee pages (เมนูพนักงาน) ──
  { path: "/dashboard",                        pageKey: "user_profile",       label: "โปรไฟล์ของฉัน",         icon: "LayoutDashboard", groupName: "เมนูพนักงาน", roles: ["STAFF", "Employee", "APPROVER"] },
  { path: "/dashboard/leave-request",          pageKey: "leave_request",      label: "คำขอลา",                icon: "FileText",        groupName: "เมนูพนักงาน", roles: ["STAFF", "APPROVER"] },
  { path: "/dashboard/leave-history",          pageKey: "leave_history",      label: "ประวัติการลา",           icon: "History",         groupName: "เมนูพนักงาน", roles: ["STAFF", "APPROVER"] },
  { path: "/dashboard/leave-details",          pageKey: "leave_details",      label: "รายละเอียดการลา",       icon: "FileText",        groupName: "เมนูพนักงาน", roles: ["STAFF", "APPROVER"] },

  // ── Supervisor (เมนูหัวหน้า) ──
  { path: "/dashboard/approval-requests",       pageKey: "supervisor_approval", label: "รายการคำขอลา",        icon: "ClipboardList",   groupName: "เมนูหัวหน้า", roles: ["APPROVER"] },
  { path: "/dashboard/approval-requests/history", pageKey: "supervisor_history", label: "ประวัติการอนุมัติ",   icon: "History",         groupName: "เมนูหัวหน้า", roles: ["APPROVER", "HR"] },
];

export function canAccessPage(pageKey: string, userRoles: string[]): boolean {
  if (userRoles.includes("SUPER_ADMIN")) return true;
  const item = MENU_ITEMS.find((m) => m.pageKey === pageKey);
  if (!item) return false;
  return item.roles.some((r) => userRoles.includes(r));
}

export const PAGE_KEY_BY_PREFIX: [string, string][] = MENU_ITEMS
  .map((item) => [item.path, item.pageKey] as [string, string])
  .sort((a, b) => b[0].length - a[0].length);

export const DEFAULT_PAGE_PERMISSIONS: { pageKey: string; pageName: string; groupName: string; defaultRoleNames: string[] }[] =
  MENU_ITEMS.map((item) => ({
    pageKey: item.pageKey,
    pageName: item.label,
    groupName: item.groupName,
    defaultRoleNames: item.roles,
  }));
