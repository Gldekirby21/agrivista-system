import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import {
  CreatePcicClaimSchema,
  ClaimQuerySchema,
} from "@/features/pcic/validation/schemas";
import {
  getPcicClaims,
  createPcicClaim,
} from "@/features/pcic/services/pcicService";

/**
 * GET /api/pcic/claims
 * Retrieves paginated list of PCIC claims with priority rankings.
 * Accessible to OMAG_STAFF and OMAG_HEAD.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF", "OMAG_HEAD"], request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const queryObj = Object.fromEntries(searchParams.entries());
    const validated = ClaimQuerySchema.safeParse(queryObj);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const result = await getPcicClaims(validated.data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/pcic/claims error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve PCIC claims" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pcic/claims
 * Staff creates a new crop loss report and registers a PCIC monitoring case.
 * Strictly restricted to OMAG_STAFF.
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF"], request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const validated = CreatePcicClaimSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const claim = await createPcicClaim(
      validated.data,
      auth.session.id,
      auth.session.role
    );

    return NextResponse.json(claim, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/pcic/claims error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create PCIC claim record" },
      { status: 400 }
    );
  }
}
