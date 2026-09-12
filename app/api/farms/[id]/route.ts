import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import { updateFarm, archiveFarm } from "@/features/rsbsa/lib/beneficiaryMutations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const farmId = parseInt(id, 10);
  if (isNaN(farmId)) {
    return NextResponse.json({ error: "Invalid farm ID" }, { status: 400 });
  }

  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      parcels: {
        where: { status: { not: "Archived" } },
        include: { crops: { where: { status: { not: "Archived" } } } },
      },
    },
  });

  if (!farm) {
    return NextResponse.json({ error: "Farm not found" }, { status: 404 });
  }

  return NextResponse.json(farm);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id } = await params;
  const farmId = parseInt(id, 10);
  if (isNaN(farmId)) {
    return NextResponse.json({ error: "Invalid farm ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updated = await updateFarm(farmId, body, session.id, session.role);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update farm" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id } = await params;
  const farmId = parseInt(id, 10);
  if (isNaN(farmId)) {
    return NextResponse.json({ error: "Invalid farm ID" }, { status: 400 });
  }

  try {
    const archived = await archiveFarm(farmId, session.id, session.role);
    return NextResponse.json(archived);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to archive farm" }, { status: 400 });
  }
}
