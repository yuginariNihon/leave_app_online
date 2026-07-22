import { randomBytes, createHash } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const SESSION_COOKIE_NAME = "leave_app_db_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionUser = {
  userId: string;
  staffId: string;
  staffCode: string;
  name: string;
  email: string;
  roles: string[];
  forceChangePassword: boolean;
  expiresAt: number;
};

type CreateSessionInput = Omit<SessionUser, "expiresAt">;

/**
 * Creates a stateful session in the database and stores the session token in cookies.
 */
export async function createSession(user: CreateSessionInput) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  
  // Extract client IP and User-Agent for security audit
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || undefined;
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || undefined;

  // Save session record to database (store SHA-256 hash only)
  await prisma.session.create({
    data: {
      user_id: user.userId,
      token: hashToken(token),
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Retrieves the session from the database based on the cookie token.
 * Uses React.cache() so multiple calls within the same render pass return the same result.
 */
async function getSessionUserImpl(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const hashedToken = hashToken(token);
    let session = await prisma.session.findUnique({
      where: { token: hashedToken },
      include: {
        user: {
          include: {
            staff: true,
          },
        },
      },
    });

    // Migration fallback: try plaintext token lookup for pre-hashing sessions
    if (!session) {
      session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              staff: true,
            },
          },
        },
      });
      if (session) {
        // Migrate to hashed token
        await prisma.session.update({
          where: { session_id: session.session_id },
          data: { token: hashedToken },
        }).catch(() => {});
      }
    }

    if (!session) {
      return null;
    }

    // Check expiration
    if (session.expires_at.getTime() < Date.now()) {
      // Clean up expired session asynchronously
      await prisma.session.delete({ where: { session_id: session.session_id } }).catch(() => {});
      return null;
    }

    const staffRoles = await prisma.staffRole.findMany({
      where: { staff_id: session.user.staff.staff_id },
      include: { role: { select: { role_name: true } } },
    });

    return {
      userId: session.user_id,
      staffId: session.user.staff.staff_id,
      staffCode: session.user.staff.staff_code,
      name: session.user.staff.name,
      email: session.user.email ?? "",
      roles: staffRoles.map((sr) => sr.role.role_name.toUpperCase()),
      forceChangePassword: session.user.force_change_password,
      expiresAt: session.expires_at.getTime(),
    };
  } catch (error) {
    console.error("Error in getSessionUser:", error);
    return null;
  }
}

export const getSessionUser = cache(getSessionUserImpl);

/**
 * Requires a session user to be logged in, otherwise redirects to the login page.
 */
export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Deletes the session from the database and removes the session cookie.
 */
export async function deleteSession() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await prisma.session.deleteMany({
        where: { token: hashToken(token) },
      });
    } catch (error) {
      console.error("Error deleting session from DB:", error);
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
