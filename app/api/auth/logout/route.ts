import { NextResponse } from "next/server";
import { getCurrentSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/auditLog";

export async function POST(request?: Request) {
  try {
    const ipAddress =
      request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request?.headers.get("x-real-ip") ||
      null;

    // Check if an authenticated user session is active to record the logout
    const session = await getCurrentSession();
    if (session) {
      await logAuditEvent({
        userId: session.id,
        roleSnapshot: session.role,
        action: "LOGOUT",
        module: "AUTH",
        recordId: session.id,
        previousValues: null,
        newValues: {
          username: session.username,
          role: session.role,
        },
        ipAddress,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully.",
      },
      { status: 200 }
    );

    // Clear session cookie with Max-Age 0
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json(
      { error: "Failed to invalidate session." },
      { status: 500 }
    );
  }
}
