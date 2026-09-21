import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import { createCrop } from "@/features/rsbsa/lib/beneficiaryMutations";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const parcelId = searchParams.get("parcelId");
  const where: any = { status: { not: "Archived" } };

  if (parcelId) {
    where.parcelId = parseInt(parcelId, 10);
  }

  const crops = await prisma.crop.findMany({
    where,
    include: {
      parcel: {
        include: {
          farm: {
            include: {
              farmer: {
                select: {
                  id: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  extensionName: true,
                  rsbsaNumber: true,
                  barangay: true,
                },
              },
            },
          },
        },
      },
      damageReports: {
        include: {
          assessment: true,
          pcicClaim: {
            select: {
              id: true,
              claimNumber: true,
              headApprovalStatus: true,
              headApprovedAt: true,
            },
          },
        },
        orderBy: { incidentDate: "desc" },
      },
    },
    orderBy: { plantingDate: "desc" },
  });

  return NextResponse.json(crops);
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = await req.json();
    const crop = await createCrop(body, session.id, session.role);
    return NextResponse.json(crop, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to record crop" }, { status: 400 });
  }
}
