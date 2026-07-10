import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "leave_app_db_session";

const PAGE_KEY_BY_PREFIX: [string, string][] = [
  ["/dashboard/admin/page-permissions", "manage_page_permissions"],
  ["/dashboard/admin/roles", "manage_roles"],
  ["/dashboard/hr/employee-types", "manage_emp_types"],
  ["/dashboard/hr/leave-cases", "manage_leave_cases"],
  ["/dashboard/hr/leave-types", "manage_leave_types"],
  ["/dashboard/hr/positions", "manage_positions"],
  ["/dashboard/hr/departments", "manage_departments"],
  ["/dashboard/hr/staff-list", "manage_staff"],
  ["/dashboard/hr/workflows", "manage_workflows"],
  ["/dashboard/hr/staff-roles", "manage_staff_roles"],
  ["/dashboard/hr/leave-report", "leave_report"],
  ["/dashboard/approval-requests/history", "supervisor_history"],
  ["/dashboard/approval-requests/hr", "hr_approval"],
  ["/dashboard/approval-requests", "supervisor_approval"],
  ["/dashboard/leave-request", "leave_request"],
  ["/dashboard/leave-history", "leave_history"],
  ["/dashboard/leave-details", "leave_details"],
];

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
