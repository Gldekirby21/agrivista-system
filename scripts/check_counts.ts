import { prisma, withDbRetry } from "../lib/database/prisma";

async function main() {
  console.log("=== Checking current record counts before clean ===");
  const [
    userCount,
    farmerCount,
    farmCount,
    parcelCount,
    cropCount,
    reportCount,
    verificationCount,
    predictionCount,
    claimCount,
    inventoryItemCount,
    batchCount,
    distRecordCount,
    distRequestCount,
    auditCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.farmer.count(),
    prisma.farm.count(),
    prisma.farmParcel.count(),
    prisma.crop.count(),
    prisma.damageReport.count(),
    prisma.photoVerification.count(),
    prisma.cropPrediction.count(),
    prisma.pcicClaim.count(),
    prisma.inventoryItem.count(),
    prisma.inventoryBatch.count(),
    prisma.distributionRecord.count(),
    prisma.distributionRequest.count(),
    prisma.auditLog.count(),
  ]);

  console.log({
    users: userCount,
    farmers: farmerCount,
    farms: farmCount,
    parcels: parcelCount,
    crops: cropCount,
    damageReports: reportCount,
    photoVerifications: verificationCount,
    cropPredictions: predictionCount,
    pcicClaims: claimCount,
    inventoryItems: inventoryItemCount,
    inventoryBatches: batchCount,
    distributionRecords: distRecordCount,
    distributionRequests: distRequestCount,
    auditLogs: auditCount,
  });
}

main()
  .catch((e) => {
    console.error("Count check error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
