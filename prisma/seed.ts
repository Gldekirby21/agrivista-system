import { PrismaClient, Role, InventoryCategory, ClaimStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seeding for OMAG Polomolok Agricultural Resource Distribution & Production Analytics System...");

  // 1. Seed Users (OMAG Head and OMAG Staff)
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash("Password123!", salt);

  const headUser = await prisma.user.upsert({
    where: { username: "head.polomolok" },
    update: {},
    create: {
      username: "head.polomolok",
      email: "head@polomolok.gov.ph",
      fullName: "Engr. Maria Santos",
      passwordHash: defaultPasswordHash,
      role: Role.OMAG_HEAD,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "staff.polomolok" },
    update: {},
    create: {
      username: "staff.polomolok",
      email: "staff@polomolok.gov.ph",
      fullName: "Juan Dela Cruz",
      passwordHash: defaultPasswordHash,
      role: Role.OMAG_STAFF,
      isActive: true,
    },
  });

  console.log("✅ Seeded Users: OMAG Head & OMAG Staff");

  // 2. Seed Initial RSBSA Farmers & Farms in Polomolok
  const sampleFarmers = [
    {
      rsbsaNumber: "12-63-12-001-000001",
      firstName: "Roberto",
      middleName: "Mendoza",
      lastName: "Tan",
      sex: "Male",
      dateOfBirth: new Date("1968-04-12"),
      contactNumber: "09171234567",
      barangay: "Poblacion",
      civilStatus: "Married",
      isSenior: false,
      is4ps: false,
      farmName: "Tan Family Agro Farm",
      totalAreaHa: 2.5,
      tenureType: "Owned",
      soilType: "Clay Loam",
      parcels: [
        {
          parcelNumber: "LOT-POB-01",
          latitude: 6.2189,
          longitude: 125.0645,
          areaHa: 2.5,
          cropType: "Corn",
          variety: "NK8840",
          plantedAreaHa: 2.5,
          season: "Dry",
          year: 2026,
        },
      ],
    },
    {
      rsbsaNumber: "12-63-12-002-000002",
      firstName: "Elena",
      middleName: "Gomez",
      lastName: "Reyes",
      sex: "Female",
      dateOfBirth: new Date("1959-08-23"),
      contactNumber: "09289876543",
      barangay: "Cannery Site",
      civilStatus: "Widowed",
      isSenior: true,
      is4ps: true,
      farmName: "Reyes High-Yield Farm",
      totalAreaHa: 3.2,
      tenureType: "Owned",
      soilType: "Volcanic Loam",
      parcels: [
        {
          parcelNumber: "LOT-CAN-01",
          latitude: 6.2372,
          longitude: 125.0789,
          areaHa: 3.2,
          cropType: "Pineapple",
          variety: "MD-2 Hybrid",
          plantedAreaHa: 3.2,
          season: "Wet",
          year: 2026,
        },
      ],
    },
    {
      rsbsaNumber: "12-63-12-003-000003",
      firstName: "Danilo",
      middleName: "Bautista",
      lastName: "Flores",
      sex: "Male",
      dateOfBirth: new Date("1975-11-05"),
      contactNumber: "09395551234",
      barangay: "Silway 8",
      civilStatus: "Married",
      isSenior: false,
      isIp: true,
      farmName: "Silway Green Paddy",
      totalAreaHa: 1.8,
      tenureType: "Leased",
      soilType: "Silty Clay Loam",
      parcels: [
        {
          parcelNumber: "LOT-SIL-01",
          latitude: 6.195,
          longitude: 125.102,
          areaHa: 1.8,
          cropType: "Rice",
          variety: "RC222",
          plantedAreaHa: 1.8,
          season: "Wet",
          year: 2026,
        },
      ],
    },
  ];

  for (const fData of sampleFarmers) {
    await prisma.farmer.upsert({
      where: { rsbsaNumber: fData.rsbsaNumber },
      update: {},
      create: {
        rsbsaNumber: fData.rsbsaNumber,
        firstName: fData.firstName,
        middleName: fData.middleName,
        lastName: fData.lastName,
        sex: fData.sex,
        dateOfBirth: fData.dateOfBirth,
        contactNumber: fData.contactNumber,
        barangay: fData.barangay,
        civilStatus: fData.civilStatus,
        isSenior: fData.isSenior,
        is4ps: fData.is4ps || false,
        isIp: fData.isIp || false,
        farms: {
          create: {
            farmName: fData.farmName,
            barangay: fData.barangay,
            totalAreaHa: fData.totalAreaHa,
            tenureType: fData.tenureType,
            soilType: fData.soilType,
            parcels: {
              create: fData.parcels.map((p) => ({
                parcelNumber: p.parcelNumber,
                latitude: p.latitude,
                longitude: p.longitude,
                areaHa: p.areaHa,
                crops: {
                  create: {
                    cropType: p.cropType,
                    variety: p.variety,
                    plantedAreaHa: p.plantedAreaHa,
                    plantingDate: new Date("2026-01-15"),
                    expectedHarvestDate: new Date("2026-05-15"),
                    season: p.season,
                    year: p.year,
                  },
                },
              })),
            },
          },
        },
      },
    });
  }

  console.log("✅ Seeded RSBSA Farmers, Farms, Parcels, and Crops");

  // 3. Seed Inventory Items & Batches (Demonstrating FIFO)
  await prisma.inventoryItem.upsert({
    where: { itemCode: "SEED-CORN-HYB" },
    update: {},
    create: {
      itemCode: "SEED-CORN-HYB",
      name: "Hybrid Yellow Corn Seeds (NK8840)",
      category: InventoryCategory.SEEDS,
      unit: "kg",
      reorderLevel: 50.0,
      description: "High-yield hybrid yellow corn seeds for Polomolok plains.",
      batches: {
        create: [
          {
            batchNumber: "BATCH-2026-CORN-01",
            receivedQuantity: 100.0,
            remainingQuantity: 100.0,
            dateReceived: new Date("2026-01-05"), // Oldest batch (First in FIFO)
            viabilityDate: new Date("2026-12-31"),
            supplierSource: "DA Region XII Seed Center",
            storageLocation: "Warehouse A - Bay 1",
          },
          {
            batchNumber: "BATCH-2026-CORN-02",
            receivedQuantity: 150.0,
            remainingQuantity: 150.0,
            dateReceived: new Date("2026-02-10"), // Newer batch (Second in FIFO)
            viabilityDate: new Date("2027-02-10"),
            supplierSource: "DA Region XII Seed Center",
            storageLocation: "Warehouse A - Bay 2",
          },
        ],
      },
    },
  });

  await prisma.inventoryItem.upsert({
    where: { itemCode: "FERT-UREA-4600" },
    update: {},
    create: {
      itemCode: "FERT-UREA-4600",
      name: "Urea Fertilizer (46-0-0)",
      category: InventoryCategory.FERTILIZER,
      unit: "bags",
      reorderLevel: 25.0,
      description: "Standard municipal nitrogenous fertilizer supplement.",
      batches: {
        create: [
          {
            batchNumber: "BATCH-2026-UREA-01",
            receivedQuantity: 60.0,
            remainingQuantity: 60.0,
            dateReceived: new Date("2026-01-10"),
            expiryDate: new Date("2028-01-10"),
            supplierSource: "LGU Polomolok Procurement",
            storageLocation: "Warehouse B - Section 1",
          },
        ],
      },
    },
  });

  console.log("✅ Seeded FIFO Inventory Items & Batches");

  // 4. Seed Historical Production Calibration Data
  const barangays = [
    "Poblacion",
    "Cannery Site",
    "Silway 8",
    "Magsaysay",
    "Bentung",
    "Koronadal Proper",
    "Glamang",
    "Landan",
    "Lumakil",
    "Maligo",
    "Palkan",
    "Rubber",
    "Sulit",
    "Upper Klinan",
  ];

  for (const bgry of barangays.slice(0, 5)) {
    await prisma.historicalAgriculturalData.create({
      data: {
        barangay: bgry,
        year: 2025,
        season: "Wet",
        cropType: "Corn",
        plantedAreaHa: 120.0,
        harvestedAreaHa: 115.0,
        productionTons: 494.5,
        averageYieldTonsHa: 4.3,
        seedUsageKg: 2400.0,
        fertilizerUsageBags: 600.0,
        soilType: "Clay Loam",
        calamityOccurrences: 0,
      },
    });
  }

  console.log("✅ Seeded Historical Agricultural Calibration Baseline");

  // 5. Seed Sample Calamity Damage Docket with Verified EXIF Photo
  const sampleFarmer = await prisma.farmer.findFirst({
    include: {
      farms: {
        include: {
          parcels: {
            include: {
              crops: true,
            },
          },
        },
      },
    },
  });

  if (sampleFarmer && sampleFarmer.farms.length > 0 && sampleFarmer.farms[0].parcels.length > 0) {
    const sFarm = sampleFarmer.farms[0];
    const sParcel = sFarm.parcels[0];
    const sCrop = sParcel.crops[0];

    const damageReport = await prisma.damageReport.upsert({
      where: { reportNumber: "DR-2026-0001" },
      update: {},
      create: {
        reportNumber: "DR-2026-0001",
        farmerId: sampleFarmer.id,
        parcelId: sParcel.id,
        cropId: sCrop ? sCrop.id : 1,
        incidentDate: new Date("2026-08-28T09:00:00Z"),
        calamityType: "Typhoon",
        reportedDamagePercent: 65,
        reportedAffectedAreaHa: 1.8,
        narrativeDescription:
          "Severe stalk lodging and waterlogging caused by heavy rainfall and gusty winds associated with Habagat monsoonal rains. Estimated 65% crop yield impairment on parcel centroid.",
        status: ClaimStatus.REVIEWED,
        createdById: headUser.id,
      },
    });

    const existingPhoto = await prisma.damagePhoto.findFirst({
      where: { reportId: damageReport.id },
    });

    if (!existingPhoto) {
      const photo = await prisma.damagePhoto.create({
        data: {
          reportId: damageReport.id,
          storageProvider: "LOCAL",
          bucketName: "agrivista-damage-photos",
          storageKey: `damage-photos/report-${damageReport.id}/sample-field-lodging.jpg`,
          originalFileName: "IMG_20260828_091522_Lodging.jpg",
          fileSizeBytes: 2458900,
          mimeType: "image/jpeg",
        },
      });

      const metadata = await prisma.photoMetadata.create({
        data: {
          photoId: photo.id,
          hasExif: true,
          latitude: (sParcel.latitude || 6.2189) + 0.0008, // ~88 meters from centroid
          longitude: (sParcel.longitude || 125.0645) + 0.0004,
          altitude: 195.4,
          capturedDate: new Date("2026-08-28T09:15:22Z"),
          deviceMake: "Samsung",
          deviceModel: "SM-G991B (Galaxy S21 5G)",
          rawExifData: {
            Make: "Samsung",
            Model: "SM-G991B",
            Software: "G991BXXU9EVL3",
            ExposureTime: 0.002,
            FNumber: 1.8,
            ISO: 50,
          },
        },
      });

      await prisma.metadataVerification.create({
        data: {
          metadataId: metadata.id,
          parcelId: sParcel.id,
          calculatedDistanceMeters: 98.6,
          acceptableThresholdMeters: 500,
          timestampDifferenceHours: 0.25,
          status: "VERIFIED",
          verificationNotes:
            "GPS location verified within 98.6m of registered parcel centroid (Threshold: 500m). Timestamp is consistent (captured 15 minutes following reported incident).",
        },
      });

      console.log("✅ Seeded Sample Damage Docket DR-2026-0001 with Verified Photo");
    }
  }

  console.log("🎉 Agrivista Database Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
