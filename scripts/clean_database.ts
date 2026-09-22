import { prisma, withDbRetry } from "../lib/database/prisma";

async function cleanDatabase() {
  console.log("🧹 Starting full database clean (preserving User accounts)...");

  await withDbRetry(async () => {
    // We execute in sequence with foreign key safety
    console.log("1. Cleaning Audit Logs & Notifications...");
    await prisma.auditLog.deleteMany({});

    console.log("2. Cleaning FIFO Distribution Records & Requests...");
    await prisma.distributionRecord.deleteMany({});
    await prisma.distributionRequest.deleteMany({});
    await prisma.inventoryBatch.deleteMany({});
    await prisma.inventoryItem.deleteMany({});

    console.log("3. Cleaning PCIC Claims & Scores...");
    await prisma.claimPriorityScore.deleteMany({});
    await prisma.pcicClaim.deleteMany({});

    console.log("4. Cleaning ML Predictions & Model Registry...");
    await prisma.cropPrediction.deleteMany({});
    await prisma.mlModelRegistry.deleteMany({});

    console.log("5. Cleaning Photo Verifications & EXIF Metadata...");
    await prisma.photoVerification.deleteMany({});
    await prisma.metadataVerification.deleteMany({});
    await prisma.photoMetadata.deleteMany({});
    await prisma.damagePhoto.deleteMany({});
    await prisma.damageAssessment.deleteMany({});
    await prisma.damageReport.deleteMany({});

    console.log("6. Cleaning Land Documents, Crops, Parcels & Farms...");
    await prisma.landDocument.deleteMany({});
    await prisma.crop.deleteMany({});
    await prisma.farmParcel.deleteMany({});
    await prisma.farm.deleteMany({});

    console.log("7. Cleaning Farmers Masterlist...");
    await prisma.farmer.deleteMany({});

    console.log("8. Cleaning Historical Agricultural Calibration & Forecasts...");
    await prisma.historicalAgriculturalData.deleteMany({});
    await prisma.resourceDemandForecast.deleteMany({});
  });

  console.log("✅ All operational records successfully cleaned!");

  // Verify counts
  const [farmers, crops, verifications, claims, items, requests] = await Promise.all([
    prisma.farmer.count(),
    prisma.crop.count(),
    prisma.photoVerification.count(),
    prisma.pcicClaim.count(),
    prisma.inventoryItem.count(),
    prisma.distributionRequest.count(),
  ]);

  console.log("Final verification counts:", {
    farmers,
    crops,
    photoVerifications: verifications,
    pcicClaims: claims,
    inventoryItems: items,
    distributionRequests: requests,
    usersPreserved: await prisma.user.count(),
  });
}

cleanDatabase()
  .catch((e) => {
    console.error("❌ Clean database error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
