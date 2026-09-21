import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { linkPhotoToDamageReport } from "@/features/photo-verification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Photo verification ID is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const damageReportId =
      body.damageReportId === null || body.damageReportId === undefined
        ? null
        : Number(body.damageReportId);

    if (damageReportId !== null && (isNaN(damageReportId) || damageReportId <= 0)) {
      return NextResponse.json(
        { error: "Invalid damageReportId provided. Must be a positive integer or null." },
        { status: 400 }
      );
    }

    const updated = await linkPhotoToDamageReport(
      id,
      damageReportId,
      auth.session.id,
      auth.session.role
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    const message = error?.message || "Failed to update claim link";
    const status = message.includes("not found")
      ? 404
      : message.includes("Mismatched")
      ? 400
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
