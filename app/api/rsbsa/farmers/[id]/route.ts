import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { getFarmerById } from "@/features/rsbsa/lib/queries";
import { updateFarmer } from "@/features/rsbsa/lib/mutations";

/**
 * GET /api/rsbsa/farmers/[id]
 * Authenticated endpoint to retrieve full farmer details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const farmerId = parseInt(id, 10);
    if (isNaN(farmerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid farmer ID format" },
        { status: 400 }
      );
    }

    const farmer = await getFarmerById(farmerId);
    if (!farmer) {
      return NextResponse.json(
        { success: false, error: `Farmer record ${farmerId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, farmer });
  } catch (error: any) {
    console.error("GET /api/rsbsa/farmers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to retrieve farmer" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rsbsa/farmers/[id]
 * Staff-only endpoint to update an existing farmer profile
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["OMAG_STAFF"], request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const farmerId = parseInt(id, 10);
    if (isNaN(farmerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid farmer ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updated = await updateFarmer(
      farmerId,
      body,
      auth.session.id,
      auth.session.role
    );

    return NextResponse.json({ success: true, farmer: updated });
  } catch (error: any) {
    console.error("PUT /api/rsbsa/farmers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update farmer" },
      { status: 400 }
    );
  }
}
