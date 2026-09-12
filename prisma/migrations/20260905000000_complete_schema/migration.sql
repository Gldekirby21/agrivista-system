-- =============================================================================
-- AGRIVISTA — Complete Schema Baseline Migration
-- Date: 2026-09-05
-- Purpose: Create all 22 Prisma entities required by the current application.
-- Idempotency: Uses CREATE TABLE/INDEX IF NOT EXISTS so the migration is a
-- no-op against an existing populated database (created via prisma db push),
-- while still creating the complete schema on a fresh PostgreSQL database.
-- =============================================================================

-- ===========================================================================
-- ENUMS
-- ===========================================================================

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('OMAG_HEAD', 'OMAG_STAFF');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'PARTIALLY_VERIFIED', 'NOT_VERIFIED', 'METADATA_MISSING', 'REQUIRES_REVIEW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PriorityLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "InventoryCategory" AS ENUM ('SEEDS', 'FERTILIZER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ClaimStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'FOR_REVIEW', 'REVIEWED', 'COORDINATED_WITH_PCIC', 'REQUIRES_CORRECTION');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ===========================================================================
-- 1. USER ACCOUNT & RBAC
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OMAG_STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- ===========================================================================
-- 2. RSBSA FARMER
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "Farmer" (
    "id" SERIAL NOT NULL,
    "rsbsaNumber" TEXT,
    "farmerCode" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "extensionName" TEXT,
    "sex" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "contactNumber" TEXT,
    "email" TEXT,
    "barangay" TEXT NOT NULL,
    "municipality" TEXT NOT NULL DEFAULT 'Polomolok',
    "province" TEXT NOT NULL DEFAULT 'South Cotabato',
    "civilStatus" TEXT,
    "isSenior" BOOLEAN NOT NULL DEFAULT false,
    "isPwd" BOOLEAN NOT NULL DEFAULT false,
    "is4ps" BOOLEAN NOT NULL DEFAULT false,
    "isIp" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Farmer_rsbsaNumber_key" ON "Farmer"("rsbsaNumber");
CREATE INDEX IF NOT EXISTS "Farmer_barangay_idx" ON "Farmer"("barangay");
CREATE INDEX IF NOT EXISTS "Farmer_lastName_firstName_idx" ON "Farmer"("lastName", "firstName");

-- ===========================================================================
-- 3. FARM LANDHOLDING
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "Farm" (
    "id" SERIAL NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "farmCode" TEXT,
    "farmName" TEXT,
    "barangay" TEXT NOT NULL,
    "municipality" TEXT NOT NULL DEFAULT 'Polomolok',
    "province" TEXT NOT NULL DEFAULT 'South Cotabato',
    "sitioPurok" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "totalAreaHa" DOUBLE PRECISION NOT NULL,
    "tenureType" TEXT NOT NULL DEFAULT 'Owned',
    "soilType" TEXT,
    "waterSource" TEXT NOT NULL DEFAULT 'Rainfed',
    "isCalamityAffected" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Farm_farmerId_idx" ON "Farm"("farmerId");
CREATE INDEX IF NOT EXISTS "Farm_barangay_idx" ON "Farm"("barangay");

-- ===========================================================================
-- 4. FARM PARCEL (GEOREFERENCED PLOT)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "FarmParcel" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "parcelNumber" TEXT NOT NULL,
    "parcelCode" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "areaHa" DOUBLE PRECISION NOT NULL,
    "boundaryCoordinates" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FarmParcel_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FarmParcel_farmId_idx" ON "FarmParcel"("farmId");
CREATE INDEX IF NOT EXISTS "FarmParcel_latitude_longitude_idx" ON "FarmParcel"("latitude", "longitude");

-- ===========================================================================
-- 5. CROP PLANTING
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "Crop" (
    "id" SERIAL NOT NULL,
    "parcelId" INTEGER NOT NULL,
    "cropType" TEXT NOT NULL,
    "variety" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Primary',
    "plantedAreaHa" DOUBLE PRECISION NOT NULL,
    "plantingDate" TIMESTAMP(3) NOT NULL,
    "expectedHarvestDate" TIMESTAMP(3),
    "actualHarvestDate" TIMESTAMP(3),
    "season" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "historicalYieldTons" DOUBLE PRECISION,
    "harvestedAreaHa" DOUBLE PRECISION,
    "productionQuantity" DOUBLE PRECISION,
    "productionUnit" TEXT,
    "recordedYieldPerHa" DOUBLE PRECISION,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Standing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Crop_parcelId_idx" ON "Crop"("parcelId");
CREATE INDEX IF NOT EXISTS "Crop_cropType_idx" ON "Crop"("cropType");

-- ===========================================================================
-- 6. LAND SUPPORTING DOCUMENT
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "LandDocument" (
    "id" TEXT NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "farmId" INTEGER,
    "documentType" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'LOCAL',
    "bucketName" TEXT NOT NULL DEFAULT 'agrivista-documents',
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'Pending',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LandDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LandDocument_farmerId_idx" ON "LandDocument"("farmerId");

-- ===========================================================================
-- 7. DAMAGE INCIDENT REPORT
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "DamageReport" (
    "id" SERIAL NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "parcelId" INTEGER NOT NULL,
    "cropId" INTEGER NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "calamityType" TEXT NOT NULL,
    "reportedDamagePercent" DOUBLE PRECISION NOT NULL,
    "reportedAffectedAreaHa" DOUBLE PRECISION NOT NULL,
    "narrativeDescription" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DamageReport_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DamageReport_reportNumber_key" ON "DamageReport"("reportNumber");
CREATE INDEX IF NOT EXISTS "DamageReport_farmerId_idx" ON "DamageReport"("farmerId");
CREATE INDEX IF NOT EXISTS "DamageReport_parcelId_idx" ON "DamageReport"("parcelId");
CREATE INDEX IF NOT EXISTS "DamageReport_incidentDate_idx" ON "DamageReport"("incidentDate");

-- ===========================================================================
-- 8. DAMAGE EVIDENCE PHOTO
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "DamagePhoto" (
    "id" TEXT NOT NULL,
    "reportId" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'LOCAL',
    "bucketName" TEXT NOT NULL DEFAULT 'agrivista-damage-photos',
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DamagePhoto_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "DamagePhoto_reportId_idx" ON "DamagePhoto"("reportId");

-- ===========================================================================
-- 9. EXTRACTED EXIF METADATA
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "PhotoMetadata" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "hasExif" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "capturedDate" TIMESTAMP(3),
    "deviceMake" TEXT,
    "deviceModel" TEXT,
    "rawExifData" JSONB,
    CONSTRAINT "PhotoMetadata_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PhotoMetadata_photoId_key" ON "PhotoMetadata"("photoId");

-- ===========================================================================
-- 10. DETERMINISTIC METADATA VERIFICATION
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "MetadataVerification" (
    "id" TEXT NOT NULL,
    "metadataId" TEXT NOT NULL,
    "parcelId" INTEGER NOT NULL,
    "calculatedDistanceMeters" DOUBLE PRECISION,
    "acceptableThresholdMeters" DOUBLE PRECISION NOT NULL DEFAULT 500.0,
    "timestampDifferenceHours" DOUBLE PRECISION,
    "status" "VerificationStatus" NOT NULL DEFAULT 'REQUIRES_REVIEW',
    "verificationNotes" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MetadataVerification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MetadataVerification_metadataId_key" ON "MetadataVerification"("metadataId");
CREATE INDEX IF NOT EXISTS "MetadataVerification_status_idx" ON "MetadataVerification"("status");

-- ===========================================================================
-- 10b. RSBSA OBJECTIVE #2 PHOTO VERIFICATION (PARCEL GPS AUDIT)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "PhotoVerification" (
    "id" TEXT NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "farmId" INTEGER NOT NULL,
    "parcelId" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'LOCAL',
    "bucketName" TEXT NOT NULL DEFAULT 'agrivista-verifications',
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "photoTimestamp" TIMESTAMP(3),
    "photoLatitude" DOUBLE PRECISION,
    "photoLongitude" DOUBLE PRECISION,
    "photoAltitude" DOUBLE PRECISION,
    "deviceMake" TEXT,
    "deviceModel" TEXT,
    "registeredLatitude" DOUBLE PRECISION,
    "registeredLongitude" DOUBLE PRECISION,
    "calculatedDistanceMeters" DOUBLE PRECISION,
    "thresholdMeters" DOUBLE PRECISION NOT NULL DEFAULT 500.0,
    "verificationStatus" TEXT NOT NULL,
    "gpsStatus" TEXT NOT NULL,
    "timestampStatus" TEXT NOT NULL,
    "failureReasonCode" TEXT,
    "verificationNotes" TEXT,
    "metadataJson" JSONB,
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PhotoVerification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PhotoVerification_farmerId_idx" ON "PhotoVerification"("farmerId");
CREATE INDEX IF NOT EXISTS "PhotoVerification_farmId_idx" ON "PhotoVerification"("farmId");
CREATE INDEX IF NOT EXISTS "PhotoVerification_parcelId_idx" ON "PhotoVerification"("parcelId");
CREATE INDEX IF NOT EXISTS "PhotoVerification_verificationStatus_idx" ON "PhotoVerification"("verificationStatus");
CREATE INDEX IF NOT EXISTS "PhotoVerification_createdAt_idx" ON "PhotoVerification"("createdAt" DESC);

-- ===========================================================================
-- 11. FIELD DAMAGE ASSESSMENT
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "DamageAssessment" (
    "id" TEXT NOT NULL,
    "reportId" INTEGER NOT NULL,
    "assessedDamagePercent" DOUBLE PRECISION NOT NULL,
    "assessedAreaHa" DOUBLE PRECISION NOT NULL,
    "cropStage" TEXT NOT NULL,
    "assessorNotes" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DamageAssessment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DamageAssessment_reportId_key" ON "DamageAssessment"("reportId");

-- ===========================================================================
-- 12. ML MODEL REGISTRY & METRICS
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "MlModelRegistry" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "targetVariable" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "trainingPeriod" TEXT NOT NULL,
    "mae" DOUBLE PRECISION NOT NULL,
    "rmse" DOUBLE PRECISION NOT NULL,
    "r2Score" DOUBLE PRECISION NOT NULL,
    "featuresUsed" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MlModelRegistry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MlModelRegistry_modelName_key" ON "MlModelRegistry"("modelName");

-- ===========================================================================
-- 13. CROP PREDICTION (DECISION SUPPORT ONLY)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "CropPrediction" (
    "id" TEXT NOT NULL,
    "reportId" INTEGER NOT NULL,
    "cropId" INTEGER NOT NULL,
    "modelId" TEXT,
    "projectedNormalYieldTons" DOUBLE PRECISION NOT NULL,
    "predictedRemainingYieldTons" DOUBLE PRECISION NOT NULL,
    "predictedYieldReductionPercent" DOUBLE PRECISION NOT NULL,
    "estimatedEconomicLossPhp" DOUBLE PRECISION NOT NULL,
    "inputFeaturesSnapshot" JSONB NOT NULL,
    "predictionTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CropPrediction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CropPrediction_reportId_key" ON "CropPrediction"("reportId");

-- ===========================================================================
-- 14. PCIC-RELATED CLAIM MONITORING DOCKET
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "PcicClaim" (
    "id" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "reportId" INTEGER NOT NULL,
    "claimStatus" "ClaimStatus" NOT NULL DEFAULT 'SUBMITTED',
    "insurancePolicyNo" TEXT,
    "filingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    CONSTRAINT "PcicClaim_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PcicClaim_claimNumber_key" ON "PcicClaim"("claimNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "PcicClaim_reportId_key" ON "PcicClaim"("reportId");
CREATE INDEX IF NOT EXISTS "PcicClaim_claimStatus_idx" ON "PcicClaim"("claimStatus");

-- ===========================================================================
-- 15. CLAIM PRIORITY SCORE & RANKING
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "ClaimPriorityScore" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "priorityLevel" "PriorityLevel" NOT NULL,
    "rankPosition" INTEGER,
    "formulaBreakdown" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClaimPriorityScore_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClaimPriorityScore_claimId_key" ON "ClaimPriorityScore"("claimId");
CREATE INDEX IF NOT EXISTS "ClaimPriorityScore_priorityLevel_idx" ON "ClaimPriorityScore"("priorityLevel");
CREATE INDEX IF NOT EXISTS "ClaimPriorityScore_score_idx" ON "ClaimPriorityScore"("score" DESC);

-- ===========================================================================
-- 16. INVENTORY CATALOG ITEM
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "InventoryItem" (
    "id" SERIAL NOT NULL,
    "itemCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "InventoryCategory" NOT NULL,
    "unit" TEXT NOT NULL,
    "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryItem_itemCode_key" ON "InventoryItem"("itemCode");

-- ===========================================================================
-- 17. INVENTORY BATCH (FIFO MONITORED)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "InventoryBatch" (
    "id" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "receivedQuantity" DOUBLE PRECISION NOT NULL,
    "remainingQuantity" DOUBLE PRECISION NOT NULL,
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "viabilityDate" TIMESTAMP(3),
    "supplierSource" TEXT,
    "storageLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InventoryBatch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InventoryBatch_itemId_remainingQuantity_idx" ON "InventoryBatch"("itemId", "remainingQuantity");
CREATE INDEX IF NOT EXISTS "InventoryBatch_dateReceived_idx" ON "InventoryBatch"("dateReceived");

-- ===========================================================================
-- 18. FIFO DISTRIBUTION TRANSACTION RECORD
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "DistributionRecord" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "quantityDistributed" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "distributionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedById" TEXT NOT NULL,
    "purpose" TEXT,
    "remarks" TEXT,
    CONSTRAINT "DistributionRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "DistributionRecord_batchId_idx" ON "DistributionRecord"("batchId");
CREATE INDEX IF NOT EXISTS "DistributionRecord_farmerId_idx" ON "DistributionRecord"("farmerId");
CREATE INDEX IF NOT EXISTS "DistributionRecord_distributionDate_idx" ON "DistributionRecord"("distributionDate");

-- ===========================================================================
-- 19. HISTORICAL AGRICULTURAL DATA
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "HistoricalAgriculturalData" (
    "id" SERIAL NOT NULL,
    "barangay" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "season" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "plantedAreaHa" DOUBLE PRECISION NOT NULL,
    "harvestedAreaHa" DOUBLE PRECISION NOT NULL,
    "productionTons" DOUBLE PRECISION NOT NULL,
    "averageYieldTonsHa" DOUBLE PRECISION NOT NULL,
    "seedUsageKg" DOUBLE PRECISION,
    "fertilizerUsageBags" DOUBLE PRECISION,
    "soilType" TEXT,
    "calamityOccurrences" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoricalAgriculturalData_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HistoricalAgriculturalData_barangay_cropType_year_idx" ON "HistoricalAgriculturalData"("barangay", "cropType", "year");

-- ===========================================================================
-- 20. RESOURCE DEMAND FORECAST
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "ResourceDemandForecast" (
    "id" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "forecastYear" INTEGER NOT NULL,
    "forecastSeason" TEXT NOT NULL,
    "projectedAreaHa" DOUBLE PRECISION NOT NULL,
    "forecastSeedKg" DOUBLE PRECISION NOT NULL,
    "forecastFertilizerBags" DOUBLE PRECISION NOT NULL,
    "methodUsed" TEXT NOT NULL,
    "confidenceMetric" DOUBLE PRECISION,
    "limitationsNotice" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResourceDemandForecast_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ResourceDemandForecast_barangay_forecastYear_idx" ON "ResourceDemandForecast"("barangay", "forecastYear");

-- ===========================================================================
-- 21. IMMUTABLE SYSTEM AUDIT TRAIL
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "roleSnapshot" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT,
    "previousValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AuditLog_module_action_idx" ON "AuditLog"("module", "action");
CREATE INDEX IF NOT EXISTS "AuditLog_timestamp_idx" ON "AuditLog"("timestamp" DESC);

-- ===========================================================================
-- FOREIGN KEY CONSTRAINTS (idempotent)
-- ===========================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Farm_farmerId_fkey') THEN
    ALTER TABLE "Farm" ADD CONSTRAINT "Farm_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FarmParcel_farmId_fkey') THEN
    ALTER TABLE "FarmParcel" ADD CONSTRAINT "FarmParcel_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Crop_parcelId_fkey') THEN
    ALTER TABLE "Crop" ADD CONSTRAINT "Crop_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "FarmParcel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LandDocument_farmerId_fkey') THEN
    ALTER TABLE "LandDocument" ADD CONSTRAINT "LandDocument_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LandDocument_farmId_fkey') THEN
    ALTER TABLE "LandDocument" ADD CONSTRAINT "LandDocument_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LandDocument_uploadedById_fkey') THEN
    ALTER TABLE "LandDocument" ADD CONSTRAINT "LandDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DamageReport_farmerId_fkey') THEN
    ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DamageReport_parcelId_fkey') THEN
    ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "FarmParcel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DamageReport_cropId_fkey') THEN
    ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DamageReport_createdById_fkey') THEN
    ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DamagePhoto_reportId_fkey') THEN
    ALTER TABLE "DamagePhoto" ADD CONSTRAINT "DamagePhoto_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DamageReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PhotoMetadata_photoId_fkey') THEN
    ALTER TABLE "PhotoMetadata" ADD CONSTRAINT "PhotoMetadata_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "DamagePhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MetadataVerification_metadataId_fkey') THEN
    ALTER TABLE "MetadataVerification" ADD CONSTRAINT "MetadataVerification_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "PhotoMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MetadataVerification_parcelId_fkey') THEN
    ALTER TABLE "MetadataVerification" ADD CONSTRAINT "MetadataVerification_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "FarmParcel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PhotoVerification_farmerId_fkey') THEN
    ALTER TABLE "PhotoVerification" ADD CONSTRAINT "PhotoVerification_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PhotoVerification_farmId_fkey') THEN
    ALTER TABLE "PhotoVerification" ADD CONSTRAINT "PhotoVerification_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PhotoVerification_parcelId_fkey') THEN
    ALTER TABLE "PhotoVerification" ADD CONSTRAINT "PhotoVerification_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "FarmParcel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PhotoVerification_verifiedById_fkey') THEN
    ALTER TABLE "PhotoVerification" ADD CONSTRAINT "PhotoVerification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DamageAssessment_reportId_fkey') THEN
    ALTER TABLE "DamageAssessment" ADD CONSTRAINT "DamageAssessment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DamageReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CropPrediction_reportId_fkey') THEN
    ALTER TABLE "CropPrediction" ADD CONSTRAINT "CropPrediction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DamageReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CropPrediction_cropId_fkey') THEN
    ALTER TABLE "CropPrediction" ADD CONSTRAINT "CropPrediction_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CropPrediction_modelId_fkey') THEN
    ALTER TABLE "CropPrediction" ADD CONSTRAINT "CropPrediction_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "MlModelRegistry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PcicClaim_reportId_fkey') THEN
    ALTER TABLE "PcicClaim" ADD CONSTRAINT "PcicClaim_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DamageReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClaimPriorityScore_claimId_fkey') THEN
    ALTER TABLE "ClaimPriorityScore" ADD CONSTRAINT "ClaimPriorityScore_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "PcicClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryBatch_itemId_fkey') THEN
    ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DistributionRecord_batchId_fkey') THEN
    ALTER TABLE "DistributionRecord" ADD CONSTRAINT "DistributionRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DistributionRecord_farmerId_fkey') THEN
    ALTER TABLE "DistributionRecord" ADD CONSTRAINT "DistributionRecord_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DistributionRecord_releasedById_fkey') THEN
    ALTER TABLE "DistributionRecord" ADD CONSTRAINT "DistributionRecord_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_userId_fkey') THEN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- =============================================================================
-- End of complete schema baseline migration.
-- =============================================================================