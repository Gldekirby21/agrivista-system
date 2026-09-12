import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { addFarmAndParcel } from "@/features/rsbsa/lib/mutations";

/**
 * POST /api/rsbsa/farmers/[id]/farms
 * Staff-only endpoint to register a farm and parcel for a farmer
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
    const farmerId = parseInt(id, 10);
    if (isNaN(farmerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid farmer ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const farm = await addFarmAndParcel(
      farmerId,
      body,
      auth.session.id,
      auth.session.role
    );

    return NextResponse.json({ success: true, farm }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/rsbsa/farmers/[id]/farms error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create farm landholding" },
      { status: 400 }
    );
  }
}
