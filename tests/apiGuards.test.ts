import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionUser = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({ getSessionUser }));

const { requireAnyRole } = await import("@/lib/api-guards");

function session(roles: string[]) {
  return {
    userId: "user-1",
    staffId: "staff-1",
    roles,
  };
}

describe("requireAnyRole", () => {
  beforeEach(() => {
    getSessionUser.mockReset();
  });

  it("returns 401 when there is no session", async () => {
    getSessionUser.mockResolvedValue(null);
    const result = await requireAnyRole(["HR"]);
    expect(result.error?.status).toBe(401);
  });

  it("returns 403 when the user has none of the roles", async () => {
    getSessionUser.mockResolvedValue(session(["EMPLOYEE"]));
    const result = await requireAnyRole(["HR", "APPROVER"]);
    expect(result.error?.status).toBe(403);
  });

  it("returns the session when a role matches", async () => {
    getSessionUser.mockResolvedValue(session(["HR"]));
    const result = await requireAnyRole(["HR", "APPROVER"]);
    expect(result.error).toBeNull();
    expect(result.session?.staffId).toBe("staff-1");
  });

  it("matches roles case-insensitively", async () => {
    getSessionUser.mockResolvedValue(session(["approver"]));
    const result = await requireAnyRole(["HR", "APPROVER"]);
    expect(result.error).toBeNull();
  });

  it("does not grant SUPER_ADMIN implicitly", async () => {
    getSessionUser.mockResolvedValue(session(["SUPER_ADMIN"]));
    const result = await requireAnyRole(["HR"]);
    expect(result.error?.status).toBe(403);
  });
});
