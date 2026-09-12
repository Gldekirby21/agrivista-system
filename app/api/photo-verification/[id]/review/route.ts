import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import {
  submitSystemReview,
  SystemReviewSchema,
} from "@/features/photo-verification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  // Staff and Head can submit municipal system review notes
  const auth = await requireRole(["OMAG_STAFF", "OMAG_HEAD"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const validated = SystemReviewSchema.parse(body);

    const updated = await submitSystemReview(id, validated, session.id, session.role);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit system review" },
      { status: 400 }
    );
  }
}
