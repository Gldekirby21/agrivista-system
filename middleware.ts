import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "omag_session_token";
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "omag-polomolok-dev-secret-key-2026-super-secure-token"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let session: { role: "OMAG_HEAD" | "OMAG_STAFF" } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = { role: payload.role as "OMAG_HEAD" | "OMAG_STAFF" };
    } catch {
      session = null;
    }
  }

  // 1. Unauthenticated attempts to access protected dashboard routes
  if (pathname.startsWith("/head") || pathname.startsWith("/staff")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Role restriction: OMAG_STAFF attempting /head/*
    if (pathname.startsWith("/head") && session.role !== "OMAG_HEAD") {
      const staffUrl = new URL("/staff/dashboard", request.url);
      return NextResponse.redirect(staffUrl);
    }

    // 3. Role restriction: OMAG_HEAD attempting /staff/*
    if (pathname.startsWith("/staff") && session.role !== "OMAG_STAFF") {
      const headUrl = new URL("/head/dashboard", request.url);
      return NextResponse.redirect(headUrl);
    }
  }

  // 4. Authenticated user visiting /login
  if (pathname === "/login" && session) {
    const targetUrl = new URL(
      session.role === "OMAG_HEAD" ? "/head/dashboard" : "/staff/dashboard",
      request.url
    );
    return NextResponse.redirect(targetUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/head/:path*",
    "/staff/:path*",
    "/login",
  ],
};
