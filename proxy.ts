import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PAGE_KEY_BY_PREFIX } from "@/lib/menu-config";

const SESSION_COOKIE_NAME = "leave_app_db_session";

const USER_PAGES: string[] = [];

export async function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  // Auth check
  if (pathname.startsWith("/dashboard") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Force change password guard
  if (hasSession && pathname.startsWith("/dashboard") && pathname !== "/dashboard/reset-password") {
    try {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        const session = await prisma.session.findUnique({
          where: { token },
          select: {
            user: { select: { force_change_password: true } },
          },
        });
        if (session?.user?.force_change_password) {
          return NextResponse.redirect(new URL("/dashboard/reset-password?force=true", request.url));
        }
      }
    } catch {
      // Silently fail if DB query errors; allow request to proceed
    }
  }

  // HR dashboard guard — only HR or SUPER_ADMIN
  if (hasSession && pathname === "/dashboard/hr") {
    try {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        const session = await prisma.session.findUnique({
          where: { token },
          select: {
            user: {
              select: {
                staff: {
                  select: {
                    staffRoles: {
                      select: {
                        role: { select: { role_name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        });
        const roleNames = session?.user?.staff?.staffRoles?.map((sr) => sr.role.role_name.toUpperCase()) ?? [];
        const isAuthorized = roleNames.includes("HR") || roleNames.includes("SUPER_ADMIN");
        if (!isAuthorized) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    } catch {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Permission check — only for protected dashboard pages
  if (
    hasSession &&
    pathname.startsWith("/dashboard") &&
    pathname !== "/dashboard" &&
    !USER_PAGES.some((p) => pathname.startsWith(p))
  ) {
    const match = PAGE_KEY_BY_PREFIX.find(([prefix]) => pathname.startsWith(prefix));
    if (match) {
      const pageKey = match[1];
      try {
        const checkUrl = new URL("/api/internal/check-page-access", request.url);
        const res = await fetch(checkUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `${SESSION_COOKIE_NAME}=${request.cookies.get(SESSION_COOKIE_NAME)?.value}`,
          },
          body: JSON.stringify({ pathname, pageKey }),
        });

        if (res.ok) {
          const data = await res.json();
          if (!data.allowed) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
          }
        }
      } catch {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};
