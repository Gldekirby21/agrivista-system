import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";

const MAX_RESULTS_PER_TYPE = 4;

function buildBasePath(role: string): string {
  return role === "OMAG_HEAD" ? "/head/beneficiaries" : "/staff/beneficiaries";
}

function formatName(farmer: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  extensionName?: string | null;
}): string {
  return `${farmer.firstName}${farmer.middleName ? ` ${farmer.middleName[0]}.` : ""} ${farmer.lastName}${
    farmer.extensionName ? ` ${farmer.extensionName}` : ""
  }`;
}

/**
 * GET /api/search?q=... — Global search across agricultural records.
 * Returns a limited set of typed results so the GmailTopBar search can offer
 * direct deep links into the Beneficiaries directory views.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const basePath = buildBasePath(auth.session.role);
  const contains = { contains: q, mode: "insensitive" as const };

  try {
    const [farmers, farms, parcels, crops, documents] = await Promise.all([
      prisma.farmer.findMany({
        where: {
          status: { not: "Archived" },
          OR: [
            { firstName: contains },
            { lastName: contains },
            { rsbsaNumber: contains },
            { farmerCode: contains },
            { barangay: contains },
          ],
        },
        select: {
          id: true,
          rsbsaNumber: true,
          firstName: true,
          lastName: true,
          barangay: true,
        },
        take: MAX_RESULTS_PER_TYPE,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.farm.findMany({
        where: {
          status: { not: "Archived" },
          OR: [{ farmName: contains }, { farmCode: contains }, { barangay: contains }],
        },
        select: {
          id: true,
          farmName: true,
          farmCode: true,
          barangay: true,
          farmer: { select: { id: true, firstName: true, lastName: true } },
        },
        take: MAX_RESULTS_PER_TYPE,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.farmParcel.findMany({
        where: {
          status: { not: "Archived" },
          OR: [
            { parcelNumber: contains },
            { parcelCode: contains },
            { farm: { is: { farmName: contains } } },
            { farm: { is: { farmer: { is: { lastName: contains } } } } },
          ],
        },
        select: {
          id: true,
          parcelNumber: true,
          areaHa: true,
          farm: {
            select: {
              farmName: true,
              barangay: true,
              farmer: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
        take: MAX_RESULTS_PER_TYPE,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.crop.findMany({
        where: {
          status: { not: "Archived" },
          OR: [
            { cropType: contains },
            { variety: contains },
            { parcel: { is: { parcelNumber: contains } } },
            { parcel: { is: { farm: { is: { farmer: { is: { lastName: contains } } } } } } },
          ],
        },
        select: {
          id: true,
          cropType: true,
          variety: true,
          status: true,
          parcel: {
            select: {
              parcelNumber: true,
              farm: {
                select: {
                  barangay: true,
                  farmer: { select: { id: true, firstName: true, lastName: true } },
                },
              },
            },
          },
        },
        take: MAX_RESULTS_PER_TYPE,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.landDocument.findMany({
        where: {
          verificationStatus: { not: "Archived" },
          OR: [
            { documentType: contains },
            { fileName: contains },
            { farmer: { is: { lastName: contains } } },
          ],
        },
        select: {
          id: true,
          documentType: true,
          fileName: true,
          verificationStatus: true,
          farmer: { select: { id: true, firstName: true, lastName: true } },
        },
        take: MAX_RESULTS_PER_TYPE,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const results = [
      ...farmers.map((f) => ({
        type: "farmer" as const,
        id: f.id,
        title: formatName(f),
        subtitle: `RSBSA: ${f.rsbsaNumber || "Unassigned"} — Brgy. ${f.barangay}`,
        href: `${basePath}/${f.id}`,
      })),
      ...farms.map((farm) => ({
        type: "farm" as const,
        id: farm.id,
        title: farm.farmName || farm.farmCode || `Farm #${farm.id}`,
        subtitle: `Brgy. ${farm.barangay} — ${
          farm.farmer ? `${farm.farmer.firstName} ${farm.farmer.lastName}` : "Unassigned"
        }`,
        href: `${basePath}?view=farms`,
      })),
      ...parcels.map((parcel) => ({
        type: "parcel" as const,
        id: parcel.id,
        title: `Parcel ${parcel.parcelNumber}`,
        subtitle: `${parcel.farm?.farmName || "Farm"} — Brgy. ${
          parcel.farm?.barangay || "—"
        } (${parcel.areaHa} ha)`,
        href: `${basePath}?view=parcels`,
      })),
      ...crops.map((crop) => ({
        type: "crop" as const,
        id: crop.id,
        title: `${crop.cropType}${crop.variety ? ` (${crop.variety})` : ""}`,
        subtitle: `Parcel ${crop.parcel?.parcelNumber || "—"} — ${crop.status}`,
        href: `${basePath}?view=crops`,
      })),
      ...documents.map((doc) => ({
        type: "document" as const,
        id: doc.id,
        title: doc.documentType,
        subtitle: `${doc.fileName} — ${doc.verificationStatus}`,
        href: `${basePath}?view=documents`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Global search failed" },
      { status: 500 }
    );
  }
}
