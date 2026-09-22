import { prisma, withDbRetry } from "../lib/database/prisma";
import fs from "fs";
import path from "path";

function parseSqlStatements(sqlText: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inDollarQuote = false;
  let dollarTag = "";
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sqlText.length; i++) {
    const char = sqlText[i];
    const nextChar = i + 1 < sqlText.length ? sqlText[i + 1] : "";

    // Line comment
    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }
    // Block comment
    if (inBlockComment) {
      if (char === "*" && nextChar === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    // Check for comment starts
    if (!inSingleQuote && !inDoubleQuote && !inDollarQuote) {
      if (char === "-" && nextChar === "-") {
        inLineComment = true;
        i++;
        continue;
      }
      if (char === "/" && nextChar === "*") {
        inBlockComment = true;
        i++;
        continue;
      }
    }

    // Single quotes
    if (char === "'" && !inDoubleQuote && !inDollarQuote) {
      if (inSingleQuote) {
        if (nextChar === "'") {
          current += "''";
          i++;
          continue;
        } else {
          inSingleQuote = false;
        }
      } else {
        inSingleQuote = true;
      }
      current += char;
      continue;
    }

    // Double quotes
    if (char === '"' && !inSingleQuote && !inDollarQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    // Semicolon statement boundary
    if (char === ";" && !inSingleQuote && !inDoubleQuote && !inDollarQuote) {
      const trimmed = current.trim();
      if (trimmed.length > 0 && !/^BEGIN\b|^COMMIT\b/i.test(trimmed)) {
        statements.push(trimmed);
      }
      current = "";
      continue;
    }

    current += char;
  }

  const remainder = current.trim();
  if (remainder.length > 0 && !/^BEGIN\b|^COMMIT\b/i.test(remainder)) {
    statements.push(remainder);
  }

  return statements;
}

async function runSeed() {
  console.log("🚀 Parsing and executing 'new seeds1.sql' on PostgreSQL...");
  const sqlFilePath = path.join(process.cwd(), "new seeds1.sql");
  const rawSql = fs.readFileSync(sqlFilePath, "utf8");

  const statements = parseSqlStatements(rawSql);
  console.log(`Parsed ${statements.length} independent SQL statements.`);

  console.log("Preparing table constraints & defaults for bulk seed insertion...");
  // Temporarily grant DEFAULT CURRENT_TIMESTAMP to updatedAt columns
  const tablesWithUpdatedAt = [
    "Farmer",
    "Farm",
    "FarmParcel",
    "Crop",
    "InventoryItem",
    "InventoryBatch",
    "DistributionRequest",
    "DamageReport",
    "PhotoVerification",
  ];

  for (const tbl of tablesWithUpdatedAt) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${tbl}" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;`
    );
  }

  for (let idx = 0; idx < statements.length; idx++) {
    const stmt = statements[idx];
    const preview = stmt.replace(/\s+/g, " ").slice(0, 80);
    console.log(`[${idx + 1}/${statements.length}] ${preview}...`);
    await withDbRetry(async () => {
      await prisma.$executeRawUnsafe(stmt);
    });
  }

  console.log("🎉 All seed statements executed successfully!");

  const [
    userCount,
    farmerCount,
    farmCount,
    parcelCount,
    cropCount,
    reportCount,
    photoCount,
    verificationCount,
    predictionCount,
    claimCount,
    priorityCount,
    itemCount,
    batchCount,
    distRequestCount,
    distRecordCount,
    histCount,
    forecastCount,
    auditCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.farmer.count(),
    prisma.farm.count(),
    prisma.farmParcel.count(),
    prisma.crop.count(),
    prisma.damageReport.count(),
    prisma.damagePhoto.count(),
    prisma.photoVerification.count(),
    prisma.cropPrediction.count(),
    prisma.pcicClaim.count(),
    prisma.claimPriorityScore.count(),
    prisma.inventoryItem.count(),
    prisma.inventoryBatch.count(),
    prisma.distributionRequest.count(),
    prisma.distributionRecord.count(),
    prisma.historicalAgriculturalData.count(),
    prisma.resourceDemandForecast.count(),
    prisma.auditLog.count(),
  ]);

  console.log("\n=== Final Seeded Database Counts ===");
  console.log({
    users: userCount,
    farmers: farmerCount,
    farms: farmCount,
    parcels: parcelCount,
    crops: cropCount,
    damageReports: reportCount,
    damagePhotos: photoCount,
    photoVerifications: verificationCount,
    cropPredictions: predictionCount,
    pcicClaims: claimCount,
    claimPriorityScores: priorityCount,
    inventoryItems: itemCount,
    inventoryBatches: batchCount,
    distributionRequests: distRequestCount,
    distributionRecords: distRecordCount,
    historicalAgriculturalData: histCount,
    resourceDemandForecast: forecastCount,
    auditLogs: auditCount,
  });
}

runSeed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
