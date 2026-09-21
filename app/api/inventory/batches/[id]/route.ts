// ==============================================================================
// API Route: /api/inventory/batches/[id]
// PATCH: Update Batch Details (Staff Only)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { updateInventoryBatch, archiveInventoryBatch, UpdateInventoryBatchSchema } from "@/features/inventory";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const parsed = UpdateInventoryBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const updated = await updateInventoryBatch(id, parsed.data, auth.session);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/inventory/batches/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update batch", message: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
  }

  try {
    await archiveInventoryBatch(id, auth.session);
    return NextResponse.json({ success: true, message: "Inventory batch archived successfully." });
  } catch (error: any) {
    console.error("DELETE /api/inventory/batches/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to archive inventory batch", message: error.message },
      { status: 400 }
    );
  }
}
