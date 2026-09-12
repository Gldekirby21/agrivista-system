import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { recordCrop } from "@/features/rsbsa/lib/mutations";

/**
 * POST /api/rsbsa/parcels/[id]/crops
 * Staff-only endpoint to record or update a crop on a farm parcel
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["OMAG_STAFF"], request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const parcelId = parseInt(id, 10);
    if (isNaN(parcelId)) {
      return NextResponse.json(
        { success: false, error: "Invalid parcel ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const crop = await recordCrop(
      { ...body, parcelId },
      auth.session.id,
      auth.session.role
    );

    return NextResponse.json({ success: true, crop }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/rsbsa/parcels/[id]/crops error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to record crop" },
      { status: 400 }
    );
  }
}
