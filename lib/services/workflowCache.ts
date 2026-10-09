import { prisma } from "@/lib/prisma";

type CachedWorkflow = {
  workflow_id: string;
  position_id: string;
  is_active: boolean;
  steps: { approval_level: number; approver_type: string }[];
};

const cache = new Map<string, { data: CachedWorkflow | null; expiresAt: number }>();
const TTL_MS = 5000;

export async function getCachedWorkflow(positionId: string): Promise<CachedWorkflow | null> {
  const key = positionId;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  const result = await prisma.leaveWorkflow.findFirst({
    where: { position_id: positionId, is_active: true },
    include: { steps: { orderBy: { approval_level: "asc" }, select: { approval_level: true, approver_type: true } } },
  });
  cache.set(key, { data: result as unknown as CachedWorkflow | null, expiresAt: Date.now() + TTL_MS });
  return result as unknown as CachedWorkflow | null;
}

export function clearWorkflowCache(positionId?: string) {
  if (positionId) cache.delete(positionId);
  else cache.clear();
  hrStepsCache.clear();
}

/** HR approval step + the position it applies to. */
export type CachedHrStep = { approval_level: number; position_id: string };

const hrStepsCache = new Map<string, { data: CachedHrStep[]; expiresAt: number }>();

/**
 * All HR approval steps, used to build the pending-approval filters. Same 5s
 * TTL as getCachedWorkflow — these rows only change when HR edits a workflow,
 * and the dashboard/list would otherwise re-query them on every page load.
 */
export async function getCachedHrWorkflowSteps(): Promise<CachedHrStep[]> {
  const now = Date.now();
  const cached = hrStepsCache.get("hr");
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  const rows = await prisma.leaveWorkflowStep.findMany({
    where: { approver_type: "HR" },
    include: { workflow: { select: { position_id: true } } },
  });
  const data: CachedHrStep[] = rows.map((r) => ({
    approval_level: r.approval_level,
    position_id: r.workflow.position_id,
  }));
  hrStepsCache.set("hr", { data, expiresAt: now + TTL_MS });
  return data;
}
