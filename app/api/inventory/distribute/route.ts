// ==============================================================================
// API Route: /api/inventory/distribute
// POST: Execute Atomic FIFO Distribution Transaction (Staff Only)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { executeDistribution, DistributeStockSchema } from "@/features/inventory";

export async function POST(req: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const parsed = DistributeStockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const result = await executeDistribution(parsed.data, auth.session);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/inventory/distribute error:", error);
    return NextResponse.json(
      { error: "Distribution transaction rejected", message: error.message },
      { status: 400 }
    );
  }
}
