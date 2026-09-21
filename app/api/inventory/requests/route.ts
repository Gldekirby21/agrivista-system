import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import {
  createDistributionRequest,
  getDistributionRequests,
} from "@/features/inventory/services/distributionRequestService";
import {
  CreateDistributionRequestSchema,
  QueryDistributionRequestSchema,
} from "@/features/inventory/validation/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/inventory/requests
 * Lists distribution requests with optional filters (status, barangay, itemId, search).
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["OMAG_HEAD", "OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = {
      status: (searchParams.get("status") as any) || "ALL",
      barangay: searchParams.get("barangay") || undefined,
      itemId: searchParams.get("itemId") ? Number(searchParams.get("itemId")) : undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    const validated = QueryDistributionRequestSchema.parse(query);
    const result = await getDistributionRequests(validated);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/inventory/requests error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch requests" }, { status: 500 });
  }
}

/**
 * POST /api/inventory/requests
 * Creates a new distribution request in PENDING status.
 * Does not deduct inventory. Does not execute FIFO.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF", "OMAG_HEAD"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const validated = CreateDistributionRequestSchema.parse(body);
    const result = await createDistributionRequest(validated, auth.session);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/inventory/requests error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create distribution request" },
      { status: 400 }
    );
  }
}
