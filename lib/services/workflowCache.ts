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
}
