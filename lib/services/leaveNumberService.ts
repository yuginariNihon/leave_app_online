import { Prisma } from "@/lib/generated/prisma/client";

export function formatLeaveNo(year: number, seq: number): string {
  const s = seq.toString().padStart(4, "0");
  return `${year}-${s}`;
}

export async function allocateLeaveNo(
  tx: Prisma.TransactionClient,
  year: number,
): Promise<string> {
  try {
    const updated = await tx.leaveCounter.upsert({
      where: { year },
      update: { last_value: { increment: 1 } },
      create: { year, last_value: 1 },
      select: { last_value: true },
    });
    return formatLeaveNo(year, updated.last_value);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const updated = await tx.leaveCounter.update({
        where: { year },
        data: { last_value: { increment: 1 } },
        select: { last_value: true },
      });
      return formatLeaveNo(year, updated.last_value);
    }
    throw err;
  }
}
