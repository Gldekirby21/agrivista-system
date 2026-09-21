import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { reviewDistributionRequest } from "@/features/inventory/services/distributionRequestService";
import { ReviewDistributionRequestSchema } from "@/features/inventory/validation/schemas";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/inventory/requests/[id]/review
 * OMAG Head approval gate for distribution requests.
 * Approves (APPROVED) or rejects (REJECTED) request.
 * Does not deduct inventory. Does not execute FIFO.
 */
export async function POST(req: NextRequest, { params }: RouteProps) {
  const auth = await requireRole(["OMAG_HEAD"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const validated = ReviewDistributionRequestSchema.parse(body);
    const updated = await reviewDistributionRequest(id, validated, auth.session);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("POST /api/inventory/requests/[id]/review error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to review distribution request" },
      { status: 400 }
    );
  }
}
