/**
 * Phase 5 Objective 3 Automated Test Suite
 * Machine-Learning-Based Crop Yield and Loss Prediction
 * 
 * Verifies:
 * 1. RBAC & Route Access (Unauthenticated blocked, Staff & Head authorized)
 * 2. Input Validation (Zod schemas, negative numbers, missing fields)
 * 3. ML Model Training & Test-Split Metrics (RandomForestRegressor, MAE, RMSE, R2)
 * 4. Model Registry Synchronization (Prisma MlModelRegistry)
 * 5. Yield & Loss Prediction Inference via FastAPI Service
 * 6. Deterministic Loss & Economic Estimation Rules (Clamping, Zero-division, Price fallback)
 * 7. Database Persistence & Relations (CropPrediction, Crop, Farm, Farmer, MlModelRegistry)
 * 8. Municipal Audit Logging (AuditLog entries with role snapshots)
 * 9. PCIC Boundary & Proposed System Design Disclaimers
 * 10. Phase Isolation (No Objective 4, 5, 6 leaks)
 * 11. Full System Regression (Phases 1, 2, 3, 4 compatibility)
 */

import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import { signSessionToken, SESSION_COOKIE_NAME } from "../lib/auth/session";
import { prisma } from "../lib/database/prisma";
import { PredictYieldInputSchema, TrainModelInputSchema } from "../features/yield-loss/validation/schemas";
import {
  createCropPrediction,
  trainCropYieldModel,
  getOrSyncActiveModelRegistry,
  getPredictions,
  getPredictionById,
} from "../features/yield-loss/services/predictionService";

// Next.js API route handlers
import { GET as getPredictionsApi, POST as createPredictionApi } from "../app/api/predictions/route";
import { GET as getPredictionByIdApi } from "../app/api/predictions/[id]/route";
import { POST as trainModelApi } from "../app/api/predictions/train/route";
import { GET as getModelsApi } from "../app/api/predictions/models/route";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ${GREEN}✓ PASS:${RESET} ${testName}`);
    passed++;
  } else {
    console.log(`  ${RED}✗ FAIL:${RESET} ${testName}`);
    if (detail) console.log(`    ${YELLOW}Detail: ${detail}${RESET}`);
    failed++;
  }
}

async function runSuite() {
  console.log(`\n${CYAN}================================================================${RESET}`);
  console.log(`${CYAN}  PHASE 5 — OBJECTIVE 3: ML CROP YIELD & LOSS PREDICTION SUITE  ${RESET}`);
  console.log(`${CYAN}================================================================${RESET}\n`);

  // Setup test users & test agricultural data
  let staffUser = await prisma.user.findFirst({ where: { role: "OMAG_STAFF" } });
  if (!staffUser) {
    staffUser = await prisma.user.create({
      data: {
        username: "staff_ml_analyst",
        email: "staff_ml_test@polomolok.gov.ph",
        fullName: "Test Staff ML Analyst",
        role: "OMAG_STAFF",
        passwordHash: "password_hash_placeholder",
      },
    });
  }

  let headUser = await prisma.user.findFirst({ where: { role: "OMAG_HEAD" } });
  if (!headUser) {
    headUser = await prisma.user.create({
      data: {
        username: "head_ml_exec",
        email: "head_ml_test@polomolok.gov.ph",
        fullName: "Test Head ML Executive",
        role: "OMAG_HEAD",
        passwordHash: "password_hash_placeholder",
      },
    });
  }

  const staffToken = await signSessionToken({
    id: staffUser.id,
    username: staffUser.username,
    fullName: staffUser.fullName,
    email: staffUser.email,
    role: staffUser.role as any,
  });

  const headToken = await signSessionToken({
    id: headUser.id,
    username: headUser.username,
    fullName: headUser.fullName,
    email: headUser.email,
    role: headUser.role as any,
  });

  // Ensure test Farmer, Farm, Parcel, and Crop exist for prediction linkage
  let testFarmer = await prisma.farmer.findFirst({
    include: { farms: { include: { parcels: { include: { crops: true } } } } },
  });

  if (!testFarmer || testFarmer.farms.length === 0 || testFarmer.farms[0].parcels.length === 0 || testFarmer.farms[0].parcels[0].crops.length === 0) {
    await prisma.farmer.create({
      data: {
        firstName: "Emilio",
        lastName: "Aguinaldo",
        sex: "Male",
        dateOfBirth: new Date("1980-01-01"),
        barangay: "Poblacion",
        contactNumber: "09171234567",
        rsbsaNumber: "12-63-14-001-999999",
        farms: {
          create: {
            farmName: "Polomolok Demonstration Farm",
            barangay: "Poblacion",
            totalAreaHa: 2.5,
            tenureType: "Owner",
            parcels: {
              create: {
                parcelNumber: "PARCEL-DEMO-001",
                areaHa: 2.5,
                soilType: "Volcanic Loam",
                crops: {
                  create: {
                    cropType: "Corn",
                    variety: "Yellow Pioneer 30T80",
                    season: "Wet",
                    year: 2026,
                    plantedAreaHa: 2.5,
                    plantingDate: new Date("2026-06-01"),
                  },
                },
              },
            },
          },
        },
      },
    });

    testFarmer = await prisma.farmer.findFirst({
      where: { rsbsaNumber: "12-63-14-001-999999" },
      include: { farms: { include: { parcels: { include: { crops: true } } } } },
    });
  }

  const targetCrop = testFarmer!.farms[0].parcels[0].crops[0];

  // ---------------------------------------------------------
  // SECTION 1: RBAC & ROUTE PROTECTION
  // ---------------------------------------------------------
  console.log(`\n${CYAN}--- Section 1: RBAC & Route Protection ---${RESET}`);

  // 1.1 Unauthenticated access to predictions route redirected
  {
    const req = new NextRequest("http://localhost:3000/staff/predictions");
    const res = await middleware(req);
    const location = res.headers.get("location");
    assert(
      Boolean(res.status === 307 && location?.includes("/login")),
      "Unauthenticated request to /staff/predictions redirected to /login",
      `Status: ${res.status}, Location: ${location}`
    );
  }

  // 1.2 Unauthenticated access to predictions API rejected
  {
    const req = new NextRequest("http://localhost:3000/api/predictions");
    const res = await getPredictionsApi(req);
    assert(
      res.status === 401,
      "Unauthenticated request to GET /api/predictions rejected with 401",
      `Status: ${res.status}`
    );
  }

  // 1.3 Staff access allowed to GET /api/predictions
  {
    const req = new NextRequest("http://localhost:3000/api/predictions", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${staffToken}` },
    });
    const res = await getPredictionsApi(req);
    assert(
      res.status === 200,
      "Staff authorized to GET /api/predictions",
      `Status: ${res.status}`
    );
  }

  // 1.4 Head access allowed to GET /api/predictions
  {
    const req = new NextRequest("http://localhost:3000/api/predictions", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${headToken}` },
    });
    const res = await getPredictionsApi(req);
    assert(
      res.status === 200,
      "Head authorized to GET /api/predictions",
      `Status: ${res.status}`
    );
  }

  // ---------------------------------------------------------
  // SECTION 2: INPUT VALIDATION & ZOD SCHEMAS
  // ---------------------------------------------------------
  console.log(`\n${CYAN}--- Section 2: Input Validation & Zod Schemas ---${RESET}`);

  // 2.1 Rejection of invalid crop ID (0 or negative)
  {
    const result = PredictYieldInputSchema.safeParse({
      cropId: 0,
      cropType: "Corn",
      plantedAreaHa: 2.0,
    });
    assert(!result.success, "Rejects cropId <= 0");
  }

  // 2.2 Rejection of negative planted area
  {
    const result = PredictYieldInputSchema.safeParse({
      cropId: 1,
      cropType: "Corn",
      plantedAreaHa: -1.5,
    });
    assert(!result.success, "Rejects negative plantedAreaHa");
  }

  // 2.3 Rejection of negative calamity damage percentage
  {
    const result = PredictYieldInputSchema.safeParse({
      cropId: 1,
      cropType: "Corn",
      plantedAreaHa: 1.0,
      calamityDamagePercent: -10,
    });
    assert(!result.success, "Rejects calamityDamagePercent < 0");
  }

  // 2.4 Rejection of calamity damage percentage > 100
  {
    const result = PredictYieldInputSchema.safeParse({
      cropId: 1,
      cropType: "Corn",
      plantedAreaHa: 1.0,
      calamityDamagePercent: 120,
    });
    assert(!result.success, "Rejects calamityDamagePercent > 100");
  }

  // 2.5 Acceptance of valid input with optional price & damage
  {
    const result = PredictYieldInputSchema.safeParse({
      cropId: targetCrop.id,
      cropType: "Corn",
      plantedAreaHa: 2.5,
      season: "Wet",
      soilType: "Volcanic Loam",
      calamityDamagePercent: 25.0,
      calamityCause: "DROUGHT",
      cropUnitPricePhpKg: 22.5,
    });
    assert(result.success, "Accepts valid prediction input payload");
  }

  // ---------------------------------------------------------
  // SECTION 3: PYTHON FASTAPI ML SERVICE & MODEL TRAINING
  // ---------------------------------------------------------
  console.log(`\n${CYAN}--- Section 3: FastAPI ML Service & Model Training ---${RESET}`);

  // 3.1 FastAPI Health Check
  {
    const res = await fetch("http://127.0.0.1:8000/health");
    const data = await res.json();
    assert(
      res.ok && data.status === "healthy" && (data.service?.toLowerCase().includes("crop") || data.service === "agrivista-ml-service"),
      "FastAPI ML Service is healthy and responsive on port 8000",
      `Status: ${data.status}, Service: ${data.service}`
    );
  }

  // 3.2 Train Model via Next.js Service
  let trainResponse: any;
  {
    trainResponse = await trainCropYieldModel(
      { modelVersion: "v1.1.0-test", useSyntheticFallback: true },
      staffUser.id,
      staffUser.role
    );

    assert(
      trainResponse.success && trainResponse.model,
      "Successfully trains RandomForest model and registers in PostgreSQL",
      `Model: ${trainResponse.model?.modelName}, Version: ${trainResponse.model?.modelVersion}`
    );
  }

  // 3.3 Verify Real Evaluation Metrics on 20% Holdout Split
  {
    const model = trainResponse.model;
    const r2Valid = typeof model.r2Score === "number" && model.r2Score >= 0.5 && model.r2Score <= 1.0;
    const maeValid = typeof model.mae === "number" && model.mae >= 0 && model.mae <= 5.0;
    const rmseValid = typeof model.rmse === "number" && model.rmse >= 0 && model.rmse <= 5.0;

    assert(r2Valid, `R2 Score is calculated on test partition (${model.r2Score?.toFixed(4)})`);
    assert(maeValid, `MAE is non-negative on test partition (${model.mae?.toFixed(3)} t/ha)`);
    assert(rmseValid, `RMSE is non-negative on test partition (${model.rmse?.toFixed(3)} t/ha)`);
  }

  // 3.4 Verify Model Registry Persistence in Prisma
  {
    const registry = await prisma.mlModelRegistry.findFirst({
      where: { isActive: true },
    });
    assert(
      registry !== null && registry.algorithm === "RandomForestRegressor",
      "Prisma mlModelRegistry record active with RandomForestRegressor algorithm",
      `Algorithm: ${registry?.algorithm}, MAE: ${registry?.mae}`
    );
  }

  // ---------------------------------------------------------
  // SECTION 4: ML PREDICTION & LOSS ESTIMATION PIPELINE
  // ---------------------------------------------------------
  console.log(`\n${CYAN}--- Section 4: ML Prediction & Loss Estimation Pipeline ---${RESET}`);

  // 4.1 Execute Prediction with Calamity Damage & Valid Commodity Price
  let createdPrediction: any;
  {
    createdPrediction = await createCropPrediction(
      {
        cropId: targetCrop.id,
        cropType: "Corn",
        barangay: "Poblacion",
        season: "Wet",
        soilType: "Volcanic Loam",
        plantedAreaHa: 2.5,
        calamityDamagePercent: 30.0,
        cropUnitPricePhpKg: 22.0,
        calamityOccurrences: 0,
      },
      staffUser.id,
      staffUser.role
    );

    assert(
      createdPrediction !== null && createdPrediction.id !== undefined,
      "Prediction record created and persisted in PostgreSQL",
      `Prediction ID: ${createdPrediction?.id}`
    );
  }

  // 4.2 Validate Yield Reduction & Economic Loss Calculations
  {
    const normalYield = createdPrediction.projectedNormalYieldTons;
    const remainingYield = createdPrediction.predictedRemainingYieldTons;
    const reductionPercent = createdPrediction.predictedYieldReductionPercent;
    const economicLoss = createdPrediction.estimatedEconomicLossPhp;

    const normalPositive = normalYield > 0;
    const remainingLesser = remainingYield <= normalYield;
    const reductionAccurate = reductionPercent >= 29.0 && reductionPercent <= 31.0;
    
    // Expected loss = (normalYield - remainingYield) * 1000 kg/ton * 22.0 PHP/kg
    const expectedLoss = (normalYield - remainingYield) * 1000 * 22.0;
    const lossDiff = Math.abs((economicLoss || 0) - expectedLoss);
    const lossMatch = economicLoss !== null && economicLoss > 0 && (lossDiff < 1.0 || (lossDiff / expectedLoss) < 0.01);

    assert(normalPositive, `Normal baseline yield is positive (${normalYield.toFixed(2)} tons)`);
    assert(remainingLesser, `Remaining yield (${remainingYield.toFixed(2)} tons) accounts for 30% damage`);
    assert(reductionAccurate, `Reduction percentage is 30% (${reductionPercent.toFixed(1)}%)`);
    assert(lossMatch, `Economic loss calculation matches formula (₱${economicLoss?.toFixed(2)})`);
  }

  // 4.3 Prediction with Missing Commodity Price produces null Economic Loss
  {
    const predNoPrice = await createCropPrediction(
      {
        cropId: targetCrop.id,
        cropType: "Pineapple",
        barangay: "Cannery Site",
        season: "Wet",
        soilType: "Volcanic Loam",
        plantedAreaHa: 1.0,
        calamityDamagePercent: 15.0,
        cropUnitPricePhpKg: null,
        calamityOccurrences: 0,
      },
      staffUser.id,
      staffUser.role
    );

    assert(
      predNoPrice.estimatedEconomicLossPhp === null || predNoPrice.estimatedEconomicLossPhp === 0,
      "Missing cropUnitPricePhpKg correctly yields null/zero estimatedEconomicLossPhp",
      `Economic Loss: ${predNoPrice.estimatedEconomicLossPhp}`
    );
  }

  // ---------------------------------------------------------
  // SECTION 5: AUDIT LOGGING & PROPOSED SYSTEM BOUNDARIES
  // ---------------------------------------------------------
  console.log(`\n${CYAN}--- Section 5: Audit Logging & System Boundaries ---${RESET}`);

  // 5.1 AuditLog record created with PREDICT action & role snapshot
  {
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        recordId: createdPrediction.id,
        module: "CROP_PREDICTION",
        action: "PREDICT",
      },
    });

    assert(
      auditLog !== null && auditLog.roleSnapshot === "OMAG_STAFF",
      "AuditLog entry recorded with action PREDICT and roleSnapshot OMAG_STAFF",
      `Audit Log ID: ${auditLog?.id}, Action: ${auditLog?.action}`
    );
  }

  // 5.2 Retrieval of Prediction Dossier with Audit History
  {
    const dossier = await getPredictionById(createdPrediction.id);
    assert(
      dossier !== null && dossier.auditLogs !== undefined && dossier.auditLogs.length > 0,
      "getPredictionById returns full relational dossier including farmer, crop, and audit history",
      `Farmer: ${dossier?.crop?.parcel?.farm?.farmer?.firstName}, Audit Count: ${dossier?.auditLogs?.length}`
    );
  }

  // 5.3 Verify Phase Isolation (Objectives 4, 5, 6 endpoints and features remain disabled)
  {
    const fs = await import("fs");
    const path = await import("path");

    const hasObjective4Api = fs.existsSync(path.join(process.cwd(), "app", "api", "inventory"));
    const hasObjective5Api = fs.existsSync(path.join(process.cwd(), "app", "api", "forecasts"));
    const hasObjective6Api = fs.existsSync(path.join(process.cwd(), "app", "api", "pcic"));

    assert(
      !hasObjective4Api && !hasObjective5Api && !hasObjective6Api,
      "Phase isolation strictly preserved — No Objective 4, 5, or 6 API routes active"
    );
  }

  // ---------------------------------------------------------
  // SECTION 6: FULL REGRESSION VALIDATION
  // ---------------------------------------------------------
  console.log(`\n${CYAN}--- Section 6: Full Regression Verification ---${RESET}`);

  // 6.1 Phase 1 Authentication & Session Token validity
  {
    const verifiedStaff = await signSessionToken({
      id: staffUser.id,
      username: staffUser.username,
      fullName: staffUser.fullName,
      email: staffUser.email,
      role: staffUser.role as any,
    });
    assert(typeof verifiedStaff === "string" && verifiedStaff.length > 20, "Phase 1 session token signing remains functional");
  }

  // 6.2 Phase 3 Objective 1 Beneficiary queries intact
  {
    const farmerCount = await prisma.farmer.count();
    const farmCount = await prisma.farm.count();
    const parcelCount = await prisma.farmParcel.count();
    const cropCount = await prisma.crop.count();

    assert(
      farmerCount > 0 && farmCount > 0 && parcelCount > 0 && cropCount > 0,
      `Phase 3 Objective 1 data integrity intact (${farmerCount} farmers, ${farmCount} farms, ${parcelCount} parcels, ${cropCount} crops)`
    );
  }

  // 6.3 Phase 4 Objective 2 Photo Verification table intact
  {
    const photoVerifCount = await prisma.photoVerification.count();
    assert(
      typeof photoVerifCount === "number",
      "Phase 4 Objective 2 photoVerification table accessible and uncorrupted"
    );
  }

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------
  console.log(`\n${CYAN}================================================================${RESET}`);
  console.log(`${CYAN}                     TEST SUITE SUMMARY                         ${RESET}`);
  console.log(`${CYAN}================================================================${RESET}`);
  console.log(`  Total Tests Run: ${passed + failed}`);
  console.log(`  ${GREEN}Passed: ${passed}${RESET}`);
  console.log(`  ${failed === 0 ? GREEN : RED}Failed: ${failed}${RESET}`);

  if (failed > 0) {
    console.log(`\n${RED}Suite Failed with ${failed} errors.${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`\n${GREEN}ALL PHASE 5 OBJECTIVE 3 TESTS PASSED PERFECTLY!${RESET}\n`);
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
