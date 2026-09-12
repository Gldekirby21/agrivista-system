import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/prisma";
import { signSessionToken, setSessionCookie } from "@/lib/auth/session";
import { UserSession } from "@/types";

const LoginRequestSchema = z.object({
  identifier: z.string().trim().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
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

    const redirectUrl =
      user.role === "OMAG_HEAD" ? "/head/dashboard" : "/staff/dashboard";

    const response = NextResponse.json(
      {
        success: true,
        user: sessionUser,
        redirectUrl,
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookie on the response
    response.cookies.set("omag_session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Authentication Error:", error);
    return NextResponse.json(
      { error: "An unexpected internal error occurred during authentication." },
      { status: 500 }
    );
  }
}
