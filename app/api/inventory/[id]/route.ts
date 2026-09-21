// ==============================================================================
// API Route: /api/inventory/[id]
// GET: Item Detail (Staff & Head)
// PATCH: Update Item (Staff Only)
// DELETE: Soft Archive Item (Staff Only)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import {
  getInventoryItemById,
  updateInventoryItem,
  archiveInventoryItem,
  UpdateInventoryItemSchema,
} from "@/features/inventory";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const itemId = parseInt(id, 10);
  if (isNaN(itemId) || itemId <= 0) {
    return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
  }

  try {
    const item = await getInventoryItemById(itemId);
    if (!item) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error: any) {
    console.error("GET /api/inventory/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve inventory item", message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const itemId = parseInt(id, 10);
  if (isNaN(itemId) || itemId <= 0) {
    return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const parsed = UpdateInventoryItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const updated = await updateInventoryItem(itemId, parsed.data, auth.session);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/inventory/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item", message: error.message },
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
  const itemId = parseInt(id, 10);
  if (isNaN(itemId) || itemId <= 0) {
    return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
  }

  try {
    await archiveInventoryItem(itemId, auth.session);
    return NextResponse.json({ success: true, message: "Inventory item archived successfully." });
  } catch (error: any) {
    console.error("DELETE /api/inventory/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to archive inventory item", message: error.message },
      { status: 400 }
    );
  }
}
