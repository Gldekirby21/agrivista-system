// ==============================================================================
// API Route: /api/inventory/distributions
// GET: Query Distribution Ledger History (Staff & Head)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions/guards";
import { getDistributions } from "@/features/inventory";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const itemIdParam = searchParams.get("itemId");
  const farmerIdParam = searchParams.get("farmerId");
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const itemId = itemIdParam ? parseInt(itemIdParam, 10) : undefined;
  const farmerId = farmerIdParam ? parseInt(farmerIdParam, 10) : undefined;

  try {
    const result = await getDistributions({ itemId, farmerId, search, page, limit });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/inventory/distributions error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve distributions", message: error.message },
      { status: 500 }
    );
  }
}
