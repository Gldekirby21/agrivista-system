import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import { createFarmParcel } from "@/features/rsbsa/lib/beneficiaryMutations";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const farmId = searchParams.get("farmId");
  const where: any = { status: { not: "Archived" } };

  if (farmId) {
    where.farmId = parseInt(farmId, 10);
  }

  const parcels = await prisma.farmParcel.findMany({
    where,
    include: {
      farm: {
        include: {
          farmer: true,
        },
      },
      crops: {
        where: { status: { not: "Archived" } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(parcels);
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = await req.json();
    const parcel = await createFarmParcel(body, session.id, session.role);
    return NextResponse.json(parcel, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create parcel" }, { status: 400 });
  }
}
