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
  - Auth: `sameSite: "strict"`; sliding expiration; SHA-256 token hashing.
  - Login rate limit: 5 failures / 5 min → 30s delay.
  - CSV sanitize: prefix `=`, `+`, `-`, `@` with `'`.
  - HR deactivation guard: cannot deactivate other HR/SUPER_ADMIN.
  - Leave quota validation: `usedDays <= maxDays`.
  - HR approval endpoints (`hr/[id]`, `hr/bulk`): `isHR` check.
  - AppBreadcrumb href validation (must start with `/`).
  - Leave reason: `.trim().slice(0, 500)`.
  - Fixed `LeaveDetailResponse.staffId` field — `detail.staffId` replaces `detail.staff.staff_id`.
- **File Upload Marked**: All file upload code commented as `⚠️ not yet implemented`; UI blocks hidden with `{false && (...)}`.

### In Progress
- *(none)*

### Blocked
- *(none)*

## Key Decisions
- `sameSite: "strict"` instead of CSRF tokens.
- Sliding expiration: extend if < 30 min remaining.
- `.next` cache clean occasionally for stale route types.
- Prisma enum types → server; `@/lib/generated/prisma/enums` const objects → client.

## Next Steps
- *(none)*

## Critical Context
- TypeScript check (`npx tsc --noEmit`) passes clean.
- All API endpoints have auth + authorization guards.
- Initial password: `phoneNumber || randomBytes(5).toString("hex")`.
- `/api/debug-db` development-only; no stack traces in production.
- CSV export sanitizes formula injection.
- SUPER_ADMIN role self-removal blocked.
- Login rate limit: 5 failures / 5 min → 30s delay.

## Relevant Files
- `lib/TypeSchema.ts`: `createLeaveRequestSchema` without `status`.
- `lib/services/leaveService.ts`: `CreateLeaveRequestInput`, `updateStaffRoles` (SUPER_ADMIN guard), `createStaff`/`importStaff` (password fallback + UserLeaveLimit).
- `lib/services/approvalService.ts`: `getApprovalHistory` HR guard.
- `lib/services/rolePermissionService.ts`: Default pages + per-page upsert.
- `lib/services/userService.ts`: LoginHistory with IP + user-agent.
- `lib/auth.ts`: Session creation (sameSite strict), sliding expiration, token hashing.
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
