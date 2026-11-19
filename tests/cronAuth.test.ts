import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { isCronRequestAuthorized } from "@/lib/auth/cronAuth";

const SECRET = "test-cron-secret";

function request(url: string, headers?: Record<string, string>) {
  return new NextRequest(url, { headers });
}

describe("isCronRequestAuthorized", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ปฏิเสธทุกกรณีเมื่อยังไม่ตั้ง CRON_SECRET (fail closed)", () => {
    vi.stubEnv("CRON_SECRET", "");

    expect(isCronRequestAuthorized(request("http://localhost/api/cron/x"))).toBe(false);
    expect(
      isCronRequestAuthorized(request("http://localhost/api/cron/x?secret=")),
    ).toBe(false);
    expect(
      isCronRequestAuthorized(
        request("http://localhost/api/cron/x", { authorization: "Bearer " }),
      ),
    ).toBe(false);
  });

  it("รับ query secret ที่ถูกต้อง (ยิงมือ/ scheduler ภายนอก)", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    expect(
      isCronRequestAuthorized(request(`http://localhost/api/cron/x?secret=${SECRET}`)),
    ).toBe(true);
  });

  it("รับ Authorization: Bearer ที่ถูกต้อง (Vercel Cron)", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    expect(
      isCronRequestAuthorized(
        request("http://localhost/api/cron/x", { authorization: `Bearer ${SECRET}` }),
      ),
    ).toBe(true);
  });

  it("ปฏิเสธ secret ที่ผิด และ request ที่ไม่มี secret", () => {
    vi.stubEnv("CRON_SECRET", SECRET);

    expect(isCronRequestAuthorized(request("http://localhost/api/cron/x"))).toBe(false);
    expect(
      isCronRequestAuthorized(request("http://localhost/api/cron/x?secret=wrong")),
    ).toBe(false);
    expect(
      isCronRequestAuthorized(
        request("http://localhost/api/cron/x", { authorization: "Bearer wrong" }),
      ),
    ).toBe(false);
    expect(
      isCronRequestAuthorized(
        request("http://localhost/api/cron/x", { authorization: SECRET }),
      ),
    ).toBe(false);
  });
});
