// ==============================================================================
// API Route: /api/resource-demand/forecast
// POST: Generate & Persist Resource Demand Forecast (Staff Only)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import {
  generateResourceDemandForecast,
  GenerateForecastSchema,
} from "@/features/resource-demand";

export async function POST(req: NextRequest) {
  // Historical Crop Yield & Purchase Modeling is exclusive to OMAG_HEAD
  const auth = await requireRole(["OMAG_HEAD"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const parsed = GenerateForecastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const result = await generateResourceDemandForecast(
      parsed.data,
      auth.session.id,
      auth.session.role
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/resource-demand/forecast error:", error);
    return NextResponse.json(
      { error: "Forecast generation failed", message: error.message },
      { status: 500 }
    );
  }
}
