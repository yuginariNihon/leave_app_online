<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Goal
- Maintain and improve the leave management system (HR dashboard, analytics, security, workflows).

## Constraints & Preferences
- `schema.prisma` locked — no model changes unless explicitly required.
- Design/layout UI unchanged — logic & data flow only.
- Font: Geist Sans via `font-sans`.

## File layout (จัดระเบียบ 2026-11-18 — Plan B)
> path เก่าในบันทึก Progress ด้านล่างให้อ่านตาม mapping นี้ (เป็นบันทึกประวัติ ไม่ได้แก้ย้อนหลัง)

| เดิม | ใหม่ |
|---|---|
| `Design/**` (60 ไฟล์ mockup) | `docs/design/**` |
| `media/**` | `docs/media/**` |
| `app/dashboard/hr/{KpiCards,DeferredCharts,StalePendingTable,…}.tsx` (14 ไฟล์) | `app/dashboard/hr/_components/**` (`_` = ไม่ถูก route) |
| `components/{MainHeader,MainFooter,DashboardContent,AppBreadcrumb,BottomActionBar}.tsx` | `components/layout/` |
| `components/{LoginForm,LoginOverlay,ResetPasswordForm,SocialLogin,OpenApp}.tsx` | `components/auth/` |
| `components/{DashboardIntro,LeaveRights,LeaveStatsCards,ProfileCard,QuickActions,RecentLeaveList}.tsx` | `components/dashboard/` |
| `components/{ProgressBar,Reveal}.tsx` | `components/shared/` |
| `hooks/useFileUpload.ts` | **ลบ** (ไม่มีผู้เรียก — file upload ยังไม่ทำ) |
| `app/api/hr/staff-list/route.ts` | **ลบ** (alias ที่ไม่มี client เรียก; canonical คือ `/api/hr/staff`) |
| `lib/{api,http,errors,logger,csv,utils,prisma}.ts` | `lib/core/` |
| `lib/{auth,api-guards,loginNextCookie,cronAuth}.ts` | `lib/auth/` (`auth.ts` → `auth/index.ts` → `@/lib/auth` ยังใช้ได้เหมือนเดิม) |
| `lib/{autoCancel,menu-config}.ts` | `lib/policy/` |
| `lib/user-context.tsx` | `lib/context/user-context.tsx` |
| `lib/TypeSchema.ts` (344 บรรทัด) | `lib/schemas/{common,leave,staff,master-data,workflow,profile}.ts` + barrel `index.ts` → `@/lib/schemas` |
| `lib/services/{approvalQueries,approverUtils}.ts` | `lib/services/approval/` |
| `lib/services/staffService.ts` · `masterDataService.ts` · `dashboardService.ts` | `lib/services/{staff,master-data,dashboard}/` |
| `lib/services/{roleService,rolePermissionService,userService,profileService}.ts` | `lib/services/admin/` |
| `lib/services/{workflowService,workflowCache}.ts` | `lib/services/workflow/` |
| `lib/services/{leaveMailerService,leaveNumberService,leaveQuotaService}.ts` | `lib/services/leave/` |

> **Barrel ไม่ย้าย**: `lib/services/leaveService.ts` และ `lib/services/approvalService.ts` ยังอยู่ที่ root ของ `lib/services/` (callers 83 + 14 ไฟล์ import จากสองไฟล์นี้) · `lib/services/auditService.ts` ก็อยู่ root (ใช้ 7 ที่)

กติกาใหม่: ไฟล์ประกอบใน `app/` ต้องอยู่ใต้โฟลเดอร์ `_` (`_components`) · component = `PascalCase.tsx` · ไฟล์ lib ใหม่ = `kebab-case.ts` (ไม่ rename ของเดิมที่ fan-out สูง: `utils` 57 ไฟล์, `api` 104, `TypeSchema` 48) · ของที่ไม่ใช่โค้ด (design/สื่อ/เอกสาร) อยู่ใต้ `docs/` เท่านั้น · **ห้าม import ย้อนชั้น** (`component → hooks → lib/core/api → app/api → lib/services → prisma`)


## Progress
### Done

> งานที่ทำเสร็จทั้งหมด (เรียงใหม่→เก่า) อยู่ที่ `docs/history.md` — เปิดเมื่อต้องรู้ว่าอะไรทำไปแล้ว / ทำไมทำแบบนั้น

### In Progress
- *(none)*
### Blocked
- *(none)*

## Key Decisions
- `sameSite: "strict"` instead of CSRF tokens.
- Session: fixed 1-hour expiry (`SESSION_MAX_AGE_SECONDS = 60 * 60`) — no sliding renewal.
- `.next` cache clean occasionally for stale route types.
- Prisma enum types → server; `@/lib/generated/prisma/enums` const objects → client.
- "ผ่านขั้นแรกแล้ว" = `LeaveApproval.approver_id IS NOT NULL` (a human acted). Auto-approved rows never set `approver_id`, so an auto-skipped first level does NOT lock editing.

## Next Steps
- Phase 4 (session cache in `proxy.ts`) needs an explicit security call from the user: pick a TTL and accept that logout / `force_change_password` / role changes can lag by up to that TTL, or skip it.
- Optional: re-run the perf audit numbers on the server's own network to confirm the DB round-trip wins (the original numbers were measured from the client machine).

## Critical Context
- TypeScript check (`npx tsc --noEmit`) passes clean.
- All API endpoints have auth + authorization guards (routes use `requireAuth`/`requireHR`/`requireSuperAdmin` from `@/lib/auth/api-guards`).
- Route catches return `apiErrorResponse(error)` (`@/lib/core/errors`) — AppError→400/401/403/404/409, unknown→500 generic (stack logged server-side).
- `api-guards`/`errors` are shared — new routes should use them, never inline `checkHR`-style guards or hardcoded `"Internal Server Error"`.
- Initial password: `phoneNumber || randomBytes(5).toString("hex")`.
- `/api/debug-db` development-only; no stack traces in production.
- CSV export sanitizes formula injection.
- SUPER_ADMIN role self-removal blocked.
- Login rate limit: 5 failures / 5 min → 30s delay.
- **ESLint เข้มงวดแล้ว**: `npm run lint` = `eslint . --max-warnings 0` → **ต้องผ่าน 0 warning** (CI พังถ้ามี warning). ถ้าเลี่ยงไม่ได้จริงให้ใส่ `// eslint-disable-next-line <rule>` พร้อมเหตุผลเท่านั้น. Pattern ที่ใช้แก้ `react-hooks/set-state-in-effect`: `fetchData` ต้องไม่มี `setState` ก่อน `await` ตัวแรก และตั้ง loading flag ใน event handler ที่สั่ง refetch.
- อย่าใช้ `form.watch()` (ชน `react-hooks/incompatible-library`) — ใช้ `useWatch` แทน ในหน้า leave-request/`StaffForm`/`LeaveTypeForm`.

## Relevant Files

ย้ายไป `docs/architecture.md` (file map + หน้าที่ของแต่ละโมดูล) — อ่านก่อนแตะ service/route/component ที่ไม่คุ้น
