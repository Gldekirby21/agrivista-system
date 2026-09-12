import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import { updateCrop, archiveCrop } from "@/features/rsbsa/lib/beneficiaryMutations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const cropId = parseInt(id, 10);
  if (isNaN(cropId)) {
    return NextResponse.json({ error: "Invalid crop ID" }, { status: 400 });
  }

  const crop = await prisma.crop.findUnique({
    where: { id: cropId },
  });

  if (!crop) {
    return NextResponse.json({ error: "Crop not found" }, { status: 404 });
  }

  return NextResponse.json(crop);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id } = await params;
  const cropId = parseInt(id, 10);
  if (isNaN(cropId)) {
    return NextResponse.json({ error: "Invalid crop ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updated = await updateCrop(cropId, body, session.id, session.role);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update crop" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id } = await params;
  const cropId = parseInt(id, 10);
  if (isNaN(cropId)) {
    return NextResponse.json({ error: "Invalid crop ID" }, { status: 400 });
  }

  try {
    const archived = await archiveCrop(cropId, session.id, session.role);
    return NextResponse.json(archived);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to archive crop" }, { status: 400 });
  }
}
