// ==============================================================================
// API Route: /api/inventory
// GET: Query Inventory Items (Staff & Head)
// POST: Create Catalog Item (Staff Only)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import {
  getInventoryItems,
  createInventoryItem,
  CreateInventoryItemSchema,
  QueryInventorySchema,
} from "@/features/inventory";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const parsed = QueryInventorySchema.safeParse({
    category: searchParams.get("category") || undefined,
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
    const result = await getInventoryItems(parsed.data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve inventory items", message: error.message },
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

  const parsed = CreateInventoryItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const createdItem = await createInventoryItem(parsed.data, auth.session);
    return NextResponse.json(createdItem, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item", message: error.message },
      { status: 400 }
    );
  }
}
