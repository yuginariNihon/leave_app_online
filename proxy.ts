import { createHash } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PAGE_KEY_BY_PREFIX } from "@/lib/menu-config";

const SESSION_COOKIE_NAME = "leave_app_db_session";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const USER_PAGES: string[] = [];

export async function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;
  let roleNames: string[] = [];

  // Auth check
  if (pathname.startsWith("/dashboard") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Session checks — single DB lookup per request covering:
  // (1) force-change-password guard, (2) HR dashboard redirect, (3) HR dashboard guard
  if (hasSession && pathname.startsWith("/dashboard") && pathname !== "/dashboard/reset-password") {
    try {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        const session = await prisma.session.findUnique({
          where: { token: hashToken(token) },
          select: {
            expires_at: true,
            user: {
              select: {
                force_change_password: true,
                staff: {
                  select: {
                    staffRoles: {
                      select: { role: { select: { role_name: true } } },
                    },
                  },
                },
              },
            },
          },
        });

        const isValid = !!session && session.expires_at.getTime() >= Date.now();
        roleNames = session?.user?.staff?.staffRoles?.map((sr) => sr.role.role_name.toUpperCase()) ?? [];
        const isHR = roleNames.includes("HR") || roleNames.includes("SUPER_ADMIN");

        if (!isValid) {
          const response = NextResponse.redirect(new URL("/login", request.url));
          response.cookies.delete(SESSION_COOKIE_NAME);
          return response;
        }

        // Forced password changes apply to every dashboard route, including
        // the HR dashboard.
        if (session.user?.force_change_password) {
          return NextResponse.redirect(new URL("/dashboard/reset-password?force=true", request.url));
        }

        if (pathname === "/dashboard/hr") {
          // HR dashboard guard — only HR or SUPER_ADMIN
          if (!isHR) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
          }
        } else {
          // HR dashboard redirect — HR/SUPER_ADMIN users should go to /dashboard/hr
          if (pathname === "/dashboard" && isHR) {
            return NextResponse.redirect(new URL("/dashboard/hr", request.url));
          }
        }
      }
    } catch {
      if (pathname === "/dashboard/hr") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Silently fail for other pages; allow request to proceed
    }
  }

  // Permission check — only for protected dashboard pages (skip /dashboard, /dashboard/hr and /dashboard/reset-password, already handled above)
  if (
    hasSession &&
    pathname.startsWith("/dashboard") &&
    pathname !== "/dashboard" &&
    pathname !== "/dashboard/hr" &&
    pathname !== "/dashboard/reset-password" &&
    !USER_PAGES.some((p) => pathname.startsWith(p))
  ) {
    const match = PAGE_KEY_BY_PREFIX.find(([prefix]) => pathname.startsWith(prefix));
    if (match) {
      const pageKey = match[1];
      try {
        // SUPER_ADMIN bypasses page-level permission checks (original behavior).
        if (roleNames.includes("SUPER_ADMIN")) {
          // allowed
        } else {
          const resource = await prisma.pageResource.findUnique({
            where: { page_key: pageKey },
            select: {
              rolePermissions: {
                select: { role: { select: { role_name: true } } },
              },
            },
          });

          if (resource) {
            const allowed = resource.rolePermissions.some((rp) =>
              roleNames.includes(rp.role.role_name.toUpperCase()),
            );
            if (!allowed) {
              return NextResponse.redirect(new URL("/dashboard", request.url));
            }
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
  matcher: ["/login", "/dashboard", "/dashboard/:path*"],
};
