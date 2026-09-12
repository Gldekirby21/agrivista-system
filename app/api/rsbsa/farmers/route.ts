import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { getFarmers } from "@/features/rsbsa/lib/queries";
import { createFarmer } from "@/features/rsbsa/lib/mutations";

/**
 * GET /api/rsbsa/farmers
 * Authenticated endpoint to search and filter RSBSA farmers
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const barangay = searchParams.get("barangay") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 15;

    const result = await getFarmers({ search, barangay, page, limit });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("GET /api/rsbsa/farmers error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch farmers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rsbsa/farmers
 * Staff-only endpoint to enroll a new RSBSA farmer
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF"], request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const farmer = await createFarmer(
      body,
      auth.session.id,
      auth.session.role
    );
    return NextResponse.json({ success: true, farmer }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/rsbsa/farmers error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create farmer" },
      { status: 400 }
    );
  }
}
