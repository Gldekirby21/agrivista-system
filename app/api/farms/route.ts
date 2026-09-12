import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import { createFarm } from "@/features/rsbsa/lib/beneficiaryMutations";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const beneficiaryId = searchParams.get("beneficiaryId");
  const where: any = { status: { not: "Archived" } };

  if (beneficiaryId) {
    where.farmerId = parseInt(beneficiaryId, 10);
  }

  const farms = await prisma.farm.findMany({
    where,
    include: {
      parcels: {
        where: { status: { not: "Archived" } },
        include: { crops: { where: { status: { not: "Archived" } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(farms);
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = await req.json();
    const farm = await createFarm(body, session.id, session.role);
    return NextResponse.json(farm, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create farm" }, { status: 400 });
  }
}
