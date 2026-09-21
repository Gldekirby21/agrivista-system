// ==============================================================================
// API Route: /api/inventory/fifo
// POST: Preview Deterministic FIFO Allocation (Staff & Head)
// Strictly Read-Only Computation — No Database Mutations
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions/guards";
import { previewFifoAllocation, FifoPreviewSchema } from "@/features/inventory";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const parsed = FifoPreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const preview = await previewFifoAllocation(
      parsed.data.itemId,
      parsed.data.requestedQuantity
    );
    return NextResponse.json(preview);
  } catch (error: any) {
    console.error("POST /api/inventory/fifo error:", error);
    return NextResponse.json(
      { error: "Failed to calculate FIFO preview", message: error.message },
      { status: 400 }
    );
  }
}
