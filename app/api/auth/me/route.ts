import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions/guards";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  return NextResponse.json({
    authenticated: true,
    user: auth.session,
  });
}
