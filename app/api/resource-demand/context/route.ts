// ==============================================================================
// API Route: /api/resource-demand/context
// GET: Retrieve Current RSBSA Agricultural Context for Barangay & Crop
// Role: Authenticated (Staff & Head)
// Objective 1 Read-Only Bridging for Objective 5 Planning Inputs
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { getRsbsaContext } from "@/features/resource-demand";

export async function GET(req: NextRequest) {
  // Historical Crop Yield & Purchase Modeling is exclusive to OMAG_HEAD
  const auth = await requireRole(["OMAG_HEAD"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const barangay = searchParams.get("barangay") || "Poblacion";
  const cropType = searchParams.get("cropType") || undefined;

  try {
    const context = await getRsbsaContext(barangay, cropType);
    return NextResponse.json(context);
  } catch (error: any) {
    console.error("GET /api/resource-demand/context error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve RSBSA context", message: error.message },
      { status: 500 }
    );
  }
}
