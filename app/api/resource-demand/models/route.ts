// ==============================================================================
// API Route: /api/resource-demand/models
// GET: Retrieve Active Resource Demand ML Models & Metrics (Staff & Head)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { getActiveResourceModels } from "@/features/resource-demand";

export async function GET(req: NextRequest) {
  // Historical Crop Yield & Purchase Modeling is exclusive to OMAG_HEAD
  const auth = await requireRole(["OMAG_HEAD"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const models = await getActiveResourceModels();
    return NextResponse.json(models);
  } catch (error: any) {
    console.error("GET /api/resource-demand/models error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve resource demand models", message: error.message },
      { status: 500 }
    );
  }
}
