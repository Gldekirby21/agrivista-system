import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { getPriorityLeaderboard } from "@/features/pcic/services/pcicService";

/**
 * GET /api/pcic/priority
 * Retrieves ranked priority leaderboard for OMAG case monitoring.
 * Accessible to OMAG_STAFF and OMAG_HEAD.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF", "OMAG_HEAD"], request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 25;

    const leaderboard = await getPriorityLeaderboard(limit);
    return NextResponse.json({
      leaderboard,
      classification: "🟡 PROPOSED SYSTEM DESIGN",
      notice:
        "Deterministic prioritization scores are advisory tools to assist OMAG monitoring and case coordination with PCIC focal persons. They do NOT constitute official PCIC insurance adjudication.",
    });
  } catch (error: any) {
    console.error("GET /api/pcic/priority error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve priority leaderboard" },
      { status: 500 }
    );
  }
}
