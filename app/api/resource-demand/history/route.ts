// ==============================================================================
// API Route: /api/resource-demand/history
// GET: Retrieve Historical Generated Forecasts (Staff & Head)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { getForecastHistory } from "@/features/resource-demand";

export async function GET(req: NextRequest) {
  // Historical Crop Yield & Purchase Modeling is exclusive to OMAG_HEAD
  const auth = await requireRole(["OMAG_HEAD"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const barangay = searchParams.get("barangay") || undefined;
  const cropType = searchParams.get("cropType") || undefined;
  const yearStr = searchParams.get("year");
  const year = yearStr ? parseInt(yearStr, 10) : undefined;
  const limitStr = searchParams.get("limit");
  const limit = limitStr ? parseInt(limitStr, 10) : 25;

  try {
    const history = await getForecastHistory({ barangay, cropType, year, limit });
    return NextResponse.json(history);
  } catch (error: any) {
    console.error("GET /api/resource-demand/history error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve forecast history", message: error.message },
      { status: 500 }
    );
  }
}
