# File map & responsibilities

> ย้ายมาจากหัวข้อ `Relevant Files` ใน `AGENTS.md` (2026-11-18)
> ใช้เมื่อต้องแตะ service / route / component ที่ไม่คุ้น

- `lib/TypeSchema.ts`: `createLeaveRequestSchema` without `status`.
- `lib/api-guards.ts`: `requireAuth`/`requireHR`/`requireSuperAdmin` (shared route guards).
- `lib/errors.ts`: `AppError` subclasses + `apiErrorResponse` (shared error mapping).
- `lib/api.ts`: `apiFetch<T>` + `ApiError` (all client HTTP).
- **Hubs (all callers import from these, do not import modules back into hubs)**: `lib/services/leaveService.ts` (leave-core + `export *` of staff/masterData/role/workflow/profile/userService), `lib/services/approvalService.ts` (actions + `export *` of approvalQueries).
- `lib/services/staffService.ts`: staff CRUD/import/profile.
- `lib/services/masterDataService.ts`: departments/positions/sections/leave-types/leave-cases/employment-types/holidays CRUD.
- `lib/services/roleService.ts` + `workflowService.ts` + `profileService.ts` + `userService.ts` + `approvalQueries.ts`: per-domain.
- `lib/services/leaveService.ts`: `CreateLeaveRequestInput`, `updateStaffRoles` (SUPER_ADMIN guard), `createStaff`/`importStaff` (password fallback + UserLeaveLimit).- `lib/services/approvalService.ts`: `getApprovalHistory` HR guard.
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
- `app/dashboard/hr/leave-quota/page.tsx`: Leave-quota management UI (missing-only list, manual `maxDays` vs annual-leave formula).
- `app/api/hr/leave-quota/missing/route.ts` + `app/api/hr/leave-quota/assign/route.ts`: Quota missing/assign endpoints.
- `proxy.ts`: Page permission enforcement.
- **Leave document number**: `DataLeave.leave_no` (nullable unique) + `LeaveCounter` model; allocation in `lib/services/leaveNumberService.ts` (`allocateLeaveNo(tx, year)`, Gregorian year of `start_date`), called inside `createLeaveRequest`'s `$transaction`. `leave_no` is immutable (PATCH/cancel never touch it); old rows `NULL` → UI/API fall back to `#LV-<uuid8>`.
- **Email notifications**: `lib/mail/sendEmail.ts` (Apps Script webhook POST, secret in body), `lib/services/leaveMailerService.ts` (`sendLeaveCreatedEmail`/`sendLeaveNextApproverEmail`/`sendLeaveApprovedEmail`/`sendLeaveCancelledEmail`/`sendLeaveRejectedEmail` + `schedule*` wrappers, leaf), `getApproverContacts` in `lib/services/approverUtils.ts`; hooked in `lib/services/leaveService.ts` (`createLeaveRequest`, `cancelLeaveRequest`) and `lib/services/approvalService.ts` (`advanceLeaveApproval`) via `schedule*`. `app/api/sendmail/route.ts` = HR-only test endpoint (`TEST_EMAIL_TO`). Env: `GOOGLE_APPS_SCRIPT_URL`, `SENDMAIL_WEBHOOK_SECRET`, optional `APP_BASE_URL`.
- **DB note**: `UserLeaveLimit[staff_id, leave_type_id, year]` is a unique **index**, not a table constraint — raw SQL must use `ON CONFLICT (staff_id, leave_type_id, year)`; `ON CONFLICT ON CONSTRAINT` fails with 42704. Prisma's `skipDuplicates` emits a bare `ON CONFLICT DO NOTHING` so it is unaffected.
- **Quotas are now enforced on approval** (was the open gap): a missing `UserLeaveLimit` row resolves the default via `resolveDefaultMaxDays` in `leaveQuotaService.ts` instead of bypassing the cap; an `unconfigured` leave type (`max_days_per_year = null`) is rejected with a 400.
- `components/AppBreadcrumb.tsx`: href validation.
- `lib/services/leaveService.ts`: `getRoleManageList`/`createRole`/`updateRoleName`/`toggleRoleActive` (Role CRUD, system-role + in-use guards).
- **Position→Role Default Mapping**: `Position.default_role_id` FK → `Role` (nullable, `onDelete: SetNull`). `resolveDefaultRole(positionId)` helper + `posDefaultRoleMap` (importStaff, O(1)) — `createStaff`/`importStaff` use DB default role first, fallback to old position-name logic. SUPER_ADMIN-only `PUT /api/admin/positions/[id]/default-role` (null = reset). `GET /api/hr/positions` returns `meta.{canManageDefaultRole, activeRoles}`; positions page shows "บทบาทเริ่มต้น" column (Select for SUPER_ADMIN, badge for HR).
- `app/api/admin/roles/route.ts` + `app/api/admin/roles/[id]/route.ts`: SUPER_ADMIN guard, POST/PATCH.
- `app/dashboard/admin/roles/manage/page.tsx`: Role CRUD UI.
- `lib/menu-config.ts`: `MENU_ITEMS` drives `PAGE_KEY_BY_PREFIX` + `DEFAULT_PAGE_PERMISSIONS` (auto-derived).
- **Refactor Phase 1/2 — API Guards + Error Taxonomy**: New `lib/api-guards.ts` (`requireAuth`/`requireHR`/`requireSuperAdmin`, each returns `{session, error}` GuardResult) + `lib/errors.ts` (`AppError` + `ValidationError`400/`UnauthorizedError`401/`ForbiddenError`403/`NotFoundError`404/`ConflictError`409 + `apiErrorResponse`). All `app/api/*` (except `auth/login|logout|session`) now use shared guards + catch via `apiErrorResponse`. `leaveService`/`approvalService` business throws converted to typed errors (duplicate→409, not-found→404, validation→400, HR/authority→401/403) — `LeaveRequestValidationError extends ValidationError` (the `StaffUpdateConflictError` subclass was later removed when emails became non-unique). Removed all `useForm<any>` (5 forms → typed via `CreateXValues`/`z.input`/`z.output` for coerce forms), `as any[]` in user export, debug-db `where: any`, and unused vars (`isSelf`, `_`, `formatDays`).
- **Refactor Phase 3 — Monolith Split**: `leaveService.ts` (3107→979 lines) now = leave-core (requests, history, detail, report, limits) + re-export hub `export *` from 6 new modules: `staffService.ts` (staff CRUD/import/profile), `masterDataService.ts` (departments/positions/sections/leave-types/leave-cases/employment-types/holidays), `roleService.ts`, `workflowService.ts`, `profileService.ts`, `userService.ts` (merged). `approvalService.ts` (1194→546 lines) = actions + hub re-export of new `approvalQueries.ts`. Private helpers duplicated where shared; **modules never import the hubs (no cycles)**; all callers unchanged (still import from `@/lib/services/leaveService`/`approvalService`).
- **Refactor Phase 4 — `apiFetch` Client Layer**: New `lib/api.ts` — `apiFetch<T>(url, options?)` (default JSON Content-Type, FormData-aware, throws `ApiError` with server `json.error` message + `status` + raw `payload`) + `ApiError`. All client `fetch()` in `app/dashboard` + `components` (100 calls / 45 files) replaced with typed `apiFetch<T>` using real service types; `hr/staff-list/import` reads `schemaErrors` from `ApiError.payload`. No `fetch(` remains in client code.