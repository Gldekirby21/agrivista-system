import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import { logAuditEvent } from "@/lib/audit/auditLog";
import { generateRsbsaNumber } from "@/features/rsbsa/lib/rsbsaUtils";

async function generateUniqueRsbsaNumber(barangay: string = "Poblacion"): Promise<string> {
  let candidate = generateRsbsaNumber(barangay);
  let existing = await prisma.farmer.findUnique({ where: { rsbsaNumber: candidate } });
  while (existing) {
    candidate = generateRsbsaNumber(barangay);
    existing = await prisma.farmer.findUnique({ where: { rsbsaNumber: candidate } });
  }
  return candidate;
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF", "OMAG_HEAD"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = await req.json();
    const { profile, farm, parcel, crop, document } = body;

    if (!profile) {
      return NextResponse.json({ error: "Beneficiary profile is required." }, { status: 400 });
    }

    const fn = (profile.firstName || "").trim();
    const ln = (profile.lastName || "").trim();
    const resolvedFirstName = fn || (ln ? "Farmer" : "Beneficiary");
    const resolvedLastName = ln || (fn ? "Record" : "Record");
    const barangay = (profile.barangay || "Poblacion").trim();

    let rsbsaNum = (profile.rsbsaNumber || "").trim();
    if (!rsbsaNum) {
      rsbsaNum = await generateUniqueRsbsaNumber(barangay);
    } else {
      const existing = await prisma.farmer.findUnique({ where: { rsbsaNumber: rsbsaNum } });
      if (existing) {
        rsbsaNum = await generateUniqueRsbsaNumber(barangay);
      }
    }

    // Atomic execution in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Beneficiary
      const createdFarmer = await tx.farmer.create({
        data: {
          firstName: resolvedFirstName,
          middleName: profile.middleName?.trim() || null,
          lastName: resolvedLastName,
          extensionName: profile.extensionName?.trim() || null,
          rsbsaNumber: rsbsaNum,
          farmerCode: profile.farmerCode?.trim() || "Farmer / Land Owner",
          sex: profile.sex?.trim() || "Unspecified",
          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : new Date("1970-01-01"),
          contactNumber: profile.contactNumber?.trim() || null,
          email: profile.email?.trim() || null,
          barangay,
          municipality: "Polomolok",
          province: "South Cotabato",
          civilStatus: profile.civilStatus?.trim() || "Married",
          isSenior: Boolean(profile.isSenior),
          isPwd: Boolean(profile.isPwd),
          is4ps: Boolean(profile.is4ps),
          isIp: Boolean(profile.isIp),
          status: "Active",
        },
      });

      let createdFarm: any = null;
      let createdParcel: any = null;
      let createdCrop: any = null;
      let createdDoc: any = null;

      // 2. Create Farm (if farm info provided or user included farm section)
      const hasFarmData =
        farm &&
        (farm.includeFarm !== false &&
          (farm.farmName?.trim() || farm.totalAreaHa || farm.barangay || farm.sitioPurok));

      if (hasFarmData) {
        const resolvedFarmName =
          farm.farmName?.trim() ||
          `${resolvedLastName ? `${resolvedLastName} Farm` : "Farm Landholding"} (${farm.barangay || barangay})`;
        const farmArea = parseFloat(farm.totalAreaHa) || 1.0;

        createdFarm = await tx.farm.create({
          data: {
            farmerId: createdFarmer.id,
            farmName: resolvedFarmName,
            barangay: farm.barangay?.trim() || barangay,
            municipality: "Polomolok",
            province: "South Cotabato",
            sitioPurok: farm.sitioPurok?.trim() || null,
            totalAreaHa: farmArea > 0 ? farmArea : 1.0,
            tenureType: farm.tenureType?.trim() || "Owned",
            soilType: farm.soilType?.trim() || null,
            waterSource: farm.waterSource?.trim() || "Rainfed",
            status: "Active",
            remarks: farm.remarks?.trim() || null,
          },
        });

        // 3. Create Parcel (if farm created and parcel data provided)
        const hasParcelData =
          parcel &&
          (parcel.includeParcel !== false &&
            (parcel.parcelNumber?.trim() || parcel.areaHa || parcel.latitude || parcel.longitude));

        if (hasParcelData) {
          const parcelArea = parseFloat(parcel.areaHa) || farmArea || 1.0;
          const parcelNumber = parcel.parcelNumber?.trim() || "LOT-01";
          const lat = parcel.latitude ? parseFloat(parcel.latitude) : 6.2189;
          const lng = parcel.longitude ? parseFloat(parcel.longitude) : 125.0645;

          createdParcel = await tx.farmParcel.create({
            data: {
              farmId: createdFarm.id,
              parcelNumber,
              areaHa: parcelArea > 0 ? parcelArea : 1.0,
              latitude: !isNaN(lat) ? lat : 6.2189,
              longitude: !isNaN(lng) ? lng : 125.0645,
              soilType: farm.soilType?.trim() || null,
              remarks: parcel.remarks?.trim() || null,
              status: "Active",
            },
          });

          // 4. Create Crop (if parcel created and crop data provided)
          const hasCropData =
            crop &&
            (crop.includeCrop !== false &&
              (crop.cropType?.trim() || crop.variety?.trim() || crop.plantedAreaHa));

          if (hasCropData) {
            const cropArea = parseFloat(crop.plantedAreaHa) || parcelArea || 1.0;
            const plantingDate = crop.plantingDate ? new Date(crop.plantingDate) : new Date();
            const harvestDate = crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate) : null;
            const yearVal = parseInt(crop.year, 10) || new Date().getFullYear();

            createdCrop = await tx.crop.create({
              data: {
                parcelId: createdParcel.id,
                cropType: crop.cropType?.trim() || "Rice (Palay)",
                variety: crop.variety?.trim() || null,
                category: crop.category?.trim() || "Primary",
                plantedAreaHa: cropArea > 0 ? cropArea : 1.0,
                plantingDate,
                expectedHarvestDate: harvestDate,
                season: crop.season?.trim() || "Wet",
                year: yearVal,
                status: crop.status?.trim() || "Standing",
                remarks: crop.remarks?.trim() || null,
              },
            });
          }
        }
      }

      // 5. Create Supporting Land Document (if provided)
      const hasDocData =
        document &&
        (document.includeDocument !== false &&
          (document.fileName?.trim() || document.documentType));

      if (hasDocData && document.fileName?.trim()) {
        const docFileName = document.fileName.trim();
        const storageKey = `rsbsa/${createdFarmer.id}/${Date.now()}-${docFileName}`;
        createdDoc = await tx.landDocument.create({
          data: {
            farmerId: createdFarmer.id,
            farmId: createdFarm ? createdFarm.id : null,
            documentType: document.documentType?.trim() || "Land Title (OCT/TCT)",
            storageProvider: "LOCAL",
            bucketName: "agrivista-documents",
            storageKey,
            fileName: docFileName,
            fileFormat: "PDF",
            fileSizeBytes: 102400,
            uploadedById: session.id,
            verificationStatus: "Attached",
            remarks: document.remarks?.trim() || null,
          },
        });
      }

      return {
        beneficiary: createdFarmer,
        farm: createdFarm,
        parcel: createdParcel,
        crop: createdCrop,
        document: createdDoc,
      };
    });

    // Audit log
    await logAuditEvent({
      userId: session.id,
      roleSnapshot: session.role,
      action: "CREATE",
      module: "BENEFICIARY",
      recordId: String(result.beneficiary.id),
      newValues: {
        id: result.beneficiary.id,
        name: `${result.beneficiary.firstName} ${result.beneficiary.lastName}`,
        rsbsaNumber: result.beneficiary.rsbsaNumber,
        barangay: result.beneficiary.barangay,
        hasFarm: Boolean(result.farm),
        hasParcel: Boolean(result.parcel),
        hasCrop: Boolean(result.crop),
        hasDoc: Boolean(result.document),
      },
    });

    return NextResponse.json({
      success: true,
      beneficiaryId: result.beneficiary.id,
      ...result,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Unified beneficiary intake error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process beneficiary intake registration." },
      { status: 400 }
    );
  }
}
