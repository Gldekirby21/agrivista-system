import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";

/**
 * Protected test endpoint requiring OMAG_HEAD authorization.
 * Used for automated verification of server-side role guard enforcement.
 */
export async function GET(request: Request) {
  const auth = await requireRole(["OMAG_HEAD"], request);
  if (!auth.authorized) {
    return auth.response;
  }

  return NextResponse.json({
    access: "granted",
    message: "Executive access confirmed.",
    user: auth.session,
  });
}
