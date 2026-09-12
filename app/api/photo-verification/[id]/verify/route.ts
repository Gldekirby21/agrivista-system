import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import {
  extractAndVerifyPhoto,
  VerificationOptionsSchema,
} from "@/features/photo-verification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
  }

  try {
    let options: any = {};
    try {
      const body = await req.json();
      options = {
        ...VerificationOptionsSchema.partial().parse(body),
        base64Data: body.base64Data,
      };
    } catch {
      // Body may be empty to run verification using existing record data
    }

    const updated = await extractAndVerifyPhoto(id, options, session.id, session.role);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to execute deterministic verification" },
      { status: 400 }
    );
  }
}
