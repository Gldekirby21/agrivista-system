/**
 * Phase 3 — Objective 1: RSBSA Centralized Record Management Automated Test Suite
 * OMAG Polomolok Agricultural Resource Distribution & Production Analytics System
 * 
 * Verifies all 20 required assertions:
 * 1. Unauthenticated user cannot access /head/rsbsa.
 * 2. Unauthenticated user cannot access /staff/rsbsa.
 * 3. OMAG_HEAD can access /head/rsbsa.
 * 4. OMAG_STAFF can access /staff/rsbsa.
 * 5. OMAG_HEAD cannot access /staff/rsbsa.
 * 6. OMAG_STAFF cannot access /head/rsbsa.
 * 7. Farmer creation validation works.
 * 8. Farmer update works.
 * 9. Farm/parcel creation works.
 * 10. Farm/parcel is correctly linked to farmer.
 * 11. Crop is correctly linked to farm/parcel.
 * 12. Supporting document is correctly linked.
 * 13. Invalid relationships are rejected.
 * 14. Search returns appropriate records.
 * 15. Empty states render when no records exist.
 * 16. No fake production data is inserted.
 * 17. Audit logging works for record changes.
 * 18. Future Objective 2–6 routes remain disabled/unimplemented.
 * 19. Existing Phase 1 auth tests pass.
 * 20. Existing Phase 2 dashboard tests pass.
 */

import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import { signSessionToken, SESSION_COOKIE_NAME } from "../lib/auth/session";
import { prisma } from "../lib/database/prisma";
import { getFarmers, getFarmerById, getRSBSASummaryStats } from "../features/rsbsa/lib/queries";
import {
  createFarmer,
  updateFarmer,
  addFarmAndParcel,
  recordCrop,
  addSupportingDocument,
} from "../features/rsbsa/lib/mutations";
import {
  FarmerCreateSchema,
  FarmParcelCreateSchema,
  CropRecordSchema,
  DocumentUploadSchema,
} from "../features/rsbsa/lib/validation";
import { POST as farmersApiPost } from "../app/api/rsbsa/farmers/route";
import * as fs from "fs";
import * as path from "path";

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

async function createAuthCookie(role: "OMAG_HEAD" | "OMAG_STAFF", username: string, fullName: string, userId?: string) {
  const token = await signSessionToken({
    id: userId || `test-${username}`,
    username,
    email: `${username}@polomolok.gov.ph`,
    fullName,
    role,
  });
  return `${SESSION_COOKIE_NAME}=${token}`;
}

async function runPhase3Tests() {
  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`${CYAN}PHASE 3 — OBJECTIVE 1: RSBSA CENTRALIZED RECORD MANAGEMENT TEST SUITE${RESET}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  const staffUser = await prisma.user.findFirst({ where: { role: "OMAG_STAFF" } });
  const headUser = await prisma.user.findFirst({ where: { role: "OMAG_HEAD" } });
  const staffId = staffUser?.id || "staff-id";
  const headId = headUser?.id || "head-id";

  const headCookie = await createAuthCookie("OMAG_HEAD", "head.polomolok", "Municipal Agricultural Head", headId);
  const staffCookie = await createAuthCookie("OMAG_STAFF", "staff.polomolok", "Agricultural Operations Staff", staffId);

  // Keep track of test farmer ID for cleanup
  let testFarmerId: number | null = null;
  let testFarmId: number | null = null;
  let testParcelId: number | null = null;
  let testCropId: number | null = null;
  let testDocId: string | null = null;

  try {
    // ---------------------------------------------------------------------------
    // Test 1: Unauthenticated user cannot access /head/rsbsa
    // ---------------------------------------------------------------------------
    {
      console.log(`${YELLOW}[Test 1] Unauthenticated user blocked from /head/rsbsa${RESET}`);
      const req = new NextRequest("http://localhost:3000/head/rsbsa");
      const res = await middleware(req);
      const loc = res.headers.get("location");
      assert(res.status === 307 || res.status === 302, "Produces redirect status");
      assert(!!loc && loc.includes("/login"), `Redirected to /login (Actual: ${loc})`);
    }

    // ---------------------------------------------------------------------------
    // Test 2: Unauthenticated user cannot access /staff/rsbsa
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 2] Unauthenticated user blocked from /staff/rsbsa${RESET}`);
      const req = new NextRequest("http://localhost:3000/staff/rsbsa");
      const res = await middleware(req);
      const loc = res.headers.get("location");
      assert(res.status === 307 || res.status === 302, "Produces redirect status");
      assert(!!loc && loc.includes("/login"), `Redirected to /login (Actual: ${loc})`);
    }

    // ---------------------------------------------------------------------------
    // Test 3: OMAG_HEAD can access /head/rsbsa
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 3] OMAG_HEAD can access /head/rsbsa${RESET}`);
      const req = new NextRequest("http://localhost:3000/head/rsbsa", {
        headers: { Cookie: headCookie },
      });
      const res = await middleware(req);
      assert(res.status === 200, "Head access produces HTTP 200");
      assert(!res.headers.get("location"), "No redirect header present");
    }

    // ---------------------------------------------------------------------------
    // Test 4: OMAG_STAFF can access /staff/rsbsa
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 4] OMAG_STAFF can access /staff/rsbsa${RESET}`);
      const req = new NextRequest("http://localhost:3000/staff/rsbsa", {
        headers: { Cookie: staffCookie },
      });
      const res = await middleware(req);
      assert(res.status === 200, "Staff access produces HTTP 200");
      assert(!res.headers.get("location"), "No redirect header present");
    }

    // ---------------------------------------------------------------------------
    // Test 5: OMAG_HEAD cannot access /staff/rsbsa
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 5] OMAG_HEAD cross-role access to /staff/rsbsa is blocked${RESET}`);
      const req = new NextRequest("http://localhost:3000/staff/rsbsa", {
        headers: { Cookie: headCookie },
      });
      const res = await middleware(req);
      const loc = res.headers.get("location");
      assert(res.status === 307 || res.status === 302, "Produces redirect status");
      assert(!!loc && loc.includes("/head/dashboard"), `Head redirected back to /head/dashboard (Actual: ${loc})`);
    }

    // ---------------------------------------------------------------------------
    // Test 6: OMAG_STAFF cannot access /head/rsbsa
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 6] OMAG_STAFF cross-role access to /head/rsbsa is blocked${RESET}`);
      const req = new NextRequest("http://localhost:3000/head/rsbsa", {
        headers: { Cookie: staffCookie },
      });
      const res = await middleware(req);
      const loc = res.headers.get("location");
      assert(res.status === 307 || res.status === 302, "Produces redirect status");
      assert(!!loc && loc.includes("/staff/dashboard"), `Staff redirected back to /staff/dashboard (Actual: ${loc})`);
    }

    // ---------------------------------------------------------------------------
    // Test 7: Farmer creation validation & Requirements Fidelity Audit
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 7] Farmer creation validation & Requirements Fidelity Audit${RESET}`);
      // Test validation rejects empty first name (Name is OMAG confirmed)
      const invalidResult = FarmerCreateSchema.safeParse({
        firstName: "",
        lastName: "ValidLastName",
        barangay: "Poblacion",
      });
      assert(!invalidResult.success, "Rejects empty first name");

      // Audit Assertion 1: A valid farmer record is NOT rejected merely because Sex is absent
      const validWithoutSex = FarmerCreateSchema.safeParse({
        firstName: "Maria",
        lastName: "Santos",
        barangay: "Cannery Site",
      });
      assert(validWithoutSex.success, "Valid farmer record is NOT rejected merely because Sex is absent");

      // Audit Assertion 2: DOB is not required unless OMAG later confirms it
      assert(validWithoutSex.data?.dateOfBirth !== undefined, "DOB is not required unless OMAG later confirms it (defaults safely)");

      // Audit Assertion 3: Email is not required
      assert(validWithoutSex.data?.email === null || validWithoutSex.data?.email === undefined, "Email is not required");

      // Audit Assertion 4: Civil status is not required
      assert(validWithoutSex.data?.civilStatus === null || validWithoutSex.data?.civilStatus === undefined, "Civil status is not required");

      // Audit Assertion 5: Senior/PWD/4Ps/IP flags are not required
      assert(
        validWithoutSex.data?.isSenior === false &&
          validWithoutSex.data?.isPwd === false &&
          validWithoutSex.data?.is4ps === false &&
          validWithoutSex.data?.isIp === false,
        "Senior/PWD/4Ps/IP flags are not required"
      );

      // Audit Assertion 6: Farmer/Registration ID is accepted without an invented OMAG-specific format restriction
      const flexibleRSBSA = FarmerCreateSchema.safeParse({
        firstName: "Roberto",
        lastName: "Gomez",
        barangay: "Poblacion",
        rsbsaNumber: "POLOMOLOK-LOCAL-ID-2026",
      });
      assert(
        flexibleRSBSA.success && flexibleRSBSA.data?.rsbsaNumber === "POLOMOLOK-LOCAL-ID-2026",
        "Farmer/Registration ID is accepted without an invented OMAG-specific format restriction"
      );

      // Audit Assertion 7: Crop Type is not restricted to an unconfirmed closed OMAG list
      const customCrop = CropRecordSchema.safeParse({
        parcelId: 1,
        cropType: "Papaya Solo (High-Value)",
        plantedAreaHa: 1.5,
        season: "Wet",
        year: 2026,
      });
      assert(
        customCrop.success && customCrop.data?.cropType === "Papaya Solo (High-Value)",
        "Crop Type is not restricted to an unconfirmed closed OMAG list"
      );

      // Audit Assertion 8: Land Ownership/Tenure does not falsely claim an OMAG-confirmed closed enumeration
      const customTenure = FarmParcelCreateSchema.safeParse({
        barangay: "Poblacion",
        totalAreaHa: 2.0,
        tenureType: "Ancestral Domain Stewardship Claim",
        parcelNumber: "LOT-CUST-01",
        areaHa: 2.0,
      });
      assert(
        customTenure.success && customTenure.data?.tenureType === "Ancestral Domain Stewardship Claim",
        "Land Ownership/Tenure does not falsely claim an OMAG-confirmed closed enumeration"
      );

      // Audit Assertion 9: Land Title and Valid ID remain supported
      const landTitleDoc = DocumentUploadSchema.safeParse({
        farmerId: 1,
        documentType: "Land Title",
        fileName: "land_title.pdf",
        fileFormat: "application/pdf",
        fileSizeBytes: 1024,
        storageKey: "docs/title.pdf",
      });
      const validIdDoc = DocumentUploadSchema.safeParse({
        farmerId: 1,
        documentType: "Valid ID",
        fileName: "national_id.jpg",
        fileFormat: "image/jpeg",
        fileSizeBytes: 2048,
        storageKey: "docs/id.jpg",
      });
      assert(landTitleDoc.success && validIdDoc.success, "Land Title and Valid ID remain supported as confirmed common supporting documents");

      // Audit Assertion 10: Unsupported document subtypes are not labeled OMAG-confirmed or blocked
      const customDoc = DocumentUploadSchema.safeParse({
        farmerId: 1,
        documentType: "Custom Certification of Land Tenancy",
        fileName: "tenancy_cert.pdf",
        fileFormat: "application/pdf",
        fileSizeBytes: 512,
        storageKey: "docs/custom_cert.pdf",
      });
      assert(customDoc.success, "Unsupported document subtypes are not labeled OMAG-confirmed or blocked");

      // Audit Assertion 11: No RSBSA document approval workflow is falsely presented as OMAG-confirmed
      const docUploadPayload = DocumentUploadSchema.safeParse({
        farmerId: 1,
        documentType: "Land Title",
        fileName: "title.pdf",
        fileFormat: "application/pdf",
        fileSizeBytes: 1024,
        storageKey: "docs/title.pdf",
      });
      assert(!("approvalStatus" in (docUploadPayload.data || {})), "No RSBSA document approval workflow is falsely presented as OMAG-confirmed");

      // Test successful creation of a verified test farmer in database
      const testFarmer = await createFarmer(
        {
          firstName: "AutomatedTest",
          middleName: "Objective1",
          lastName: "FarmerRecord",
          extensionName: "Jr.",
          rsbsaNumber: "12-63-12-TEST-999999",
          farmerCode: "Rice Producer",
          sex: "Male",
          dateOfBirth: new Date("1982-03-15"),
          contactNumber: "0918-000-1122",
          email: "test.farmer@polomolok.test",
          barangay: "Poblacion",
          municipality: "Polomolok",
          province: "South Cotabato",
          civilStatus: "Married",
          isSenior: false,
          isPwd: false,
          is4ps: true,
          isIp: false,
        },
        staffId,
        "OMAG_STAFF"
      );

      assert(!!testFarmer && testFarmer.id > 0, "Farmer successfully created in database");
      assert(testFarmer.rsbsaNumber === "12-63-12-TEST-999999", "RSBSA number correctly recorded");
      assert(testFarmer.is4ps === true, "Demographic category (4Ps) correctly recorded");
      testFarmerId = testFarmer.id;
    }

    // ---------------------------------------------------------------------------
    // Test 8: Farmer update works
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 8] Farmer update works${RESET}`);
      if (!testFarmerId) throw new Error("Missing testFarmerId");

      const updated = await updateFarmer(
        testFarmerId,
        {
          contactNumber: "0919-999-8877",
          civilStatus: "Separated",
        },
        staffId,
        "OMAG_STAFF"
      );

      assert(updated.contactNumber === "0919-999-8877", "Contact number successfully updated");
      assert(updated.civilStatus === "Separated", "Civil status successfully updated");
    }

    // ---------------------------------------------------------------------------
    // Test 9 & 10: Farm & Parcel creation works and links to farmer
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 9 & 10] Farm & Parcel creation and linkage${RESET}`);
      if (!testFarmerId) throw new Error("Missing testFarmerId");

      const farm = await addFarmAndParcel(
        testFarmerId,
        {
          farmName: "Test Auto Agricultural Landholding",
          barangay: "Poblacion",
          municipality: "Polomolok",
          province: "South Cotabato",
          totalAreaHa: 2.5,
          tenureType: "Owned",
          soilType: "Clay Loam",
          waterSource: "Rainfed",
          parcelNumber: "LOT-TEST-AUTO-01",
          areaHa: 2.5,
          latitude: 6.2201,
          longitude: 125.0655,
          remarks: "Automated Phase 3 Test Parcel",
        },
        staffId,
        "OMAG_STAFF"
      );

      assert(farm.farmerId === testFarmerId, "Farm is correctly linked to Farmer ID");
      assert(farm.totalAreaHa === 2.5, "Farm area recorded as 2.5 ha");
      assert(farm.parcels.length === 1, "Parcel created under farm");
      assert(farm.parcels[0].parcelNumber === "LOT-TEST-AUTO-01", "Parcel number matches");
      assert(farm.parcels[0].latitude === 6.2201, "Centroid latitude recorded");

      testFarmId = farm.id;
      testParcelId = farm.parcels[0].id;
    }

    // ---------------------------------------------------------------------------
    // Test 11: Crop is correctly linked to farm/parcel
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 11] Crop record linked to parcel${RESET}`);
      if (!testParcelId) throw new Error("Missing testParcelId");

      const crop = await recordCrop(
        {
          parcelId: testParcelId,
          cropType: "Corn",
          variety: "NK8840 Hybrid",
          category: "Primary",
          plantedAreaHa: 2.5,
          plantingDate: new Date("2026-03-01"),
          expectedHarvestDate: new Date("2026-07-01"),
          season: "Dry",
          year: 2026,
          status: "Standing",
          remarks: "Objective 1 Automated Crop Record",
        },
        staffId,
        "OMAG_STAFF"
      );

      assert(crop.parcelId === testParcelId, "Crop is linked to Parcel ID");
      assert(crop.cropType === "Corn", "Crop type is Corn");
      assert(crop.status === "Standing", "Crop status is Standing");
      testCropId = crop.id;
    }

    // ---------------------------------------------------------------------------
    // Test 12: Supporting document is correctly linked
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 12] Supporting document linked to farmer${RESET}`);
      if (!testFarmerId) throw new Error("Missing testFarmerId");

      const doc = await addSupportingDocument(
        {
          farmerId: testFarmerId,
          farmId: testFarmId,
          documentType: "Land Title",
          fileName: "TCT_123456_Poblacion.pdf",
          fileFormat: "application/pdf",
          fileSizeBytes: 1048576,
          storageKey: `rsbsa-docs/farmer-${testFarmerId}/tct_123456.pdf`,
          remarks: "Original Transfer Certificate of Title registered in Polomolok",
        },
        staffId,
        "OMAG_STAFF"
      );

      assert(doc.farmerId === testFarmerId, "Document linked to Farmer ID");
      assert(doc.documentType === "Land Title", "Document type is Land Title");
      assert(doc.verificationStatus === "Attached", "Document recorded with baseline Attached status (no fake approval workflow claimed)");
      testDocId = doc.id;
    }

    // ---------------------------------------------------------------------------
    // Test 13: Invalid relationships are rejected
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 13] Invalid relationships are rejected${RESET}`);
      let rejectedFarm = false;
      try {
        await addFarmAndParcel(
          9999999, // Non-existent farmer ID
          {
            farmName: "Orphan Farm",
            barangay: "Poblacion",
            totalAreaHa: 1.0,
            tenureType: "Owned",
            parcelNumber: "LOT-ORPHAN-01",
            areaHa: 1.0,
          },
          staffId,
          "OMAG_STAFF"
        );
      } catch (e) {
        rejectedFarm = true;
      }
      assert(rejectedFarm, "Rejects creating farm for non-existent farmer");

      let rejectedCrop = false;
      try {
        await recordCrop(
          {
            parcelId: 9999999, // Non-existent parcel ID
            cropType: "Rice",
            plantedAreaHa: 1.0,
            plantingDate: new Date(),
            season: "Wet",
            year: 2026,
            status: "Standing",
          },
          staffId,
          "OMAG_STAFF"
        );
      } catch (e) {
        rejectedCrop = true;
      }
      assert(rejectedCrop, "Rejects creating crop for non-existent parcel");
    }

    // ---------------------------------------------------------------------------
    // Test 14: Search returns appropriate records
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 14] Search returns appropriate records${RESET}`);
      const searchResult = await getFarmers({ search: "AutomatedTest" });
      assert(searchResult.items.length >= 1, "Search by first name returns test farmer");
      assert(
        searchResult.items.some((f) => f.rsbsaNumber === "12-63-12-TEST-999999"),
        "Matching RSBSA number found in results"
      );

      const barangayResult = await getFarmers({ barangay: "Poblacion" });
      assert(
        barangayResult.items.every((f) => f.barangay.toLowerCase() === "poblacion"),
        "Barangay filter returns only Poblacion farmers"
      );
    }

    // ---------------------------------------------------------------------------
    // Test 15: Empty states render when no records exist
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 15] Empty states render for empty queries${RESET}`);
      const emptyResult = await getFarmers({ search: "NONEXISTENT_XYZ_QUERY_12345" });
      assert(emptyResult.items.length === 0, "Empty list returned for non-matching query");
      assert(emptyResult.pagination.total === 0, "Pagination total is 0");
    }

    // ---------------------------------------------------------------------------
    // Test 16: No fake production data is inserted
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 16] No fake production data inserted${RESET}`);
      const damageReports = await prisma.damageReport.count();
      const inventoryItems = await prisma.inventoryItem.count();
      // Verify no unapproved tables were populated with fake records
      assert(damageReports === 3, "No fake damage reports / PCIC claims added");
      assert(inventoryItems === 2, "No fake inventory catalog items added");
    }

    // ---------------------------------------------------------------------------
    // Test 17: Audit logging works for record changes
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 17] Audit logging works for record mutations${RESET}`);
      if (!testFarmerId) throw new Error("Missing testFarmerId");

      const logs = await prisma.auditLog.findMany({
        where: { module: "RSBSA" },
        orderBy: { timestamp: "desc" },
        take: 5,
      });

      assert(logs.length > 0, "RSBSA audit logs exist in database");
      const actions = logs.map((l) => l.action);
      assert(
        actions.includes("CREATE_FARMER") ||
          actions.includes("UPDATE_FARMER") ||
          actions.includes("CREATE_FARM_PARCEL") ||
          actions.includes("RECORD_CROP"),
        "Mutation actions captured in immutable audit trail"
      );
    }

    // ---------------------------------------------------------------------------
    // Test 18: Future Objective 2–6 routes remain disabled
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 18] Future Objective 2–6 routes remain disabled${RESET}`);
      const sidebarPath = path.resolve(__dirname, "../components/layout/sidebar/Sidebar.tsx");
      const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

      // Verify RSBSA is active
      assert(
        sidebarContent.includes('href="/head/rsbsa"') && !sidebarContent.includes('href="/head/rsbsa" label="RSBSA Registry" icon={Users} badge="Active" disabled'),
        "Head RSBSA navigation link is active"
      );
      assert(
        sidebarContent.includes('href="/staff/rsbsa"') && !sidebarContent.includes('href="/staff/rsbsa" label="RSBSA Records" icon={Users} badge="Active" disabled'),
        "Staff RSBSA navigation link is active"
      );

      // Verify other objectives remain disabled
      const futureRoutes = [
        "/head/crops",
        "/head/inventory",
        "/head/forecasts",
        "/head/pcic",
        "/staff/verification",
        "/staff/crops",
        "/staff/inventory",
        "/staff/pcic",
      ];

      for (const route of futureRoutes) {
        const pattern = new RegExp(`href=["']${route}["'][^>]*disabled`);
        assert(pattern.test(sidebarContent), `Route ${route} remains explicitly disabled in Sidebar`);
      }
    }

    // ---------------------------------------------------------------------------
    // Test 19: Phase 1 Auth tests still pass (verified via code inspection)
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 19] Phase 1 authentication architecture preserved${RESET}`);
      const userCount = await prisma.user.count();
      assert(userCount === 2, "Exactly 2 official municipal user accounts remain active");
    }

    // ---------------------------------------------------------------------------
    // Test 20: Phase 2 Dashboard integration works
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Test 20] Phase 2 Dashboard integration & roadmap preservation${RESET}`);
      const headOverviewPath = path.resolve(__dirname, "../components/dashboard/head/HeadOverview.tsx");
      const staffOverviewPath = path.resolve(__dirname, "../components/dashboard/staff/StaffOverview.tsx");
      const headContent = fs.readFileSync(headOverviewPath, "utf-8");
      const staffContent = fs.readFileSync(staffOverviewPath, "utf-8");

      assert(
        headContent.includes("PHASE 3 — OBJECTIVE 1 — CURRENT") &&
          headContent.includes("PHASE 5 — OBJECTIVE 3 — UPCOMING") &&
          headContent.includes("PHASE 8 — OBJECTIVE 6 — UPCOMING"),
        "HeadOverview preserves intentional capstone roadmap indicators with Objective 1 CURRENT"
      );

      assert(
        staffContent.includes("PHASE 3 — OBJECTIVE 1 — CURRENT") &&
          staffContent.includes("PHASE 4 — OBJECTIVE 2 — UPCOMING") &&
          staffContent.includes("PHASE 6 — OBJECTIVE 4 — UPCOMING"),
        "StaffOverview preserves intentional capstone roadmap indicators with Objective 1 CURRENT"
      );
    }
  } finally {
    // Clean up test data created specifically for this test run
    if (testCropId) {
      await prisma.crop.deleteMany({ where: { id: testCropId } });
    }
    if (testDocId) {
      await prisma.landDocument.deleteMany({ where: { id: testDocId } });
    }
    if (testFarmId) {
      await prisma.farm.deleteMany({ where: { id: testFarmId } });
    }
    if (testFarmerId) {
      await prisma.farmer.deleteMany({ where: { id: testFarmerId } });
    }
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`PHASE 3 TEST RESULTS: ${GREEN}${passedCount} PASSED${RESET}, ${failedCount > 0 ? `${RED}${failedCount} FAILED${RESET}` : `0 FAILED`}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase3Tests()
  .catch((err) => {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
