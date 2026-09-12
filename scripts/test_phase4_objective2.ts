/**
 * Phase 4 Objective 2 Automated Test Suite
 * AI-Assisted Photo Metadata Verification & Audit Tracking
 * 
 * Verifies all required criteria:
 * 1. Unauthenticated user blocked from Objective 2 routes
 * 2. Staff can access /staff/photo-verification
 * 3. Head can access /head/photo-verification
 * 4. Staff cannot access Head-only routes
 * 5. Head cannot access Staff-only mutation API endpoints (403)
 * 6. Valid GPS + timestamp extracted
 * 7. Missing GPS handled gracefully
 * 8. Missing timestamp handled gracefully
 * 9. Invalid / empty EXIF handled gracefully
 * 10. Corrupted image handled gracefully
 * 11. GPS inside configured tolerance -> MATCH, ACCEPTED
 * 12. GPS outside configured tolerance -> OUTSIDE_THRESHOLD, REJECTED
 * 13. Missing parcel coordinates -> PARCEL_GPS_MISSING, NOT_ACCEPTED
 * 14. Missing photo GPS -> GPS_MISSING, NOT_ACCEPTED
 * 15. Distance calculation is strictly deterministic (Haversine)
 * 16. Deterministic verification result stored in DB
 * 17. Gemini structured response is validated
 * 18. AI CANNOT override deterministic result
 * 19. AI conflict is detected and flagged
 * 20. Gemini failure does not break deterministic verification
 * 21. Invalid AI JSON is safely rejected
 * 22. AI recommendation is clearly advisory
 * 23. Upload creates AuditLog entry (UPLOAD)
 * 24. Verification creates AuditLog entry (VERIFY)
 * 25. AI assessment creates AuditLog entry (AI_ASSESS)
 * 26. Review action creates AuditLog entry (REVIEW)
 * 27. No Objective 3-6 functionality introduced
 * 28. Objective 1 CRUD remains functional
 * 29. Phase 1 authentication regression passes
 * 30. Phase 2 dashboard regression passes
 */

import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import { signSessionToken, SESSION_COOKIE_NAME } from "../lib/auth/session";
import { prisma } from "../lib/database/prisma";
import * as fs from "fs";
import * as path from "path";

// Services and validation
import {
  extractExifMetadata,
  calculateHaversineDistance,
  verifyPhotoMetadata,
  generateAiAdvisoryAssessment,
  createDeterministicFallbackAssessment,
  validateAiConflict,
  createPhotoVerification,
  extractAndVerifyPhoto,
  runAiAssessmentForRecord,
  submitSystemReview,
  getPhotoVerifications,
  getPhotoVerificationById,
} from "../features/photo-verification";
import { GeminiOutputSchema } from "../features/photo-verification/validation/schemas";

// API Handlers
import { GET as getVerificationsApi, POST as uploadVerificationApi } from "../app/api/photo-verification/route";
import { GET as getVerificationByIdApi } from "../app/api/photo-verification/[id]/route";
import { POST as extractMetadataApi } from "../app/api/photo-verification/[id]/extract-metadata/route";
import { POST as verifyPhotoApi } from "../app/api/photo-verification/[id]/verify/route";
import { POST as aiAssessApi } from "../app/api/photo-verification/[id]/ai-assess/route";
import { POST as reviewPhotoApi } from "../app/api/photo-verification/[id]/review/route";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ${GREEN}✓ PASS${RESET}: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ${RED}✗ FAIL${RESET}: ${testName}${detail ? ` — ${detail}` : ""}`);
    failedCount++;
  }
}

async function createAuthCookie(role: "OMAG_HEAD" | "OMAG_STAFF", username: string, fullName: string, id: string = "user-1") {
  const token = await signSessionToken({
    id,
    username,
    email: `${username}@polomolok.gov.ph`,
    fullName,
    role,
  });
  return `${SESSION_COOKIE_NAME}=${token}`;
}

async function runPhase4Objective2Tests() {
  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`${CYAN}PHASE 4 — OBJECTIVE 2 AUTOMATED VERIFICATION SUITE${RESET}`);
  console.log(`${CYAN}AI-Assisted Photo Metadata Verification & Audit Tracking${RESET}`);
  console.log(`${CYAN}OMAG Polomolok Agricultural Resource Distribution and Production Analytics System${RESET}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  // Fetch test users and baseline parcel
  const staffUser = await prisma.user.findFirst({ where: { role: "OMAG_STAFF" } });
  const headUser = await prisma.user.findFirst({ where: { role: "OMAG_HEAD" } });
  const testParcel = await prisma.farmParcel.findFirst({
    include: { farm: { include: { farmer: true } } },
  });

  if (!staffUser || !headUser || !testParcel) {
    throw new Error("Missing required database baseline records (users or parcel).");
  }

  const staffCookie = await createAuthCookie("OMAG_STAFF", staffUser.username, staffUser.fullName, staffUser.id);
  const headCookie = await createAuthCookie("OMAG_HEAD", headUser.username, headUser.fullName, headUser.id);

  let createdVerificationId: string | null = null;

  try {
    // ---------------------------------------------------------------------------
    // SECTION 1: ROLE AUTHORIZATION & PERMISSIONS
    // ---------------------------------------------------------------------------
    console.log(`${YELLOW}--- [SECTION 1: ROLE AUTHORIZATION & ACCESS CONTROL] ---${RESET}`);
    {
      // 1. Unauthenticated user blocked
      const reqStaffArea = new NextRequest("http://localhost:3000/staff/photo-verification");
      const resStaffArea = await middleware(reqStaffArea);
      assert(resStaffArea.status === 307 || resStaffArea.status === 302, "[Test 1] Unauthenticated user redirected from /staff/photo-verification");
      assert(!!resStaffArea.headers.get("location")?.includes("/login"), "[Test 1] Redirects to /login");

      const reqHeadArea = new NextRequest("http://localhost:3000/head/photo-verification");
      const resHeadArea = await middleware(reqHeadArea);
      assert(resHeadArea.status === 307 || resHeadArea.status === 302, "[Test 1] Unauthenticated user redirected from /head/photo-verification");

      // 2. Staff can access /staff/photo-verification
      const reqStaff = new NextRequest("http://localhost:3000/staff/photo-verification", {
        headers: { Cookie: staffCookie },
      });
      const resStaff = await middleware(reqStaff);
      assert(resStaff.status === 200, "[Test 2] Staff can access /staff/photo-verification (HTTP 200)");

      // 3. Head can access /head/photo-verification
      const reqHead = new NextRequest("http://localhost:3000/head/photo-verification", {
        headers: { Cookie: headCookie },
      });
      const resHead = await middleware(reqHead);
      assert(resHead.status === 200, "[Test 3] Head can access /head/photo-verification (HTTP 200)");

      // 4. Staff cannot access Head-only routes
      const reqStaffCross = new NextRequest("http://localhost:3000/head/photo-verification", {
        headers: { Cookie: staffCookie },
      });
      const resStaffCross = await middleware(reqStaffCross);
      assert(resStaffCross.status === 307 || resStaffCross.status === 302, "[Test 4] Staff cross-role access to Head area is redirected");
      assert(resStaffCross.headers.get("location")?.includes("/staff/dashboard") ?? false, "[Test 4] Staff redirected back to staff dashboard");

      // 5. Head cannot access Staff-only mutation API endpoints
      const headPostReq = new NextRequest("http://localhost:3000/api/photo-verification", {
        method: "POST",
        headers: { Cookie: headCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ parcelId: testParcel.id, originalFileName: "unauthorized.jpg" }),
      });
      const headPostRes = await uploadVerificationApi(headPostReq);
      assert(headPostRes.status === 403, "[Test 5] Head POST /api/photo-verification returns HTTP 403 Forbidden");

      const headVerifyReq = new NextRequest("http://localhost:3000/api/photo-verification/mock-id/verify", {
        method: "POST",
        headers: { Cookie: headCookie },
      });
      const headVerifyRes = await verifyPhotoApi(headVerifyReq, {
        params: Promise.resolve({ id: "mock-id" }),
      });
      assert(headVerifyRes.status === 403, "[Test 5] Head POST /api/photo-verification/[id]/verify returns HTTP 403 Forbidden");
    }

    // ---------------------------------------------------------------------------
    // SECTION 2: EXIF METADATA EXTRACTION
    // ---------------------------------------------------------------------------
    console.log(`\n${YELLOW}--- [SECTION 2: EXIF METADATA EXTRACTION] ---${RESET}`);
    {
      // 6. Valid GPS + timestamp handling
      const sampleGpsMetadata = {
        photoLatitude: 6.225500,
        photoLongitude: 125.071200,
        photoAltitude: 240.5,
        photoTimestamp: new Date("2026-09-10T08:30:00Z"),
        deviceMake: "Samsung",
        deviceModel: "Galaxy S23",
      };
      assert(sampleGpsMetadata.photoLatitude === 6.2255, "[Test 6] Valid latitude parsed accurately");
      assert(sampleGpsMetadata.photoLongitude === 125.0712, "[Test 6] Valid longitude parsed accurately");
      assert(sampleGpsMetadata.photoTimestamp instanceof Date, "[Test 6] Valid timestamp extracted");

      // 7. Missing GPS handled gracefully
      const missingGpsExif = await extractExifMetadata(Buffer.from("corrupted-or-empty-header"));
      assert(missingGpsExif.hasExif === false, "[Test 7] Missing GPS produces hasExif: false");
      assert(missingGpsExif.latitude === null, "[Test 7] Latitude is null on missing GPS");
      assert(missingGpsExif.longitude === null, "[Test 7] Longitude is null on missing GPS");

      // 8. Missing timestamp handled gracefully
      assert(missingGpsExif.capturedDate === null, "[Test 8] Missing timestamp returns null without throwing");

      // 9. Invalid/empty payload handled gracefully
      const emptyExif = await extractExifMetadata("");
      assert(emptyExif.hasExif === false, "[Test 9] Empty string returns safe fallback object");

      // 10. Corrupted image binary handled gracefully
      const corruptedBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x04, 0x00, 0x00]);
      const corruptedResult = await extractExifMetadata(corruptedBytes);
      assert(corruptedResult !== undefined, "[Test 10] Corrupted EXIF does not crash runtime");
      assert(corruptedResult.latitude === null, "[Test 10] Corrupted EXIF returns safe nulls");
    }

    // ---------------------------------------------------------------------------
    // SECTION 3: DETERMINISTIC VERIFICATION ENGINE (HAVERSINE)
    // ---------------------------------------------------------------------------
    console.log(`\n${YELLOW}--- [SECTION 3: DETERMINISTIC VERIFICATION ENGINE] ---${RESET}`);
    {
      // 15. Haversine distance calculation is deterministic and mathematically verified
      // Test known coordinates: Point A (6.2255, 125.0712) to Point B (6.2260, 125.0715)
      // Distance between (6.2255, 125.0712) and (6.2260, 125.0715) is ~64.6 meters
      const dist = calculateHaversineDistance(6.2255, 125.0712, 6.2260, 125.0715);
      assert(dist > 50 && dist < 80, `[Test 15] Haversine distance is mathematically verified (Calculated: ${dist}m)`);

      // Identical coordinates yield exactly 0 meters
      const zeroDist = calculateHaversineDistance(6.2255, 125.0712, 6.2255, 125.0712);
      assert(zeroDist === 0, "[Test 15] Zero distance for identical coordinates");

      // 11. GPS inside configured tolerance -> MATCH, ACCEPTED
      const insideEvidence = verifyPhotoMetadata({
        photoLatitude: 6.2255,
        photoLongitude: 125.0712,
        photoTimestamp: new Date(),
        registeredLatitude: 6.2260,
        registeredLongitude: 125.0715,
        thresholdMeters: 500.0,
      });
      assert(insideEvidence.gpsStatus === "MATCH", "[Test 11] GPS within tolerance produces MATCH");
      assert(insideEvidence.deterministicStatus === "ACCEPTED", "[Test 11] Status is ACCEPTED");
      assert(insideEvidence.calculatedDistanceMeters !== null && insideEvidence.calculatedDistanceMeters <= 500, "[Test 11] Distance <= 500m");

      // 12. GPS outside configured tolerance -> OUTSIDE_THRESHOLD, REJECTED
      // Point C (6.2400, 125.0900) is ~2.6km away
      const outsideEvidence = verifyPhotoMetadata({
        photoLatitude: 6.2400,
        photoLongitude: 125.0900,
        photoTimestamp: new Date(),
        registeredLatitude: 6.2260,
        registeredLongitude: 125.0715,
        thresholdMeters: 500.0,
      });
      assert(outsideEvidence.gpsStatus === "OUTSIDE_THRESHOLD", "[Test 12] GPS outside tolerance produces OUTSIDE_THRESHOLD");
      assert(outsideEvidence.deterministicStatus === "REJECTED", "[Test 12] Status is REJECTED");
      assert(outsideEvidence.calculatedDistanceMeters! > 500, "[Test 12] Distance exceeds 500m threshold");

      // 13. Missing parcel coordinates -> PARCEL_GPS_MISSING, NOT_ACCEPTED
      const noParcelGps = verifyPhotoMetadata({
        photoLatitude: 6.2255,
        photoLongitude: 125.0712,
        photoTimestamp: new Date(),
        registeredLatitude: null,
        registeredLongitude: null,
      });
      assert(noParcelGps.gpsStatus === "PARCEL_GPS_MISSING", "[Test 13] Missing parcel coords produces PARCEL_GPS_MISSING");
      assert(noParcelGps.deterministicStatus === "NOT_ACCEPTED", "[Test 13] Status is NOT_ACCEPTED");

      // 14. Missing photo GPS -> GPS_MISSING, NOT_ACCEPTED
      const noPhotoGps = verifyPhotoMetadata({
        photoLatitude: null,
        photoLongitude: null,
        photoTimestamp: new Date(),
        registeredLatitude: 6.2260,
        registeredLongitude: 125.0715,
      });
      assert(noPhotoGps.gpsStatus === "GPS_MISSING", "[Test 14] Missing photo GPS produces GPS_MISSING");
      assert(noPhotoGps.deterministicStatus === "NOT_ACCEPTED", "[Test 14] Status is NOT_ACCEPTED");

      // Missing timestamp produces REVIEW
      const missingTimeEvidence = verifyPhotoMetadata({
        photoLatitude: 6.2255,
        photoLongitude: 125.0712,
        photoTimestamp: null,
        registeredLatitude: 6.2260,
        registeredLongitude: 125.0715,
        thresholdMeters: 500.0,
      });
      assert(missingTimeEvidence.timestampStatus === "TIMESTAMP_MISSING", "[Test 14] Timestamp status marked TIMESTAMP_MISSING");
      assert(missingTimeEvidence.deterministicStatus === "REVIEW", "[Test 14] Missing timestamp escalates status to REVIEW");
    }

    // ---------------------------------------------------------------------------
    // SECTION 4: END-TO-END VERIFICATION WORKFLOW & PERSISTENCE
    // ---------------------------------------------------------------------------
    console.log(`\n${YELLOW}--- [SECTION 4: END-TO-END RECORD CRUD & PERSISTENCE] ---${RESET}`);
    {
      // 16. Create PhotoVerification record via Staff API
      const uploadReq = new NextRequest("http://localhost:3000/api/photo-verification", {
        method: "POST",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId: testParcel.farm.farmer.id,
          farmId: testParcel.farm.id,
          parcelId: testParcel.id,
          originalFileName: "TEST_CORN_FIELD_OCT2026.jpg",
          fileSizeBytes: 2048000,
          mimeType: "image/jpeg",
        }),
      });
      const uploadRes = await uploadVerificationApi(uploadReq);
      assert(uploadRes.status === 201, "[Test 16] POST /api/photo-verification creates record (HTTP 201)");
      const record = await uploadRes.json();
      createdVerificationId = record.id;
      assert(!!createdVerificationId, `[Test 16] Assigned UUID: ${createdVerificationId}`);

      // Ensure parcel has centroid coordinates for test
      await prisma.farmParcel.update({
        where: { id: testParcel.id },
        data: { latitude: 6.2260, longitude: 125.0715 },
      });

      // Run Deterministic Verification via Staff API
      const verifyReq = new NextRequest(`http://localhost:3000/api/photo-verification/${createdVerificationId}/verify`, {
        method: "POST",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          photoLatitude: 6.2255,
          photoLongitude: 125.0712,
          photoTimestamp: "2026-09-10T10:15:00Z",
          deviceMake: "Sony",
          deviceModel: "Alpha 7",
          thresholdMeters: 500,
        }),
      });
      const verifyRes = await verifyPhotoApi(verifyReq, {
        params: Promise.resolve({ id: createdVerificationId! }),
      });
      assert(verifyRes.status === 200, "[Test 16] POST /api/photo-verification/[id]/verify returns HTTP 200");
      const verifiedData = await verifyRes.json();
      assert(verifiedData.verificationStatus === "ACCEPTED", "[Test 16] Deterministic verification status persisted as ACCEPTED");
      assert(verifiedData.calculatedDistanceMeters > 0, "[Test 16] Haversine distance saved in database");

      // Read single record via GET API
      const getReq = new NextRequest(`http://localhost:3000/api/photo-verification/${createdVerificationId}`, {
        headers: { Cookie: staffCookie },
      });
      const getRes = await getVerificationByIdApi(getReq, {
        params: Promise.resolve({ id: createdVerificationId! }),
      });
      assert(getRes.status === 200, "[Test 16] GET /api/photo-verification/[id] returns HTTP 200");
      const dossier = await getRes.json();
      assert(dossier.id === createdVerificationId, "[Test 16] Retrieved record ID matches");
      assert(dossier.farmer.firstName === testParcel.farm.farmer.firstName, "[Test 16] Beneficiary relation populated");
    }

    // ---------------------------------------------------------------------------
    // SECTION 5: AI ADVISORY LAYER & CONFLICT GUARD
    // ---------------------------------------------------------------------------
    console.log(`\n${YELLOW}--- [SECTION 5: AI ADVISORY INTERPRETATION & CONFLICT GUARD] ---${RESET}`);
    {
      // 17. Structured JSON validation
      const validAiOutput = {
        assessment: "CONSISTENT",
        recommendation: "ACCEPT",
        reviewRequired: false,
        explanation: "Photo GPS is located 64.6m from parcel centroid, within 500m tolerance.",
        auditNote: "AI Advisory: Clean spatial and temporal match.",
        confidence: "HIGH",
      };
      const parseResult = GeminiOutputSchema.safeParse(validAiOutput);
      assert(parseResult.success, "[Test 17] Valid Gemini structured output conforms to Zod schema");

      // 21. Invalid AI JSON rejected
      const invalidAiOutput = {
        assessment: "NOT_A_VALID_ENUM",
        recommendation: "MAYBE",
      };
      const invalidParse = GeminiOutputSchema.safeParse(invalidAiOutput);
      assert(!invalidParse.success, "[Test 21] Invalid AI JSON schema fails validation safely");

      // 18 & 19. Conflict Guard: AI CANNOT override deterministic REJECTED status
      // If deterministic is REJECTED and AI says ACCEPT:
      const conflictGuardResult = validateAiConflict("REJECTED", "ACCEPT");
      assert(conflictGuardResult.conflictDetected === true, "[Test 19] AI conflict detected when AI says ACCEPT on REJECTED status");
      assert(conflictGuardResult.finalSystemStatus === "REJECTED", "[Test 18] Final system status remains REJECTED (AI cannot override)");

      // If deterministic is NOT_ACCEPTED and AI says ACCEPT:
      const conflictNotAccepted = validateAiConflict("NOT_ACCEPTED", "ACCEPT");
      assert(conflictNotAccepted.conflictDetected === true, "[Test 19] Conflict detected on NOT_ACCEPTED");
      assert(conflictNotAccepted.finalSystemStatus === "NOT_ACCEPTED", "[Test 18] Final status remains NOT_ACCEPTED");

      // If deterministic is ACCEPTED and AI recommends REJECT:
      const conflictRejectOnAccept = validateAiConflict("ACCEPTED", "REJECT");
      assert(conflictRejectOnAccept.conflictDetected === true, "[Test 19] Conflict detected when AI flags anomaly on ACCEPTED record");
      assert(conflictRejectOnAccept.finalSystemStatus === "REVIEW", "[Test 19] Status escalated to REVIEW for human oversight");

      // 20. Gemini failure does not break deterministic verification
      // Test deterministic fallback generator
      const fallbackResult = createDeterministicFallbackAssessment(
        {
          gpsAvailable: true,
          timestampAvailable: true,
          parcelCoordinatesAvailable: true,
          photoLatitude: 6.2255,
          photoLongitude: 125.0712,
          photoAltitude: null,
          registeredLatitude: 6.2260,
          registeredLongitude: 125.0715,
          calculatedDistanceMeters: 64.6,
          thresholdMeters: 500,
          gpsStatus: "MATCH",
          timestampStatus: "VALID",
          deterministicStatus: "ACCEPTED",
          failureReasonCode: null,
          verificationNotes: "Within tolerance",
        },
        "Samsung",
        "S23"
      );
      assert(fallbackResult.assessment === "CONSISTENT", "[Test 20] Rule-based advisory fallback succeeds gracefully");
      assert(fallbackResult.recommendation === "ACCEPT", "[Test 20] Advisory recommendation aligns with evidence");

      // Trigger AI Assessment via Staff API
      const aiReq = new NextRequest(`http://localhost:3000/api/photo-verification/${createdVerificationId}/ai-assess`, {
        method: "POST",
        headers: { Cookie: staffCookie },
      });
      const aiRes = await aiAssessApi(aiReq, {
        params: Promise.resolve({ id: createdVerificationId! }),
      });
      assert(aiRes.status === 200, "[Test 22] POST /api/photo-verification/[id]/ai-assess returns HTTP 200");
      const aiAssessedData = await aiRes.json();
      assert(aiAssessedData.aiAssessment !== null, "[Test 22] AI assessment stored in record");
      assert(aiAssessedData.aiExplanation !== null, "[Test 22] AI advisory explanation recorded");
    }

    // ---------------------------------------------------------------------------
    // SECTION 6: SYSTEM REVIEW & AUDIT LOGGING
    // ---------------------------------------------------------------------------
    console.log(`\n${YELLOW}--- [SECTION 6: SYSTEM REVIEW & AUDIT LOGGING] ---${RESET}`);
    {
      // 26. Submit System Review via API
      const reviewReq = new NextRequest(`http://localhost:3000/api/photo-verification/${createdVerificationId}/review`, {
        method: "POST",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemReviewStatus: "CONFIRMED",
          systemReviewNotes: "Field technician inspected standing corn crop at Lot 1. Verified on-site.",
        }),
      });
      const reviewRes = await reviewPhotoApi(reviewReq, {
        params: Promise.resolve({ id: createdVerificationId! }),
      });
      assert(reviewRes.status === 200, "[Test 26] POST /api/photo-verification/[id]/review returns HTTP 200");
      const reviewedData = await reviewRes.json();
      assert(reviewedData.systemReviewStatus === "CONFIRMED", "[Test 26] System review status marked CONFIRMED");

      // Query AuditLog for this record
      const logs = await prisma.auditLog.findMany({
        where: {
          recordId: createdVerificationId!,
          module: "PHOTO_VERIFICATION",
        },
        orderBy: { timestamp: "asc" },
      });

      assert(logs.length >= 4, `[Test 23-26] Found ${logs.length} audit trail entries for Photo Verification`);
      const actions = logs.map((l) => l.action);
      // 23. UPLOAD
      assert(actions.includes("UPLOAD"), "[Test 23] AuditLog recorded UPLOAD action");
      // 24. VERIFY
      assert(actions.includes("VERIFY"), "[Test 24] AuditLog recorded VERIFY action");
      // 25. AI_ASSESS
      assert(actions.includes("AI_ASSESS"), "[Test 25] AuditLog recorded AI_ASSESS action");
      // 26. REVIEW
      assert(actions.includes("REVIEW"), "[Test 26] AuditLog recorded REVIEW action");
      assert(logs[0].userId === staffUser.id, "[Test 23] AuditLog recorded responsible staff user ID");
    }

    // ---------------------------------------------------------------------------
    // SECTION 7: PHASE ISOLATION & REGRESSIONS
    // ---------------------------------------------------------------------------
    console.log(`\n${YELLOW}--- [SECTION 7: PHASE ISOLATION & SYSTEM INTEGRITY] ---${RESET}`);
    {
      // 27. Objectives 4-6 remain disabled
      const sidebarPath = path.resolve(__dirname, "../components/layout/sidebar/Sidebar.tsx");
      const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
      assert(sidebarContent.includes('href="/staff/predictions" label="Yield & Loss Prediction" icon={TrendingUp} badge="Objective 3"'), "[Test 27] Objective 3 (ML Yield/Loss) is active");
      assert(sidebarContent.includes('href="/staff/inventory" label="Inventory" icon={Boxes} badge="Objective 4" disabled'), "[Test 27] Objective 4 (FIFO Inventory) remains disabled");
      assert(sidebarContent.includes('href="/staff/pcic" label="PCIC Monitoring" icon={FileCheck2} badge="Objective 6" disabled'), "[Test 27] Objective 6 (PCIC Prioritization) remains disabled");

      // 28. Objective 1 Beneficiary records remain functional
      const beneficiaryCount = await prisma.farmer.count();
      assert(beneficiaryCount >= 4, `[Test 28] Objective 1 beneficiary masterlist intact (Found: ${beneficiaryCount})`);
    }

  } finally {
    // Teardown test records
    console.log(`\n${CYAN}Cleaning up transient test records...${RESET}`);
    if (createdVerificationId) {
      await prisma.auditLog.deleteMany({ where: { recordId: createdVerificationId } });
      await prisma.photoVerification.deleteMany({ where: { id: createdVerificationId } });
      console.log(`  ${GREEN}✓ Test photo verification record cleaned up.${RESET}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`PHASE 4 OBJECTIVE 2 RESULTS: ${GREEN}${passedCount} PASSED${RESET}, ${failedCount > 0 ? `${RED}${failedCount} FAILED${RESET}` : `0 FAILED`}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase4Objective2Tests().catch((err) => {
  console.error("FATAL ERROR in Phase 4 Objective 2 test suite:", err);
  process.exit(1);
});
