import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { recalculateAllPriorities } from "@/features/pcic/services/pcicService";

/**
 * POST /api/pcic/priority/recalculate
 * OMAG_HEAD triggers cohort-wide recalculation of priority scores and rank positions.
 * Claim Priority Ranking is assigned to OMAG_HEAD per approved role assignments.
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(["OMAG_HEAD"], request);
  if (!auth.authorized) return auth.response;

  try {
    const result = await recalculateAllPriorities(
      auth.session.id,
      auth.session.role
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/pcic/priority/recalculate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to recalculate priorities" },
      { status: 500 }
    );
  }
}
