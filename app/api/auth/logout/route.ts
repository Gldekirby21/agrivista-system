import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully.",
      },
      { status: 200 }
    );

    // Clear session cookie with Max-Age 0
    response.cookies.set("omag_session_token", "", {
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
