<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Goal
- Maintain and improve the leave management system (HR dashboard, analytics, security, workflows).

## Constraints & Preferences
- `schema.prisma` locked — no model changes unless explicitly required.
- Design/layout UI unchanged — logic & data flow only.
- Font: Geist Sans via `font-sans`.

## Progress
### Done
- **Phase 1 — Dashboard MVP** (HR Dashboard): KPI cards (pending, approved today, month/year leaves, avg approval time, active/terminated), line chart (12-month trend), pie chart (leave type distribution), pending approval table, today's leave list, upcoming leave, recent activities.
- **Phase 2 — Analytics**: Department comparison bar chart, approval status donut chart, calendar (removed), balance summary (removed). All chart frames reduced (280→220 height, p-6→p-4 padding).
- **Page Permission Fix — Approver Role Access**: `proxy.ts` — removed USER_PAGES bypass, added 3 leave pages to PAGE_KEY_BY_PREFIX. `rolePermissionService.ts` — 3 default pages for APPROVER, per-page upsert seed. `check-page-access/route.ts` — case-insensitive role comparison. `updateStaffRoles` — case-insensitive role lookup.
- **UserLeaveLimit Auto-Creation**: `importStaff` + `createStaff` now upsert UserLeaveLimit per active LeaveType (default max_days=0).
- **Workflows Page (Cards)**: Rewrote `workflows/page.tsx` from `<Table>` to card grid matching ApproveFlow.html — icon + role name (left), scrollable step badges with arrows (center), Active chip + edit button (right).
- **Security Hardening** (16 items):
  - Removed `status` from `createLeaveRequestSchema` + `CreateLeaveRequestInput`; hardcoded to `LeaveStatus.pending`.
  - HR guard in `getApprovalHistory` before allowing `roleType="hr"`.
  - SUPER_ADMIN guard in `updateStaffRoles` — only SUPER_ADMIN can assign SUPER_ADMIN.
  - Password fallback: `phoneNumber` empty → `crypto.randomBytes(5).toString("hex")` (10 chars).
  - `/api/debug-db` — dev-only guard; generic error message (no stack).
  - `/api/leaves/[id]` — generic error without stack.
  - Auth: `sameSite: "strict"`; SHA-256 token hashing; session fixed 1-hour expiry (no sliding renewal).
  - Login rate limit: 5 failures / 5 min → 30s delay.
  - CSV sanitize: prefix `=`, `+`, `-`, `@` with `'`.
  - HR deactivation guard: cannot deactivate other HR/SUPER_ADMIN.
  - Leave quota validation: `usedDays <= maxDays`.
  - HR approval endpoints (`hr/[id]`, `hr/bulk`): `isHR` check.
  - AppBreadcrumb href validation (must start with `/`).
  - Leave reason: `.trim().slice(0, 500)`.
  - Fixed `LeaveDetailResponse.staffId` field — `detail.staffId` replaces `detail.staff.staff_id`.
- **File Upload Marked**: All file upload code commented as `⚠️ not yet implemented`; UI blocks hidden with `{false && (...)}`.
- **Import Date Fix**: Added `parseDateOnly`/`buildUtcDate` to `lib/utils.ts` (accepts YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY day-first, DD-MM-YYYY, Excel serial, YYYYMMDD). `importStaff` validates per-row with Thai error messages.
- **1 User 1 Role**: `StaffRoleDialog` → radio single-select; `updateStaffRoles` throws if 0 or >1 role (case-insensitive role match throughout).
- **Role CRUD (SUPER_ADMIN)**: New `manage_roles_crud` menu + `/dashboard/admin/roles/manage` page (table: name, staff count, status, system/custom type, edit/toggle). `getRoleManageList`/`createRole`/`updateRoleName`/`toggleRoleActive` in `leaveService.ts`; `POST /api/admin/roles` + `PATCH /api/admin/roles/[id]`. Guards: system roles (SUPER_ADMIN/HR/APPROVER/EMPLOYEE) unrenamable, cannot deactivate in-use roles or system roles (reactivation allowed), case-insensitive uniqueness. Permission entries auto-derived from `MENU_ITEMS`; `GET /api/admin/roles` conditionally seeds page permissions (checks `manage_roles_crud` pageResource exists first — avoids slow per-load seeding).
- **Menu Merge — จัดการผู้ใช้**: Moved "จัดการผู้ใช้" under "รายชื่อพนักงาน" as submenu item (with เพิ่ม/นำเข้า), gated by `canAccessPage("manage_users", roles)`; removed the unguarded standalone item; parent now highlights on user-management page too.
- **Menu Merge — สิทธิ์และบทบาท (A)**: Collapsed 4 SUPER_ADMIN items (จัดการบทบาทพนักงาน/จัดการบทบาท/จัดการสิทธิ์ของพนักงาน/จัดการสิทธิ์การเข้าถึงหน้า) under expandable parent "สิทธิ์และบทบาท" in SidebarMenu; parent shown if any of the 4 pages accessible; per-item guards kept; `activePaths.adminRights` highlights parent on any of the 4 routes.
- **Dropdown Always Below**: `SelectContent` in `components/ui/select.tsx` now defaults to `position="popper" side="bottom" sideOffset={4}` — every Radix Select in the project opens below its trigger (previously `item-aligned` could open above). DropdownMenu already opens below by default.
- **Staff Edit Error Classification**: `updateStaff` throws typed `StaffUpdateConflictError` (email duplicate); `PUT /api/hr/staff/[id]` returns Thai categorized errors — `ข้อมูลไม่ถูกต้อง: ...` (400), `ไม่พบข้อมูลพนักงาน...` (404), `ไม่สามารถบันทึกได้ มีข้อมูลซ้ำ: ...` (409), generic server error (500). `PUT leave-quota` same style + new `usedDays <= maxDays` guard. Edit page surfaces `json.error` detail in form box + quota toast.
- **Leave History Date Filter Toggle**: `LeaveHistoryFilters.dateField` (`"leave_period" | "created_at"`) — segmented toggle in `LeaveFilters` switches the single date-range to filter `created_at` (วันที่เขียนใบลา, end-range uses end-of-day `T23:59:59.999Z`) or leave-period dates (unchanged behavior). Wired in `leave-history/LeaveHistoryClient` (useFilterWithApply generic) + `/api/leaves/history` (applies to list and CSV export). **Default mode = `"created_at"`** — server SSR initial query (`leave-history/page.tsx`) + client initial state + ล้างตัวกรอง all use `dateField: "created_at"` for current month (ขัดด้วย SSR to match).

### In Progress
- *(none)*

### Blocked
- *(none)*

## Key Decisions
- `sameSite: "strict"` instead of CSRF tokens.
- Session: fixed 1-hour expiry (`SESSION_MAX_AGE_SECONDS = 60 * 60`) — no sliding renewal.
- `.next` cache clean occasionally for stale route types.
- Prisma enum types → server; `@/lib/generated/prisma/enums` const objects → client.

## Next Steps
- *(none)*

## Critical Context
- TypeScript check (`npx tsc --noEmit`) passes clean.
- All API endpoints have auth + authorization guards (routes use `requireAuth`/`requireHR`/`requireSuperAdmin` from `@/lib/api-guards`).
- Route catches return `apiErrorResponse(error)` (`@/lib/errors`) — AppError→400/401/403/404/409, unknown→500 generic (stack logged server-side).
- `api-guards`/`errors` are shared — new routes should use them, never inline `checkHR`-style guards or hardcoded `"Internal Server Error"`.
- Initial password: `phoneNumber || randomBytes(5).toString("hex")`.
- `/api/debug-db` development-only; no stack traces in production.
- CSV export sanitizes formula injection.
- SUPER_ADMIN role self-removal blocked.
- Login rate limit: 5 failures / 5 min → 30s delay.
- Known pre-existing eslint issues (NOT from refactor): `react-hooks/set-state-in-effect` errors in `app/dashboard/hr/staff-roles/page.tsx:78` + `app/dashboard/leave-calendar/page.tsx:81`; `prefer-const` error (`timer`) in `components/MainHeader.tsx:54`; unused vars in `app/dashboard/admin/{page-permissions,roles}/page.tsx`, `app/dashboard/hr/staff-roles/page.tsx` (`router`/`userRoles`), `components/ResetPasswordForm.tsx` (`setShowAll`), `components/leave-details/LeaveDetailsHeader.tsx`, `components/leave-request/DatePicker.tsx` (`isSunday`).

## Relevant Files
- `lib/TypeSchema.ts`: `createLeaveRequestSchema` without `status`.
- `lib/api-guards.ts`: `requireAuth`/`requireHR`/`requireSuperAdmin` (shared route guards).
- `lib/errors.ts`: `AppError` subclasses + `apiErrorResponse` (shared error mapping).
- `lib/api.ts`: `apiFetch<T>` + `ApiError` (all client HTTP).
- **Hubs (all callers import from these, do not import modules back into hubs)**: `lib/services/leaveService.ts` (leave-core + `export *` of staff/masterData/role/workflow/profile/userService), `lib/services/approvalService.ts` (actions + `export *` of approvalQueries).
- `lib/services/staffService.ts`: staff CRUD/import/profile + `StaffUpdateConflictError`.
- `lib/services/masterDataService.ts`: departments/positions/sections/leave-types/leave-cases/employment-types/holidays CRUD.
- `lib/services/roleService.ts` + `workflowService.ts` + `profileService.ts` + `userService.ts` + `approvalQueries.ts`: per-domain.
- `lib/services/leaveService.ts`: `CreateLeaveRequestInput`, `updateStaffRoles` (SUPER_ADMIN guard), `createStaff`/`importStaff` (password fallback + UserLeaveLimit).
- `lib/services/approvalService.ts`: `getApprovalHistory` HR guard.
- `lib/services/rolePermissionService.ts`: Default pages + per-page upsert.
- `lib/services/userService.ts`: LoginHistory with IP + user-agent.
- `lib/auth.ts`: Session creation (sameSite strict, fixed 1-hour expiry), SHA-256 token hashing.
- `app/api/leaves/route.ts`: Status hardcoded to `LeaveStatus.pending`.
- `app/api/leaves/[id]/route.ts`: Generic error (no stack).
- `app/api/leaves/detail/route.ts`: Uses `detail.staffId`.
- `app/api/leaves/approvals/hr/[id]/route.ts`, `bulk/route.ts`: HR role check.
- `app/api/hr/staff/[id]/route.ts`: HR deactivation guard.
- `app/api/hr/staff/[id]/leave-quota/route.ts`: usedDays validation.
- `app/api/hr/roles/staff/[id]/route.ts`: SUPER_ADMIN role guard.
- `app/api/internal/check-page-access/route.ts`: Case-insensitive role comparison.
- `app/api/debug-db/route.ts`: Dev-only, generic errors.
- `app/login/actions.ts`: Login rate limiting.
- `app/dashboard/hr/workflows/page.tsx`: Card layout.
- `proxy.ts`: Page permission enforcement.
- `components/AppBreadcrumb.tsx`: href validation.
- `lib/services/leaveService.ts`: `getRoleManageList`/`createRole`/`updateRoleName`/`toggleRoleActive` (Role CRUD, system-role + in-use guards).
- **Position→Role Default Mapping**: `Position.default_role_id` FK → `Role` (nullable, `onDelete: SetNull`). `resolveDefaultRole(positionId)` helper + `posDefaultRoleMap` (importStaff, O(1)) — `createStaff`/`importStaff` use DB default role first, fallback to old position-name logic. SUPER_ADMIN-only `PUT /api/admin/positions/[id]/default-role` (null = reset). `GET /api/hr/positions` returns `meta.{canManageDefaultRole, activeRoles}`; positions page shows "บทบาทเริ่มต้น" column (Select for SUPER_ADMIN, badge for HR).
- `app/api/admin/roles/route.ts` + `app/api/admin/roles/[id]/route.ts`: SUPER_ADMIN guard, POST/PATCH.
- `app/dashboard/admin/roles/manage/page.tsx`: Role CRUD UI.
- `lib/menu-config.ts`: `MENU_ITEMS` drives `PAGE_KEY_BY_PREFIX` + `DEFAULT_PAGE_PERMISSIONS` (auto-derived).
- **Refactor Phase 1/2 — API Guards + Error Taxonomy**: New `lib/api-guards.ts` (`requireAuth`/`requireHR`/`requireSuperAdmin`, each returns `{session, error}` GuardResult) + `lib/errors.ts` (`AppError` + `ValidationError`400/`UnauthorizedError`401/`ForbiddenError`403/`NotFoundError`404/`ConflictError`409 + `apiErrorResponse`). All `app/api/*` (except `auth/login|logout|session`) now use shared guards + catch via `apiErrorResponse`. `leaveService`/`approvalService` business throws converted to typed errors (duplicate→409, not-found→404, validation→400, HR/authority→401/403) — `LeaveRequestValidationError extends ValidationError`, `StaffUpdateConflictError extends ConflictError`. Removed all `useForm<any>` (5 forms → typed via `CreateXValues`/`z.input`/`z.output` for coerce forms), `as any[]` in user export, debug-db `where: any`, and unused vars (`isSelf`, `_`, `formatDays`).
- **Refactor Phase 3 — Monolith Split**: `leaveService.ts` (3107→979 lines) now = leave-core (requests, history, detail, report, limits) + re-export hub `export *` from 6 new modules: `staffService.ts` (staff CRUD/import/profile), `masterDataService.ts` (departments/positions/sections/leave-types/leave-cases/employment-types/holidays), `roleService.ts`, `workflowService.ts`, `profileService.ts`, `userService.ts` (merged). `approvalService.ts` (1194→546 lines) = actions + hub re-export of new `approvalQueries.ts`. Private helpers duplicated where shared; **modules never import the hubs (no cycles)**; all callers unchanged (still import from `@/lib/services/leaveService`/`approvalService`).
- **Refactor Phase 4 — `apiFetch` Client Layer**: New `lib/api.ts` — `apiFetch<T>(url, options?)` (default JSON Content-Type, FormData-aware, throws `ApiError` with server `json.error` message + `status` + raw `payload`) + `ApiError`. All client `fetch()` in `app/dashboard` + `components` (100 calls / 45 files) replaced with typed `apiFetch<T>` using real service types; `hr/staff-list/import` reads `schemaErrors` from `ApiError.payload`. No `fetch(` remains in client code.
