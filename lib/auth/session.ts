import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserSession } from "@/types/auth";

export const SESSION_COOKIE_NAME = "omag_session_token";

// Session token valid duration: 24 hours (86,400 seconds)
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "omag-polomolok-dev-secret-key-2026-super-secure-token"
);

/**
 * Sign a new JWT session token
 */
export async function signSessionToken(payload: UserSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

/**
 * Verify and decode an incoming JWT session token
 */
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      username: payload.username as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      role: payload.role as UserSession["role"],
    };
  } catch {
    return null;
  }
}

/**
 * Retrieve current user session from request cookies (Server Components & Route Handlers)
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Sets the secure session cookie on the response
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clears / invalidates the session cookie upon logout
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Ensures user has an active session with one of the allowed roles, redirecting otherwise
 */
export async function requireRole(allowedRoles: UserSession["role"][]): Promise<UserSession> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  if (!allowedRoles.includes(session.role)) {
    redirect("/login");
  }
  return session;
}

