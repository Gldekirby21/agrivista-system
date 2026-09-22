// ==============================================================================
// API Route: /api/resource-demand/historical
// GET: Query Historical Agricultural Data (Staff & Head)
// POST: Create Historical Record (Staff Only)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import {
  getHistoricalData,
  createHistoricalData,
  CreateHistoricalDataSchema,
  HistoricalQuerySchema,
} from "@/features/resource-demand";

export async function GET(req: NextRequest) {
  // Historical Crop Yield & Purchase Modeling is exclusive to OMAG_HEAD
  const auth = await requireRole(["OMAG_HEAD"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const parsed = HistoricalQuerySchema.safeParse({
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("limit") || undefined,
    barangay: searchParams.get("barangay") || undefined,
    cropType: searchParams.get("cropType") || undefined,
    year: searchParams.get("year") || undefined,
    season: searchParams.get("season") || undefined,
    status: searchParams.get("status") || "ACTIVE",
    search: searchParams.get("search") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const result = await getHistoricalData(parsed.data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/resource-demand/historical error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve historical data", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Method Not Allowed",
      message: "Objective 5 (Historical Crop Yield & Purchase Modeling) is strictly VIEW-ONLY per the approved FDD. Historical data creation is disabled.",
    },
    { status: 405 }
  );
}
