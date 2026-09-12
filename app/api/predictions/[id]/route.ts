import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const prediction = await prisma.cropPrediction.findUnique({
    where: { id },
    include: {
      crop: {
        include: {
          parcel: {
            include: {
              farm: {
                include: {
                  farmer: true,
                },
              },
            },
          },
        },
      },
      model: true,
      report: true,
    },
  });

  if (!prediction) {
    return NextResponse.json({ error: "Prediction record not found" }, { status: 404 });
  }

  // Fetch relevant audit logs
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      module: "CROP_PREDICTION",
      recordId: id,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
    orderBy: { timestamp: "desc" },
  });

  return NextResponse.json({
    ...prediction,
    auditLogs,
  });
}
