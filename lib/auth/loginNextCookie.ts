export const LOGIN_NEXT_COOKIE = "leave_app_next";

export const LOGIN_NEXT_MAX_AGE_SECONDS = 5 * 60;

/**
 * Validates the post-login `next` path. Kept dependency-free so both the
 * middleware (`proxy.ts`) and the login server action can share it without
 * bundling auth/prisma. Rejects external URLs, protocol-relative paths,
 * backslashes and control characters.
 */
export function safeNextPath(raw: string | undefined): string | null {
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (
    decoded !== "/dashboard" &&
    !decoded.startsWith("/dashboard/") &&
    !decoded.startsWith("/dashboard?") &&
    !decoded.startsWith("/dashboard#")
  ) {
    return null;
  }
  if (decoded.includes("//") || /[\\\u0000-\u001F\u007F]/.test(decoded)) return null;
  if (/^[a-z]+:/i.test(decoded)) return null;
  return decoded;
}
