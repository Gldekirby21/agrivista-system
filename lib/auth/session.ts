import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserSession } from "@/types/auth";

export const SESSION_COOKIE_NAME = "omag_session_token";

// Session token valid duration: 24 hours (86,400 seconds)
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

/**
 * Resolves the JWT signing and verification secret securely.
 * - In production: strictly requires process.env.AUTH_SECRET; throws clear error if absent.
 * - In non-production (development/test): uses process.env.AUTH_SECRET if provided;
 *   otherwise falls back to an isolated development secret.
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (secret && secret.trim().length > 0) {
    return new TextEncoder().encode(secret.trim());
  }

  if (isProduction) {
    throw new Error(
      "[FATAL SECURITY CONFIGURATION ERROR] AUTH_SECRET environment variable is missing in production runtime. Cannot sign or verify authentication tokens without a secure key."
    );
  }

  return new TextEncoder().encode("omag-polomolok-dev-secret-key-2026-super-secure-token");
}

/**
 * Sign a new JWT session token
 */
export async function signSessionToken(payload: UserSession): Promise<string> {
  const secret = getJwtSecret();
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

/**
 * Verify and decode an incoming JWT session token
 */
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
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

