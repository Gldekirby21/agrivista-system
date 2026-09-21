import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { TrainModelInputSchema } from "@/features/yield-loss/validation/schemas";
import { trainCropYieldModel } from "@/features/yield-loss/services/predictionService";

export async function POST(req: NextRequest) {
  const auth = await requireRole(["OMAG_HEAD", "OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = await req.json().catch(() => ({}));
    const validated = TrainModelInputSchema.parse(body);
    const result = await trainCropYieldModel(validated, session.id, session.role);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to train crop yield model" },
      { status: 400 }
    );
  }
}
