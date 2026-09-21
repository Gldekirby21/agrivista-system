import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import { createLandDocument } from "@/features/rsbsa/lib/beneficiaryMutations";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const beneficiaryId = searchParams.get("beneficiaryId");
  const where: any = { verificationStatus: { not: "Archived" } };

  if (beneficiaryId) {
    where.farmerId = parseInt(beneficiaryId, 10);
  }

  const docs = await prisma.landDocument.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: {
        select: { id: true, fullName: true, role: true },
      },
      farmer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          rsbsaNumber: true,
          barangay: true,
        },
      },
      farm: {
        select: {
          id: true,
          farmName: true,
          barangay: true,
        },
      },
    },
  });

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = await req.json();
    const doc = await createLandDocument(body, session.id, session.role);
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to attach land document" }, { status: 400 });
  }
}
