/**
 * Leave domain barrel.
 *
 * Callers keep importing from `@/lib/services/leaveService`; the implementation
 * is split into focused modules under `lib/services/leave/`:
 *  - constants  — validation error + working-hour constants
 *  - validation — time/date math, server-side leave validation, conflict rules
 *  - mutations  — create / update / cancel
 *  - queries    — form options, history, detail, dashboard stats, rights, recent
 *  - calendar   — monthly approved-leave calendar
 *  - report     — HR leave report
 *  - limits     — quota sync + bulk assign
 *  - stalePending — auto-cancel leaves stuck on the first approval step
 *
 * Modules never import this file (that would create a cycle).
 */
export * from "@/lib/services/leave/constants";
export * from "@/lib/services/leave/validation";
export * from "@/lib/services/leave/mutations";
export * from "@/lib/services/leave/queries";
export * from "@/lib/services/leave/calendar";
export * from "@/lib/services/leave/report";
export * from "@/lib/services/leave/limits";
export * from "@/lib/services/leave/stalePending";

// Legacy hub re-exports (public surface unchanged).
export * from "@/lib/services/staff/staffService";
export * from "@/lib/services/master-data/masterDataService";
export * from "@/lib/services/admin/roleService";
export * from "@/lib/services/workflow/workflowService";
export * from "@/lib/services/admin/profileService";
export * from "@/lib/services/admin/userService";
export * from "@/lib/services/leave/leaveQuotaService";
export { timeFromDb, minutesToTime } from "@/lib/core/utils";
