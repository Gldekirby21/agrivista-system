import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { getDistributionRequestById } from "@/features/inventory/services/distributionRequestService";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/inventory/requests/[id]
 * Retrieves a single distribution request.
 */
export async function GET(req: NextRequest, { params }: RouteProps) {
  const auth = await requireRole(["OMAG_HEAD", "OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const request = await getDistributionRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Distribution request not found" }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error: any) {
    console.error("GET /api/inventory/requests/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch request" }, { status: 500 });
  }
}
