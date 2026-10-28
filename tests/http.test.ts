import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ValidationError } from "@/lib/errors";
import {
  csvStreamResponse,
  parseBody,
  parseLimit,
  parsePagination,
  readJson,
} from "@/lib/http";

function jsonRequest(body: string): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("readJson", () => {
  it("parses a JSON body", async () => {
    await expect(readJson(jsonRequest('{"a":1}'))).resolves.toEqual({ a: 1 });
  });

  it("throws a 400 ValidationError for malformed JSON", async () => {
    const error = await readJson(jsonRequest("{")).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).status).toBe(400);
  });
});

describe("parseBody", () => {
  const schema = z.object({
    name: z.string().min(1, "ชื่อห้ามว่าง"),
    age: z.coerce.number().int(),
  });

  it("returns the parsed output", async () => {
    await expect(
      parseBody(jsonRequest('{"name":"a","age":"3"}'), schema),
    ).resolves.toEqual({ name: "a", age: 3 });
  });

  it("joins schema issue messages into a ValidationError", async () => {
    const error = await parseBody(jsonRequest('{"name":"","age":"x"}'), schema).catch(
      (err: unknown) => err,
    );
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).message).toContain("ชื่อห้ามว่าง");
    expect((error as ValidationError).status).toBe(400);
  });
});

describe("parsePagination", () => {
  it("uses defaults when params are missing", () => {
    expect(parsePagination(new URLSearchParams())).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it("computes skip from page and limit", () => {
    expect(
      parsePagination(new URLSearchParams("page=3&limit=20"), { defaultLimit: 5 }),
    ).toEqual({ page: 3, limit: 20, skip: 40 });
  });

  it("falls back for invalid values and clamps the limit", () => {
    expect(
      parsePagination(new URLSearchParams("page=0&limit=9999"), {
        defaultLimit: 5,
        maxLimit: 100,
      }),
    ).toEqual({ page: 1, limit: 100, skip: 0 });
    expect(parsePagination(new URLSearchParams("page=abc&limit=-2"))).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });
});

describe("parseLimit", () => {
  it("reads, clamps and falls back", () => {
    const params = new URLSearchParams("limit=50");
    expect(parseLimit(params, { defaultLimit: 10, maxLimit: 20 })).toBe(20);
    expect(parseLimit(new URLSearchParams(), { defaultLimit: 7 })).toBe(7);
  });
});

describe("csvStreamResponse", () => {
  it("streams a BOM header, escaped rows and an attachment filename", async () => {
    const response = csvStreamResponse({
      filename: "leave report",
      columns: ["ชื่อ", "หมายเหตุ"],
      rows: async function* () {
        yield ["a, b", 'he said "hi"'];
        yield ["=1+1", "ปกติ"];
      },
    });

    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain(
      'attachment; filename="leave_report_',
    );

    const bytes = new Uint8Array(await response.clone().arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);

    const text = await response.text();
    expect(text).toContain('"ชื่อ","หมายเหตุ"');
    expect(text).toContain('"a, b","he said ""hi"""');
    expect(text).toContain('"\'=1+1","ปกติ"');
  });
});
