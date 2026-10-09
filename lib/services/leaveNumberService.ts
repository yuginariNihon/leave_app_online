import { Prisma } from "@/lib/generated/prisma/client";

export function formatLeaveNo(thaiYear: number, seq: number): string {
  const s = seq.toString().padStart(4, "0");
  return `${thaiYear}-${s}`;
}

export function gregorianToThaiYear(gregorianDate: Date): number {
  return gregorianDate.getUTCFullYear() + 543;
}

export async function allocateLeaveNo(
  tx: Prisma.TransactionClient,
  thaiYear: number,
): Promise<string> {
  try {
    const updated = await tx.leaveCounter.upsert({
      where: { year: thaiYear },
      update: { last_value: { increment: 1 } },
      create: { year: thaiYear, last_value: 1 },
      select: { last_value: true },
    });
    return formatLeaveNo(thaiYear, updated.last_value);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const updated = await tx.leaveCounter.update({
        where: { year: thaiYear },
        data: { last_value: { increment: 1 } },
        select: { last_value: true },
      });
      return formatLeaveNo(thaiYear, updated.last_value);
    }
    throw err;
  }
}
