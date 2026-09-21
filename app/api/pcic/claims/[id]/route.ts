import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { UpdatePcicClaimSchema } from "@/features/pcic/validation/schemas";
import {
  getPcicClaimById,
  updatePcicClaim,
} from "@/features/pcic/services/pcicService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/pcic/claims/[id]
 * Retrieves comprehensive case dossier including farmer, land, assessment, priority, and audit logs.
 * Accessible to OMAG_STAFF and OMAG_HEAD.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF", "OMAG_HEAD"], request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const claim = await getPcicClaimById(id);

    if (!claim) {
      return NextResponse.json(
        { error: `PCIC Claim ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(claim);
  } catch (error: any) {
    console.error(`GET /api/pcic/claims/[id] error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve claim details" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pcic/claims/[id]
 * Staff updates operational damage data or field assessment.
 * Strictly restricted to OMAG_STAFF.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = UpdatePcicClaimSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updatePcicClaim(
      id,
      validated.data,
      auth.session.id,
      auth.session.role
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`PATCH /api/pcic/claims/[id] error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to update claim" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/pcic/claims/[id]
 * Staff deletes a crop-loss claim docket and associated damage report.
 * Re-ranks cohort priority rankings.
 * Strictly restricted to OMAG_STAFF.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const { deletePcicClaim } = await import("@/features/pcic/services/pcicService");
    const result = await deletePcicClaim(id, auth.session.id, auth.session.role);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`DELETE /api/pcic/claims/[id] error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to delete claim" },
      { status: 400 }
    );
  }
}
