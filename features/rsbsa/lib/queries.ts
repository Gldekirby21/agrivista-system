import { prisma } from "@/lib/database/prisma";
import { Prisma } from "@prisma/client";
import {
  FarmerListItem,
  FarmerFullDetail,
  RSBSASummaryStats,
} from "../types";

export interface GetFarmersParams {
  search?: string;
  barangay?: string;
  page?: number;
  limit?: number;
}

/**
 * Queries paginated and filtered RSBSA farmer records with relational summaries
 */
export async function getFarmers(params: GetFarmersParams = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 15));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.FarmerWhereInput = {};

  if (params.barangay && params.barangay !== "ALL") {
    whereClause.barangay = {
      equals: params.barangay,
      mode: "insensitive",
    };
  }

  if (params.search && params.search.trim().length > 0) {
    const q = params.search.trim();
    whereClause.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { rsbsaNumber: { contains: q, mode: "insensitive" } },
      { farmerCode: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, farmers] = await Promise.all([
    prisma.farmer.count({ where: whereClause }),
    prisma.farmer.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        farms: {
          select: {
            id: true,
            totalAreaHa: true,
            parcels: {
              select: {
                id: true,
                areaHa: true,
                crops: {
                  select: {
                    cropType: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const items: FarmerListItem[] = farmers.map((f) => {
    let parcelCount = 0;
    let totalHectares = 0;
    const cropSet = new Set<string>();

    for (const farm of f.farms) {
      totalHectares += farm.totalAreaHa;
      parcelCount += farm.parcels.length;
      for (const p of farm.parcels) {
        for (const c of p.crops) {
          if (c.cropType) cropSet.add(c.cropType);
        }
      }
    }

    return {
      id: f.id,
      rsbsaNumber: f.rsbsaNumber,
      farmerCode: f.farmerCode,
      firstName: f.firstName,
      middleName: f.middleName,
      lastName: f.lastName,
      extensionName: f.extensionName,
      contactNumber: f.contactNumber,
      barangay: f.barangay,
      municipality: f.municipality,
      province: f.province,
      status: f.status,
      isSenior: f.isSenior,
      isPwd: f.isPwd,
      is4ps: f.is4ps,
      isIp: f.isIp,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      farmCount: f.farms.length,
      parcelCount,
      totalHectares: Number(totalHectares.toFixed(2)),
      activeCrops: Array.from(cropSet),
    };
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Retrieves full farmer profile with related farms, parcels, latest recorded crops, and documents
 */
export async function getFarmerById(id: number): Promise<FarmerFullDetail | null> {
  const farmer = await prisma.farmer.findUnique({
    where: { id },
    include: {
      farms: {
        include: {
          parcels: {
            include: {
              crops: {
                orderBy: { plantingDate: "desc" },
              },
            },
          },
        },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!farmer) return null;

  return farmer as unknown as FarmerFullDetail;
}

/**
 * Aggregates high-level RSBSA metrics for oversight
 */
export async function getRSBSASummaryStats(): Promise<RSBSASummaryStats> {
  const [totalFarmers, totalParcels, totalCrops, farmsByBarangay] = await Promise.all([
    prisma.farmer.count(),
    prisma.farmParcel.count(),
    prisma.crop.count(),
    prisma.farm.groupBy({
      by: ["barangay"],
      _sum: { totalAreaHa: true },
      _count: { id: true },
    }),
  ]);

  let totalHectares = 0;
  const barangayCounts: Record<string, number> = {};

  for (const b of farmsByBarangay) {
    if (b._sum.totalAreaHa) {
      totalHectares += b._sum.totalAreaHa;
    }
    barangayCounts[b.barangay] = b._count.id;
  }

  return {
    totalFarmers,
    totalParcels,
    totalHectares: Number(totalHectares.toFixed(2)),
    totalCropsRecorded: totalCrops,
    barangayCounts,
  };
}
