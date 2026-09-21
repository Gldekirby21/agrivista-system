// ==============================================================================
// API Route: /api/inventory/batches
// GET: Query Inventory Batches (Staff & Head)
// POST: Receive New Batch (Staff Only)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import {
  getInventoryBatches,
  createInventoryBatch,
  CreateInventoryBatchSchema,
  QueryBatchSchema,
} from "@/features/inventory";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const parsed = QueryBatchSchema.safeParse({
    itemId: searchParams.get("itemId") || undefined,
    category: searchParams.get("category") || undefined,
    status: searchParams.get("status") || undefined,
    search: searchParams.get("search") || undefined,
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("limit") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const result = await getInventoryBatches(parsed.data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/inventory/batches error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve batches", message: error.message },
      { status: 500 }
    );
  }
}

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

  const parsed = CreateInventoryBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const batch = await createInventoryBatch(parsed.data, auth.session);
    return NextResponse.json(batch, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/inventory/batches error:", error);
    return NextResponse.json(
      { error: "Failed to create batch", message: error.message },
      { status: 400 }
    );
  }
}
