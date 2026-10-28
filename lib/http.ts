import { NextResponse } from "next/server";
import { ValidationError } from "@/lib/errors";
import { csvRow } from "@/lib/csv";

type ParseSchema<T> = {
  safeParse: (
    value: unknown,
  ) =>
    | { success: true; data: T }
    | { success: false; error: { issues: ReadonlyArray<{ message: string }> } };
};

export async function readJson<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ValidationError("รูปแบบข้อมูลไม่ถูกต้อง");
  }
}

export async function parseBody<T>(
  request: Request,
  schema: ParseSchema<T>,
): Promise<T> {
  const body = await readJson(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues.map((issue) => issue.message).join(", "),
    );
  }
  return parsed.data;
}

export type Pagination = {
  page: number;
  limit: number;
  skip: number;
};

function toPositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function parsePagination(
  searchParams: URLSearchParams,
  options: { defaultLimit?: number; maxLimit?: number } = {},
): Pagination {
  const { defaultLimit = 10, maxLimit = 100 } = options;
  const page = toPositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(toPositiveInt(searchParams.get("limit"), defaultLimit), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

export function parseLimit(
  searchParams: URLSearchParams,
  options: { key?: string; defaultLimit?: number; maxLimit?: number } = {},
): number {
  const { key = "limit", defaultLimit = 10, maxLimit = 100 } = options;
  return Math.min(toPositiveInt(searchParams.get(key), defaultLimit), maxLimit);
}

export type CsvStreamOptions = {
  filename: string;
  columns: string[];
  rows: () => AsyncIterable<string[]>;
};

export function csvStreamResponse({
  filename,
  columns,
  rows,
}: CsvStreamOptions): NextResponse {
  const encoder = new TextEncoder();
  const day = new Date().toISOString().split("T")[0];
  const safeName = filename.replace(/[^\w-]/g, "_");

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode("\uFEFF" + csvRow(columns) + "\n"));
      try {
        for await (const row of rows()) {
          controller.enqueue(encoder.encode(csvRow(row) + "\n"));
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\nError: ${(err as Error).message}\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}_${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
