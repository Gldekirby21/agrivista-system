import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import {
  createPhotoVerification,
  PhotoUploadSchema,
} from "@/features/photo-verification";

export async function POST(req: NextRequest) {
  // Photo verification upload is strictly restricted to OMAG_STAFF.
  // OMAG_HEAD review gate is isolated; Head direct calls must return 403 Forbidden.
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = await req.json();
    const validated = PhotoUploadSchema.parse(body);

    const record = await createPhotoVerification(validated, session.id, session.role);
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create photo verification record" },
      { status: 400 }
    );
  }
}
