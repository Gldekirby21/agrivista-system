import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import { PredictYieldInputSchema, QueryPredictionSchema } from "@/features/yield-loss/validation/schemas";
import { createCropPrediction } from "@/features/yield-loss/services/predictionService";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const parsed = QueryPredictionSchema.safeParse({
    search: searchParams.get("search") || undefined,
    cropType: searchParams.get("cropType") || undefined,
    barangay: searchParams.get("barangay") || undefined,
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("limit") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const { search, cropType, barangay, page, limit } = parsed.data;
  const where: any = {};

  if (cropType && cropType !== "ALL") {
    where.crop = { cropType };
  }

  if (barangay && barangay !== "ALL") {
    where.crop = {
      ...where.crop,
      parcel: {
        farm: {
          barangay,
        },
      },
    };
  }

  if (search) {
    where.OR = [
      { crop: { cropType: { contains: search, mode: "insensitive" } } },
      { crop: { variety: { contains: search, mode: "insensitive" } } },
      { crop: { parcel: { farm: { farmer: { firstName: { contains: search, mode: "insensitive" } } } } } },
      { crop: { parcel: { farm: { farmer: { lastName: { contains: search, mode: "insensitive" } } } } } },
      { crop: { parcel: { farm: { farmer: { rsbsaNumber: { contains: search, mode: "insensitive" } } } } } },
    ];
  }

  const [total, predictions] = await Promise.all([
    prisma.cropPrediction.count({ where }),
    prisma.cropPrediction.findMany({
      where,
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
      },
      orderBy: { predictionTimestamp: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: predictions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = await req.json();
    const validated = PredictYieldInputSchema.parse(body);
    const prediction = await createCropPrediction(validated, session.id, session.role);
    return NextResponse.json(prediction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to execute crop prediction" },
      { status: error?.statusCode || 400 }
    );
  }
}
