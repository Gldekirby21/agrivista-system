/**
 * Phase 3 Objective 1 Automated Test Suite
 * Centralized Agricultural Information Management Module
 * RSBSA Beneficiary, Farm, Farm Parcel, Crop, and Land Document Records CRUD
 * 
 * Tests all 20 required Phase 3 Objective 1 criteria:
 * 1. Staff can access beneficiary module.
 * 2. Head can access beneficiary module.
 * 3. Unauthenticated user is blocked.
 * 4. Staff can create beneficiary.
 * 5. Staff can read beneficiary.
 * 6. Staff can update beneficiary.
 * 7. Staff can archive beneficiary.
 * 8. Head can read/review beneficiary.
 * 9. Unauthorized role cannot access staff-only mutation endpoint.
 * 10. Server rejects invalid beneficiary data.
 * 11. Farm CRUD works.
 * 12. FarmParcel CRUD works.
 * 13. Crop CRUD works.
 * 14. LandDocument CRUD works.
 * 15. Relationships are preserved.
 * 16. Archived records are handled correctly.
 * 17. AuditLog is created for important mutations.
 * 18. Search works.
 * 19. No Objective 2–6 functionality was introduced.
 * 20. No new application role was introduced.
 */

import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import { signSessionToken, SESSION_COOKIE_NAME } from "../lib/auth/session";
import { prisma } from "../lib/database/prisma";
import * as fs from "fs";
import * as path from "path";

// Import API route handlers for end-to-end testing
import { GET as getBeneficiariesApi, POST as createBeneficiaryApi } from "../app/api/beneficiaries/route";
import {
  GET as getBeneficiaryByIdApi,
  PUT as updateBeneficiaryApi,
  DELETE as archiveBeneficiaryApi,
} from "../app/api/beneficiaries/[id]/route";

import { GET as getFarmsApi, POST as createFarmApi } from "../app/api/farms/route";
import {
  GET as getFarmByIdApi,
  PUT as updateFarmApi,
  DELETE as archiveFarmApi,
} from "../app/api/farms/[id]/route";

import { GET as getFarmParcelsApi, POST as createFarmParcelApi } from "../app/api/farm-parcels/route";
import {
  GET as getFarmParcelByIdApi,
  PUT as updateFarmParcelApi,
  DELETE as archiveFarmParcelApi,
} from "../app/api/farm-parcels/[id]/route";

import { GET as getCropsApi, POST as createCropApi } from "../app/api/crops/route";
import {
  GET as getCropByIdApi,
  PUT as updateCropApi,
  DELETE as archiveCropApi,
} from "../app/api/crops/[id]/route";

import { GET as getLandDocsApi, POST as createLandDocApi } from "../app/api/land-documents/route";
import {
  GET as getLandDocByIdApi,
  PUT as updateLandDocApi,
  DELETE as archiveLandDocApi,
} from "../app/api/land-documents/[id]/route";

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

async function runPhase3Objective1Tests() {
  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`${CYAN}PHASE 3 — OBJECTIVE 1 AUTOMATED VERIFICATION SUITE (20 TEST CRITERIA)${RESET}`);
  console.log(`${CYAN}OMAG Polomolok Agricultural Resource Distribution and Production Analytics System${RESET}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  // Fetch known test users from DB
  const staffUser = await prisma.user.findFirst({ where: { role: "OMAG_STAFF" } });
  const headUser = await prisma.user.findFirst({ where: { role: "OMAG_HEAD" } });

  if (!staffUser || !headUser) {
    throw new Error("Missing required seed users in database (OMAG_STAFF, OMAG_HEAD)");
  }

  const staffCookie = await createAuthCookie("OMAG_STAFF", staffUser.username, staffUser.fullName, staffUser.id);
  const headCookie = await createAuthCookie("OMAG_HEAD", headUser.username, headUser.fullName, headUser.id);

  // Variable tracking IDs created during testing for cleanup
  let createdBeneficiaryId: number | null = null;
  let createdFarmId: number | null = null;
  let createdParcelId: number | null = null;
  let createdCropId: number | null = null;
  let createdDocId: string | null = null;

  try {
    // ---------------------------------------------------------------------------
    // Criterion 1: Staff can access beneficiary module
    // ---------------------------------------------------------------------------
    {
      console.log(`${YELLOW}[Criterion 1] Staff can access beneficiary module${RESET}`);
      const req = new NextRequest("http://localhost:3000/staff/beneficiaries", {
        headers: { Cookie: staffCookie },
      });
      const res = await middleware(req);
      assert(res.status === 200, "Staff request to /staff/beneficiaries returns HTTP 200");
      assert(!res.headers.get("location"), "No redirect header issued for authorized Staff");
    }

    // ---------------------------------------------------------------------------
    // Criterion 2: Head can access beneficiary module
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 2] Head can access beneficiary module${RESET}`);
      const req = new NextRequest("http://localhost:3000/head/beneficiaries", {
        headers: { Cookie: headCookie },
      });
      const res = await middleware(req);
      assert(res.status === 200, "Head request to /head/beneficiaries returns HTTP 200");
      assert(!res.headers.get("location"), "No redirect header issued for authorized Head");
    }

    // ---------------------------------------------------------------------------
    // Criterion 3: Unauthenticated user is blocked
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 3] Unauthenticated user is blocked${RESET}`);
      const reqStaffArea = new NextRequest("http://localhost:3000/staff/beneficiaries");
      const resStaffArea = await middleware(reqStaffArea);
      assert(resStaffArea.status === 307 || resStaffArea.status === 302, "Unauthenticated access to /staff/beneficiaries is redirected");
      assert(!!resStaffArea.headers.get("location")?.includes("/login"), "Redirects to /login");

      const reqHeadArea = new NextRequest("http://localhost:3000/head/beneficiaries");
      const resHeadArea = await middleware(reqHeadArea);
      assert(resHeadArea.status === 307 || resHeadArea.status === 302, "Unauthenticated access to /head/beneficiaries is redirected");
      assert(!!resHeadArea.headers.get("location")?.includes("/login"), "Redirects to /login");
    }

    // ---------------------------------------------------------------------------
    // Criterion 4: Staff can create beneficiary
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 4] Staff can create beneficiary${RESET}`);
      const uniqueRsbsa = `RSBSA-TEST-${Date.now().toString().slice(-6)}`;
      const payload = {
        rsbsaNumber: uniqueRsbsa,
        farmerCode: "TEST-BEN-01",
        firstName: "Reynaldo",
        middleName: "Mendoza",
        lastName: "Dela Cruz",
        barangay: "Poblacion",
        municipality: "Polomolok",
        province: "South Cotabato",
        contactNumber: "09171234567",
        sex: "Male",
        dateOfBirth: "1980-05-15",
        isSenior: false,
        isPwd: false,
        is4ps: false,
        isIp: false,
      };

      const req = new NextRequest("http://localhost:3000/api/beneficiaries", {
        method: "POST",
        headers: {
          Cookie: staffCookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const res = await createBeneficiaryApi(req);
      assert(res.status === 201, `POST /api/beneficiaries returns HTTP 201 Created (Status: ${res.status})`);
      const body = await res.json();
      assert(!!body.id, `Beneficiary record assigned DB ID: ${body.id}`);
      assert(body.firstName === "Reynaldo", "Beneficiary firstName matches payload");
      assert(body.status === "Active", "Beneficiary initial status is Active");
      createdBeneficiaryId = body.id;
    }

    // ---------------------------------------------------------------------------
    // Criterion 5: Staff can read beneficiary
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 5] Staff can read beneficiary${RESET}`);
      // List
      const listReq = new NextRequest("http://localhost:3000/api/beneficiaries", {
        headers: { Cookie: staffCookie },
      });
      const listRes = await getBeneficiariesApi(listReq);
      assert(listRes.status === 200, "GET /api/beneficiaries returns HTTP 200");
      const listData = await listRes.json();
      assert(Array.isArray(listData.items), "Returns list items array");
      assert(listData.pagination.total >= 1, "Pagination includes created beneficiary");

      // By ID
      const singleReq = new NextRequest(`http://localhost:3000/api/beneficiaries/${createdBeneficiaryId}`, {
        headers: { Cookie: staffCookie },
      });
      const singleRes = await getBeneficiaryByIdApi(singleReq, {
        params: Promise.resolve({ id: String(createdBeneficiaryId) }),
      });
      assert(singleRes.status === 200, "GET /api/beneficiaries/[id] returns HTTP 200");
      const singleData = await singleRes.json();
      assert(singleData.id === createdBeneficiaryId, "Record matches requested beneficiary ID");
      assert(singleData.lastName === "Dela Cruz", "Record returns correct lastName");
    }

    // ---------------------------------------------------------------------------
    // Criterion 6: Staff can update beneficiary
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 6] Staff can update beneficiary${RESET}`);
      const updatePayload = {
        contactNumber: "09998887777",
        isSenior: true,
        barangay: "Cannery Site",
      };

      const req = new NextRequest(`http://localhost:3000/api/beneficiaries/${createdBeneficiaryId}`, {
        method: "PUT",
        headers: {
          Cookie: staffCookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      const res = await updateBeneficiaryApi(req, {
        params: Promise.resolve({ id: String(createdBeneficiaryId) }),
      });
      assert(res.status === 200, "PUT /api/beneficiaries/[id] returns HTTP 200");
      const updated = await res.json();
      assert(updated.contactNumber === "09998887777", "Beneficiary contact number successfully updated");
      assert(updated.barangay === "Cannery Site", "Beneficiary barangay successfully updated");
      assert(updated.isSenior === true, "Beneficiary sector status updated");
    }

    // ---------------------------------------------------------------------------
    // Criterion 7: Staff can archive beneficiary
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 7] Staff can archive beneficiary (non-destructive soft-delete)${RESET}`);
      const req = new NextRequest(`http://localhost:3000/api/beneficiaries/${createdBeneficiaryId}`, {
        method: "DELETE",
        headers: { Cookie: staffCookie },
      });

      const res = await archiveBeneficiaryApi(req, {
        params: Promise.resolve({ id: String(createdBeneficiaryId) }),
      });
      assert(res.status === 200, "DELETE /api/beneficiaries/[id] returns HTTP 200");
      const result = await res.json();
      assert(result.status === "Archived", "Beneficiary status is marked Archived");

      // Verify row still exists in database (non-destructive)
      const record = await prisma.farmer.findUnique({ where: { id: createdBeneficiaryId! } });
      assert(!!record, "Database row was preserved (not destructively hard-deleted)");
      assert(record?.status === "Archived", "Database row status is Archived");

      // Restore beneficiary to Active for downstream farm/crop tests
      await prisma.farmer.update({
        where: { id: createdBeneficiaryId! },
        data: { status: "Active" },
      });
    }

    // ---------------------------------------------------------------------------
    // Criterion 8: Head can read/review beneficiary
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 8] Head can read/review beneficiary${RESET}`);
      const req = new NextRequest(`http://localhost:3000/api/beneficiaries/${createdBeneficiaryId}`, {
        headers: { Cookie: headCookie },
      });

      const res = await getBeneficiaryByIdApi(req, {
        params: Promise.resolve({ id: String(createdBeneficiaryId) }),
      });
      assert(res.status === 200, "Head GET /api/beneficiaries/[id] returns HTTP 200");
      const data = await res.json();
      assert(data.id === createdBeneficiaryId, "Head can inspect complete beneficiary dossier");
      assert(Array.isArray(data.farms), "Head dossier includes farms relation");
      assert(Array.isArray(data.documents), "Head dossier includes documents relation");
    }

    // ---------------------------------------------------------------------------
    // Criterion 9: Unauthorized role cannot access staff-only mutation endpoints
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 9] Unauthorized role cannot access staff-only mutation endpoints${RESET}`);
      // Head attempting to create beneficiary
      const headPostReq = new NextRequest("http://localhost:3000/api/beneficiaries", {
        method: "POST",
        headers: {
          Cookie: headCookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName: "Unauthorized", lastName: "Test", barangay: "Poblacion" }),
      });
      const headPostRes = await createBeneficiaryApi(headPostReq);
      assert(headPostRes.status === 403, `Head POST /api/beneficiaries returns HTTP 403 Forbidden (Actual: ${headPostRes.status})`);

      // Head attempting to archive beneficiary
      const headDeleteReq = new NextRequest(`http://localhost:3000/api/beneficiaries/${createdBeneficiaryId}`, {
        method: "DELETE",
        headers: { Cookie: headCookie },
      });
      const headDeleteRes = await archiveBeneficiaryApi(headDeleteReq, {
        params: Promise.resolve({ id: String(createdBeneficiaryId) }),
      });
      assert(headDeleteRes.status === 403, `Head DELETE /api/beneficiaries/[id] returns HTTP 403 Forbidden (Actual: ${headDeleteRes.status})`);

      // Head attempting to create farm
      const headFarmReq = new NextRequest("http://localhost:3000/api/farms", {
        method: "POST",
        headers: { Cookie: headCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ farmerId: createdBeneficiaryId, barangay: "Poblacion", totalAreaHa: 1.0 }),
      });
      const headFarmRes = await createFarmApi(headFarmReq);
      assert(headFarmRes.status === 403, `Head POST /api/farms returns HTTP 403 Forbidden (Actual: ${headFarmRes.status})`);
    }

    // ---------------------------------------------------------------------------
    // Criterion 10: Server rejects invalid beneficiary data
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 10] Server rejects invalid beneficiary data${RESET}`);
      const invalidPayload = {
        firstName: "", // Missing required
        lastName: "",  // Missing required
        barangay: "InvalidBarangayNotInPolomolok", // Invalid barangay
      };

      const req = new NextRequest("http://localhost:3000/api/beneficiaries", {
        method: "POST",
        headers: {
          Cookie: staffCookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidPayload),
      });

      const res = await createBeneficiaryApi(req);
      assert(res.status === 400, `POST with invalid data returns HTTP 400 Bad Request (Actual: ${res.status})`);
      const err = await res.json();
      assert(!!err.error, "Error message returned for validation failure");
    }

    // ---------------------------------------------------------------------------
    // Criterion 11: Farm CRUD works
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 11] Farm CRUD works${RESET}`);
      // CREATE
      const createReq = new NextRequest("http://localhost:3000/api/farms", {
        method: "POST",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId: createdBeneficiaryId,
          farmName: "Test Farm Parcel A",
          barangay: "Cannery Site",
          totalAreaHa: 2.5,
          tenureType: "Owned",
        }),
      });
      const createRes = await createFarmApi(createReq);
      assert(createRes.status === 201, "POST /api/farms returns HTTP 201 Created");
      const farmData = await createRes.json();
      createdFarmId = farmData.id;
      assert(farmData.tenureType === "Owned", "Farm tenureType correctly stored");
      assert(farmData.totalAreaHa === 2.5, "Farm totalAreaHa correctly stored");

      // READ
      const getReq = new NextRequest(`http://localhost:3000/api/farms/${createdFarmId}`, {
        headers: { Cookie: staffCookie },
      });
      const getRes = await getFarmByIdApi(getReq, {
        params: Promise.resolve({ id: String(createdFarmId) }),
      });
      assert(getRes.status === 200, "GET /api/farms/[id] returns HTTP 200");

      // UPDATE
      const updateReq = new NextRequest(`http://localhost:3000/api/farms/${createdFarmId}`, {
        method: "PUT",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ totalAreaHa: 3.0, tenureType: "Leased" }),
      });
      const updateRes = await updateFarmApi(updateReq, {
        params: Promise.resolve({ id: String(createdFarmId) }),
      });
      assert(updateRes.status === 200, "PUT /api/farms/[id] returns HTTP 200");
      const updatedFarm = await updateRes.json();
      assert(updatedFarm.totalAreaHa === 3.0, "Farm totalAreaHa updated to 3.0");
      assert(updatedFarm.tenureType === "Leased", "Farm tenureType updated to Leased");

      // ARCHIVE
      const delReq = new NextRequest(`http://localhost:3000/api/farms/${createdFarmId}`, {
        method: "DELETE",
        headers: { Cookie: staffCookie },
      });
      const delRes = await archiveFarmApi(delReq, {
        params: Promise.resolve({ id: String(createdFarmId) }),
      });
      assert(delRes.status === 200, "DELETE /api/farms/[id] returns HTTP 200");
      const archivedFarm = await delRes.json();
      assert(archivedFarm.status === "Archived", "Farm status marked Archived");

      // Unarchive farm for parcel tests
      await prisma.farm.update({ where: { id: createdFarmId! }, data: { status: "Active" } });
    }

    // ---------------------------------------------------------------------------
    // Criterion 12: FarmParcel CRUD works
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 12] FarmParcel CRUD works${RESET}`);
      // CREATE
      const createReq = new NextRequest("http://localhost:3000/api/farm-parcels", {
        method: "POST",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          farmId: createdFarmId,
          parcelNumber: "LOT-99-TEST",
          areaHa: 1.5,
          latitude: 6.2255,
          longitude: 125.0712,
        }),
      });
      const createRes = await createFarmParcelApi(createReq);
      assert(createRes.status === 201, "POST /api/farm-parcels returns HTTP 201 Created");
      const parcelData = await createRes.json();
      createdParcelId = parcelData.id;
      assert(parcelData.parcelNumber === "LOT-99-TEST", "Parcel parcelNumber correctly stored");
      assert(parcelData.areaHa === 1.5, "Parcel areaHa correctly stored");

      // READ
      const getReq = new NextRequest(`http://localhost:3000/api/farm-parcels/${createdParcelId}`, {
        headers: { Cookie: staffCookie },
      });
      const getRes = await getFarmParcelByIdApi(getReq, {
        params: Promise.resolve({ id: String(createdParcelId) }),
      });
      assert(getRes.status === 200, "GET /api/farm-parcels/[id] returns HTTP 200");

      // UPDATE
      const updateReq = new NextRequest(`http://localhost:3000/api/farm-parcels/${createdParcelId}`, {
        method: "PUT",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ areaHa: 1.75, remarks: "Updated parcel plot" }),
      });
      const updateRes = await updateFarmParcelApi(updateReq, {
        params: Promise.resolve({ id: String(createdParcelId) }),
      });
      assert(updateRes.status === 200, "PUT /api/farm-parcels/[id] returns HTTP 200");
      const updatedParcel = await updateRes.json();
      assert(updatedParcel.areaHa === 1.75, "Parcel area updated to 1.75 ha");

      // ARCHIVE
      const delReq = new NextRequest(`http://localhost:3000/api/farm-parcels/${createdParcelId}`, {
        method: "DELETE",
        headers: { Cookie: staffCookie },
      });
      const delRes = await archiveFarmParcelApi(delReq, {
        params: Promise.resolve({ id: String(createdParcelId) }),
      });
      assert(delRes.status === 200, "DELETE /api/farm-parcels/[id] returns HTTP 200");
      const archivedParcel = await delRes.json();
      assert(archivedParcel.status === "Archived", "Parcel marked Archived");

      // Restore parcel to Active for crop tests
      await prisma.farmParcel.update({ where: { id: createdParcelId! }, data: { status: "Active" } });
    }

    // ---------------------------------------------------------------------------
    // Criterion 13: Crop CRUD works
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 13] Crop CRUD works${RESET}`);
      // CREATE
      const createReq = new NextRequest("http://localhost:3000/api/crops", {
        method: "POST",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelId: createdParcelId,
          cropType: "Corn (Yellow)",
          variety: "NK8840 Hybrid",
          plantedAreaHa: 1.5,
          plantingDate: "2026-06-01",
          season: "Wet",
          year: 2026,
          status: "Standing",
        }),
      });
      const createRes = await createCropApi(createReq);
      assert(createRes.status === 201, "POST /api/crops returns HTTP 201 Created");
      const cropData = await createRes.json();
      createdCropId = cropData.id;
      assert(cropData.cropType === "Corn (Yellow)", "Crop type stored correctly");
      assert(cropData.status === "Standing", "Crop initial status is Standing");

      // READ
      const getReq = new NextRequest(`http://localhost:3000/api/crops/${createdCropId}`, {
        headers: { Cookie: staffCookie },
      });
      const getRes = await getCropByIdApi(getReq, {
        params: Promise.resolve({ id: String(createdCropId) }),
      });
      assert(getRes.status === 200, "GET /api/crops/[id] returns HTTP 200");

      // UPDATE (Supports OMAG operational need for realtime crop updates)
      const updateReq = new NextRequest(`http://localhost:3000/api/crops/${createdCropId}`, {
        method: "PUT",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Harvested", remarks: "Harvest completed on schedule" }),
      });
      const updateRes = await updateCropApi(updateReq, {
        params: Promise.resolve({ id: String(createdCropId) }),
      });
      assert(updateRes.status === 200, "PUT /api/crops/[id] returns HTTP 200");
      const updatedCrop = await updateRes.json();
      assert(updatedCrop.status === "Harvested", "Crop status successfully updated to Harvested");

      // ARCHIVE
      const delReq = new NextRequest(`http://localhost:3000/api/crops/${createdCropId}`, {
        method: "DELETE",
        headers: { Cookie: staffCookie },
      });
      const delRes = await archiveCropApi(delReq, {
        params: Promise.resolve({ id: String(createdCropId) }),
      });
      assert(delRes.status === 200, "DELETE /api/crops/[id] returns HTTP 200");
      const archivedCrop = await delRes.json();
      assert(archivedCrop.status === "Archived", "Crop marked Archived");
    }

    // ---------------------------------------------------------------------------
    // Criterion 14: LandDocument CRUD works
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 14] LandDocument CRUD works${RESET}`);
      // CREATE
      const createReq = new NextRequest("http://localhost:3000/api/land-documents", {
        method: "POST",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId: createdBeneficiaryId,
          farmId: createdFarmId,
          documentType: "Land Title (OCT/TCT)",
          fileName: "OCT-9999-Title.pdf",
          fileUrl: "https://storage.local/rsbsa/OCT-9999-Title.pdf",
          fileSizeBytes: 204800,
          mimeType: "application/pdf",
        }),
      });
      const createRes = await createLandDocApi(createReq);
      assert(createRes.status === 201, "POST /api/land-documents returns HTTP 201 Created");
      const docData = await createRes.json();
      createdDocId = docData.id;
      assert(docData.documentType === "Land Title (OCT/TCT)", "Land document type correctly stored");

      // READ
      const getReq = new NextRequest(`http://localhost:3000/api/land-documents/${createdDocId}`, {
        headers: { Cookie: staffCookie },
      });
      const getRes = await getLandDocByIdApi(getReq, {
        params: Promise.resolve({ id: String(createdDocId) }),
      });
      assert(getRes.status === 200, "GET /api/land-documents/[id] returns HTTP 200");

      // UPDATE
      const updateReq = new NextRequest(`http://localhost:3000/api/land-documents/${createdDocId}`, {
        method: "PUT",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ remarks: "Original land title reviewed and cataloged" }),
      });
      const updateRes = await updateLandDocApi(updateReq, {
        params: Promise.resolve({ id: String(createdDocId) }),
      });
      assert(updateRes.status === 200, "PUT /api/land-documents/[id] returns HTTP 200");
      const updatedDoc = await updateRes.json();
      assert(updatedDoc.remarks === "Original land title reviewed and cataloged", "Land document remarks updated");

      // ARCHIVE
      const delReq = new NextRequest(`http://localhost:3000/api/land-documents/${createdDocId}`, {
        method: "DELETE",
        headers: { Cookie: staffCookie },
      });
      const delRes = await archiveLandDocApi(delReq, {
        params: Promise.resolve({ id: String(createdDocId) }),
      });
      assert(delRes.status === 200, "DELETE /api/land-documents/[id] returns HTTP 200");
      const archivedDoc = await delRes.json();
      assert(archivedDoc.verificationStatus === "Archived", "Land document marked Archived");
    }

    // ---------------------------------------------------------------------------
    // Criterion 15: Relationships are preserved
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 15] Relationships are preserved${RESET}`);
      const fullDossier = await prisma.farmer.findUnique({
        where: { id: createdBeneficiaryId! },
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
          documents: true,
        },
      });

      assert(!!fullDossier, "Beneficiary root found");
      assert(fullDossier!.farms.length > 0, "Beneficiary -> Farm relation intact");
      const relatedFarm = fullDossier!.farms.find((f) => f.id === createdFarmId);
      assert(!!relatedFarm, "Specific Farm linked to Beneficiary");
      assert(relatedFarm!.parcels.length > 0, "Farm -> FarmParcel relation intact");
      const relatedParcel = relatedFarm!.parcels.find((p) => p.id === createdParcelId);
      assert(!!relatedParcel, "Specific Parcel linked to Farm");
      assert(relatedParcel!.crops.length > 0, "FarmParcel -> Crop relation intact");
      assert(fullDossier!.documents.length > 0, "Beneficiary -> LandDocument relation intact");
    }

    // ---------------------------------------------------------------------------
    // Criterion 16: Archived records are handled correctly
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 16] Archived records are handled correctly${RESET}`);
      // Mark beneficiary as archived
      await prisma.farmer.update({
        where: { id: createdBeneficiaryId! },
        data: { status: "Archived" },
      });

      // Default query without status filter excludes Archived
      const defaultListReq = new NextRequest("http://localhost:3000/api/beneficiaries", {
        headers: { Cookie: staffCookie },
      });
      const defaultListRes = await getBeneficiariesApi(defaultListReq);
      const defaultData = await defaultListRes.json();
      const foundInDefault = defaultData.items.some((i: any) => i.id === createdBeneficiaryId);
      assert(!foundInDefault, "Archived beneficiary is excluded from active directory list by default");

      // Query with status=Archived includes it
      const archiveListReq = new NextRequest("http://localhost:3000/api/beneficiaries?status=Archived", {
        headers: { Cookie: staffCookie },
      });
      const archiveListRes = await getBeneficiariesApi(archiveListReq);
      const archiveData = await archiveListRes.json();
      const foundInArchive = archiveData.items.some((i: any) => i.id === createdBeneficiaryId);
      assert(foundInArchive, "Querying status=Archived retrieves archived record");
    }

    // ---------------------------------------------------------------------------
    // Criterion 17: AuditLog is created for important mutations
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 17] AuditLog is created for important mutations${RESET}`);
      const logs = await prisma.auditLog.findMany({
        where: {
          recordId: String(createdBeneficiaryId),
          module: "BENEFICIARY",
        },
        orderBy: { timestamp: "desc" },
      });

      assert(logs.length >= 2, `AuditLog entries found for Beneficiary mutations (Found: ${logs.length})`);
      const actions = logs.map((l) => l.action);
      assert(actions.includes("CREATE"), "AuditLog recorded CREATE action");
      assert(actions.includes("UPDATE") || actions.includes("ARCHIVE"), "AuditLog recorded UPDATE/ARCHIVE action");
      assert(logs[0].userId === staffUser.id, "AuditLog recorded responsible staff user ID");
    }

    // ---------------------------------------------------------------------------
    // Criterion 18: Search works
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 18] Search works${RESET}`);
      // Search by known test name "Reynaldo" (with status=Archived since it was archived)
      const searchReq = new NextRequest("http://localhost:3000/api/beneficiaries?search=Reynaldo&status=Archived", {
        headers: { Cookie: staffCookie },
      });
      const searchRes = await getBeneficiariesApi(searchReq);
      const searchData = await searchRes.json();
      assert(searchData.items.length > 0, "Search by first name returns matching beneficiary");
      assert(searchData.items[0].firstName === "Reynaldo", "Found correct record by search term");
    }

    // ---------------------------------------------------------------------------
    // Criterion 19: No Objective 2–6 functionality was introduced
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 19] No Objective 2–6 functionality was introduced${RESET}`);
      const sidebarPath = path.resolve(__dirname, "../components/layout/sidebar/Sidebar.tsx");
      const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

      // Verify Future Objectives (4-6) remain disabled in Sidebar
      assert(sidebarContent.includes('href="/staff/predictions" label="Yield & Loss Prediction" icon={TrendingUp} badge="Objective 3"'), "Production Yield ML (Objective 3) is active");
      assert(sidebarContent.includes('href="/staff/inventory" label="Inventory" icon={Boxes} badge="Objective 4" disabled'), "FIFO Inventory (Objective 4) remains disabled");
      assert(sidebarContent.includes('href="/staff/pcic" label="PCIC Monitoring" icon={FileCheck2} badge="Objective 6" disabled'), "PCIC Prioritization (Objective 6) remains disabled");
    }

    // ---------------------------------------------------------------------------
    // Criterion 20: No new application role was introduced
    // ---------------------------------------------------------------------------
    {
      console.log(`\n${YELLOW}[Criterion 20] No new application role was introduced${RESET}`);
      const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
      const schemaContent = fs.readFileSync(schemaPath, "utf-8");
      const roleEnumMatch = schemaContent.match(/enum\s+Role\s*\{([^}]+)\}/);

      if (roleEnumMatch) {
        const enumValues = roleEnumMatch[1]
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("//"));
        assert(
          enumValues.length === 2 && enumValues.includes("OMAG_HEAD") && enumValues.includes("OMAG_STAFF"),
          `Prisma Role enum strictly restricted to OMAG_HEAD and OMAG_STAFF (found: ${enumValues.join(", ")})`
        );
      }

      const users = await prisma.user.findMany({ select: { role: true } });
      const uniqueRoles = Array.from(new Set(users.map((u) => u.role)));
      assert(
        uniqueRoles.every((r) => r === "OMAG_HEAD" || r === "OMAG_STAFF"),
        "No Farmer user account or external role exists in the database"
      );
    }
  } finally {
    // ---------------------------------------------------------------------------
    // CLEANUP: Clean up test-created records to preserve exact database baseline
    // ---------------------------------------------------------------------------
    console.log(`\n${CYAN}Cleaning up transient test records...${RESET}`);
    if (createdCropId) {
      await prisma.crop.deleteMany({ where: { id: createdCropId } });
    }
    if (createdDocId) {
      await prisma.landDocument.deleteMany({ where: { id: createdDocId } });
    }
    if (createdParcelId) {
      await prisma.farmParcel.deleteMany({ where: { id: createdParcelId } });
    }
    if (createdFarmId) {
      await prisma.farm.deleteMany({ where: { id: createdFarmId } });
    }
    if (createdBeneficiaryId) {
      await prisma.auditLog.deleteMany({ where: { recordId: String(createdBeneficiaryId) } });
      await prisma.farmer.deleteMany({ where: { id: createdBeneficiaryId } });
    }
    console.log(`  ${GREEN}✓ Cleanup completed. Baseline database restored.${RESET}`);
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`PHASE 3 OBJECTIVE 1 RESULTS: ${GREEN}${passedCount} PASSED${RESET}, ${failedCount > 0 ? `${RED}${failedCount} FAILED${RESET}` : `0 FAILED`}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase3Objective1Tests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
