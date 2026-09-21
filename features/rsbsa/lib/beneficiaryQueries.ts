import { prisma } from "@/lib/database/prisma";
import { Prisma } from "@prisma/client";

export interface GetBeneficiariesParams {
  search?: string;
  barangay?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface BeneficiaryListItem {
  id: number;
  rsbsaNumber: string | null;
  farmerCode: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  extensionName: string | null;
  fullName: string;
  contactNumber: string | null;
  barangay: string;
  municipality: string;
  province: string;
  status: string;
  isSenior: boolean;
  isPwd: boolean;
  is4ps: boolean;
  isIp: boolean;
  createdAt: Date;
  updatedAt: Date;
  farmCount: number;
  parcelCount: number;
  totalHectares: number;
  activeCrops: string[];
}

/**
 * Queries paginated and filtered Beneficiary records (Objective 1)
 */
export async function getBeneficiaries(params: GetBeneficiariesParams = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 15));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.FarmerWhereInput = {};

  // Status filtering: default to active/non-archived unless specified
  if (params.status && params.status !== "ALL") {
    whereClause.status = {
      equals: params.status,
      mode: "insensitive",
    };
  } else if (!params.status) {
    whereClause.status = {
      not: "Archived",
    };
  }

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
      { barangay: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, records] = await Promise.all([
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
            status: true,
            parcels: {
              select: {
                id: true,
                areaHa: true,
                status: true,
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

  const items: BeneficiaryListItem[] = records.map((f) => {
    let parcelCount = 0;
    let totalHectares = 0;
    const cropSet = new Set<string>();

    for (const farm of f.farms) {
      if (farm.status !== "Archived") {
        totalHectares += farm.totalAreaHa;
        parcelCount += farm.parcels.length;
        for (const p of farm.parcels) {
          for (const c of p.crops) {
            if (c.cropType && c.status !== "Archived") cropSet.add(c.cropType);
          }
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
      fullName: `${f.firstName}${f.middleName ? ` ${f.middleName[0]}.` : ""} ${f.lastName}${f.extensionName ? ` ${f.extensionName}` : ""}`,
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
      farmCount: f.farms.filter((fm) => fm.status !== "Archived").length,
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
 * Retrieves full Beneficiary dossier including farms, parcels, crops, and land documents
 */
export async function getBeneficiaryById(id: number) {
  const beneficiary = await prisma.farmer.findUnique({
    where: { id },
    include: {
      farms: {
        orderBy: { createdAt: "asc" },
        include: {
          parcels: {
            orderBy: { createdAt: "asc" },
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

  return beneficiary;
}

/**
 * Aggregates high-level Beneficiary summary statistics for oversight
 */
export async function getBeneficiarySummaryStats() {
  const [totalBeneficiaries, activeBeneficiaries, archivedBeneficiaries, totalParcels, totalCrops, farmsByBarangay] =
    await Promise.all([
      prisma.farmer.count(),
      prisma.farmer.count({ where: { status: { not: "Archived" } } }),
      prisma.farmer.count({ where: { status: "Archived" } }),
      prisma.farmParcel.count({ where: { status: { not: "Archived" } } }),
      prisma.crop.count({ where: { status: { not: "Archived" } } }),
      prisma.farm.groupBy({
        by: ["barangay"],
        where: { status: { not: "Archived" } },
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
    totalBeneficiaries,
    activeBeneficiaries,
    archivedBeneficiaries,
    totalParcels,
    totalHectares: Number(totalHectares.toFixed(2)),
    totalCropsRecorded: totalCrops,
    barangayCounts,
  };
}

/**
 * Queries all farm landholdings with owner farmer and parcel summary
 */
export async function getAllFarms(params: { search?: string; barangay?: string; status?: string } = {}) {
  const where: Prisma.FarmWhereInput = {};
  if (params.status && params.status !== "ALL") {
    where.status = { equals: params.status, mode: "insensitive" };
  } else if (!params.status) {
    where.status = { not: "Archived" };
  }

  if (params.barangay && params.barangay !== "ALL") {
    where.barangay = { equals: params.barangay, mode: "insensitive" };
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { farmName: { contains: q, mode: "insensitive" } },
      { barangay: { contains: q, mode: "insensitive" } },
      { tenureType: { contains: q, mode: "insensitive" } },
      { farmer: { firstName: { contains: q, mode: "insensitive" } } },
      { farmer: { lastName: { contains: q, mode: "insensitive" } } },
      { farmer: { rsbsaNumber: { contains: q, mode: "insensitive" } } },
    ];
  }

  return prisma.farm.findMany({
    where,
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
          contactNumber: true,
        },
      },
      parcels: {
        where: { status: { not: "Archived" } },
        include: { crops: { where: { status: { not: "Archived" } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Queries all farm parcels with farm and farmer context
 */
export async function getAllFarmParcels(params: { search?: string; status?: string } = {}) {
  const where: Prisma.FarmParcelWhereInput = {};
  if (params.status && params.status !== "ALL") {
    where.status = { equals: params.status, mode: "insensitive" };
  } else if (!params.status) {
    where.status = { not: "Archived" };
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { parcelNumber: { contains: q, mode: "insensitive" } },
      { farm: { farmName: { contains: q, mode: "insensitive" } } },
      { farm: { barangay: { contains: q, mode: "insensitive" } } },
      { farm: { farmer: { firstName: { contains: q, mode: "insensitive" } } } },
      { farm: { farmer: { lastName: { contains: q, mode: "insensitive" } } } },
    ];
  }

  return prisma.farmParcel.findMany({
    where,
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
      crops: {
        where: { status: { not: "Archived" } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Queries all crop cycles with parent parcel, farm, and farmer
 */
export async function getAllCrops(params: { search?: string; status?: string } = {}) {
  const where: Prisma.CropWhereInput = {};
  if (params.status && params.status !== "ALL") {
    where.status = { equals: params.status, mode: "insensitive" };
  } else if (!params.status) {
    where.status = { not: "Archived" };
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { cropType: { contains: q, mode: "insensitive" } },
      { variety: { contains: q, mode: "insensitive" } },
      { parcel: { parcelNumber: { contains: q, mode: "insensitive" } } },
      { parcel: { farm: { farmName: { contains: q, mode: "insensitive" } } } },
      { parcel: { farm: { barangay: { contains: q, mode: "insensitive" } } } },
      { parcel: { farm: { farmer: { firstName: { contains: q, mode: "insensitive" } } } } },
      { parcel: { farm: { farmer: { lastName: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  return prisma.crop.findMany({
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
    },
    orderBy: { plantingDate: "desc" },
  });
}

/**
 * Queries all supporting land documents with associated farmer and farm
 */
export async function getAllLandDocuments(params: { search?: string; status?: string } = {}) {
  const where: Prisma.LandDocumentWhereInput = {};
  if (params.status && params.status !== "ALL") {
    where.verificationStatus = { equals: params.status, mode: "insensitive" };
  } else if (!params.status) {
    where.verificationStatus = { not: "Archived" };
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { documentType: { contains: q, mode: "insensitive" } },
      { fileName: { contains: q, mode: "insensitive" } },
      { remarks: { contains: q, mode: "insensitive" } },
      { farmer: { firstName: { contains: q, mode: "insensitive" } } },
      { farmer: { lastName: { contains: q, mode: "insensitive" } } },
      { farmer: { rsbsaNumber: { contains: q, mode: "insensitive" } } },
    ];
  }

  return prisma.landDocument.findMany({
    where,
    include: {
      uploadedBy: {
        select: { id: true, fullName: true, role: true },
      },
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
      farm: {
        select: {
          id: true,
          farmName: true,
          barangay: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
