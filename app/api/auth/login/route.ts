import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/prisma";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/auditLog";
import { UserSession } from "@/types";

const LoginRequestSchema = z.object({
  identifier: z.string().trim().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    const body = await request.json();

    // Map username/email if passed in place of identifier
    const payload = {
      identifier: body.identifier || body.username || body.email || "",
      password: body.password || "",
    };

    const parsed = LoginRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed. Both username/email and password are required.",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;

    // Search user by username or email (Active users only)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: "insensitive" } },
          { email: { equals: identifier, mode: "insensitive" } },
        ],
        isActive: true,
      },
    });

    // Uniform timing-safe failure response to prevent user enumeration
    if (!user) {
      await logAuditEvent({
        userId: null,
        roleSnapshot: null,
        action: "LOGIN_FAILED",
        module: "AUTH",
        recordId: null,
        previousValues: null,
        newValues: {
          attemptedIdentifier: identifier,
          reason: "INVALID_CREDENTIALS",
        },
        ipAddress,
      });

      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await logAuditEvent({
        userId: user.id,
        roleSnapshot: user.role,
        action: "LOGIN_FAILED",
        module: "AUTH",
        recordId: user.id,
        previousValues: null,
        newValues: {
          attemptedIdentifier: identifier,
          reason: "INVALID_CREDENTIALS",
        },
        ipAddress,
      });

      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // Build session payload (strictly excluding passwordHash)
    const sessionUser: UserSession = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    // Sign JWT session token
    const token = await signSessionToken(sessionUser);

    // Record successful authentication audit event
    await logAuditEvent({
      userId: user.id,
      roleSnapshot: user.role,
      action: "LOGIN_SUCCESS",
      module: "AUTH",
      recordId: user.id,
      previousValues: null,
      newValues: {
        username: user.username,
        role: user.role,
      },
      ipAddress,
    });

    const redirectUrl =
      user.role === "OMAG_HEAD" ? "/head/dashboard" : "/staff/beneficiaries";

    const response = NextResponse.json(
      {
        success: true,
        user: sessionUser,
        redirectUrl,
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookie on the response
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error: any) {
    console.error("Authentication Error:", error);
    return NextResponse.json(
      {
        error: error?.message || "An unexpected internal error occurred during authentication.",
      },
      { status: 500 }
    );
  }
}
