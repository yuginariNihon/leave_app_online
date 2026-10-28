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

// Legacy hub re-exports (public surface unchanged).
export * from "@/lib/services/staffService";
export * from "@/lib/services/masterDataService";
export * from "@/lib/services/roleService";
export * from "@/lib/services/workflowService";
export * from "@/lib/services/profileService";
export * from "@/lib/services/userService";
export * from "@/lib/services/leaveQuotaService";
export { timeFromDb, minutesToTime } from "@/lib/utils";
