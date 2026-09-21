import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { executeApprovedDistribution } from "@/features/inventory/services/distributionRequestService";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/inventory/requests/[id]/distribute
 * Executes FIFO inventory distribution for an APPROVED request.
 * Atomically deducts inventory from oldest eligible batches and creates DistributionRecords.
 * Updates request status to DISTRIBUTED.
 */
export async function POST(req: NextRequest, { params }: RouteProps) {
  const auth = await requireRole(["OMAG_STAFF", "OMAG_HEAD"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const result = await executeApprovedDistribution(id, auth.session);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/inventory/requests/[id]/distribute error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute distribution" },
      { status: 400 }
    );
  }
}
