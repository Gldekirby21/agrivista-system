// ==============================================================================
// API Route: /api/resource-demand/train
// POST: Train Seed & Fertilizer Regression Models (Staff Only)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import {
  trainResourceDemandModels,
  TrainModelRequestSchema,
} from "@/features/resource-demand";

export async function POST(req: NextRequest) {
  // Objective 5 / Rule 21: Model training execution is assigned to OMAG_HEAD
  const auth = await requireRole(["OMAG_HEAD"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  let body: any = {};
  try {
    const text = await req.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const parsed = TrainModelRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const summary = await trainResourceDemandModels(
      parsed.data,
      auth.session.id,
      auth.session.role
    );
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("POST /api/resource-demand/train error:", error);
    return NextResponse.json(
      { error: "Model training failed", message: error.message },
      { status: 400 }
    );
  }
}
