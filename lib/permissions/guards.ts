import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentSession, verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { UserRole, UserSession } from "@/types";

export type GuardResult =
  | { authorized: true; session: UserSession }
  | { authorized: false; response: NextResponse };

/**
 * Extracts a session token from an optional Request object or from next/headers cookies.
 */
async function resolveSession(request?: Request): Promise<UserSession | null> {
  // First try resolving via Server Component cookies
  const serverSession = await getCurrentSession();
  if (serverSession) return serverSession;

  // If inside a Route Handler with a Request object, parse from Cookie header
  if (request) {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

    if (match) {
      const token = match.substring(`${SESSION_COOKIE_NAME}=`.length);
      return await verifySessionToken(token);
    }
  }

  return null;
}

/**
 * Backend API Route Guard: Ensures the incoming request is authenticated.
 */
export async function requireAuth(request?: Request): Promise<GuardResult> {
  const session = await resolveSession(request);
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized. Authentication session required." },
        { status: 401 }
      ),
    };
  }
  return { authorized: true, session };
}

/**
 * Backend API Route Guard: Ensures the request is authenticated and has one of the allowed roles.
 * Client-supplied roles are ignored; the role is extracted strictly from the verified session.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  request?: Request
): Promise<GuardResult> {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth;
  }

  if (!allowedRoles.includes(auth.session.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: `Forbidden. Role '${auth.session.role}' is not authorized to access this resource.`,
        },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Server Component / Layout Guard:
 * Enforces role segregation for page navigation.
 * - If not authenticated: Redirects to /login
 * - If authenticated with the wrong role: Redirects to their authorized role dashboard
 * - If authorized: Returns the valid UserSession
 */
export async function assertRoleAccess(allowedRole: UserRole): Promise<UserSession> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== allowedRole) {
    // Prevent unauthorized role crossing by redirecting to user's assigned dashboard
    if (session.role === "OMAG_HEAD") {
      redirect("/head/dashboard");
    } else if (session.role === "OMAG_STAFF") {
      redirect("/staff/beneficiaries");
    } else {
      redirect("/login");
    }
  }

  return session;
}
