import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import { updateFarmParcel, archiveFarmParcel } from "@/features/rsbsa/lib/beneficiaryMutations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const parcelId = parseInt(id, 10);
  if (isNaN(parcelId)) {
    return NextResponse.json({ error: "Invalid parcel ID" }, { status: 400 });
  }

  const parcel = await prisma.farmParcel.findUnique({
    where: { id: parcelId },
    include: {
      crops: {
        where: { status: { not: "Archived" } },
      },
    },
  });

  if (!parcel) {
    return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
  }

  return NextResponse.json(parcel);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id } = await params;
  const parcelId = parseInt(id, 10);
  if (isNaN(parcelId)) {
    return NextResponse.json({ error: "Invalid parcel ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updated = await updateFarmParcel(parcelId, body, session.id, session.role);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update parcel" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id } = await params;
  const parcelId = parseInt(id, 10);
  if (isNaN(parcelId)) {
    return NextResponse.json({ error: "Invalid parcel ID" }, { status: 400 });
  }

  try {
    const archived = await archiveFarmParcel(parcelId, session.id, session.role);
    return NextResponse.json(archived);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to archive parcel" }, { status: 400 });
  }
}
