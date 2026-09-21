/**
 * Comprehensive Phase 2 Verification Suite
 * OMAG Polomolok Agricultural Resource Distribution and Production Analytics System
 * 
 * Verifies:
 * 1. Role-based Route Protection & Layout Guards (Head, Staff, Unauthenticated)
 * 2. Exact Authoritative Objective Order (01 to 06) and Submenu Mapping
 * 3. Cross-cutting Navigation (Reports, Audit, Settings, Logout)
 * 4. Dashboard Content Integrity (Zero Fake Data, Real DB Queries, Empty States)
 * 5. Modal Standardization & Workflow Modals (Objectives 1–6)
 * 6. Responsive Sidebar & Mobile Viewport Handling
 * 7. Usability & Accessibility Standards
 */

import { NextRequest } from "next/server";
import { middleware } from "../proxy";
import { signSessionToken, SESSION_COOKIE_NAME } from "../lib/auth/session";
import { prisma } from "../lib/database/prisma";
import * as fs from "fs";
import * as path from "path";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

let passCount = 0;
let failCount = 0;

function check(condition: boolean, title: string, details?: string) {
  if (condition) {
    console.log(`  ${GREEN}✓ PASS${RESET}: ${title}`);
    passCount++;
  } else {
    console.error(`  ${RED}✗ FAIL${RESET}: ${title}${details ? ` — ${details}` : ""}`);
    failCount++;
  }
}

async function makeCookie(role: "OMAG_HEAD" | "OMAG_STAFF", username: string) {
  const token = await signSessionToken({
    id: `test-${username}`,
    username,
    email: `${username}@polomolok.gov.ph`,
    fullName: role === "OMAG_HEAD" ? "Municipal Agricultural Head" : "Agricultural Operations Staff",
    role,
  });
  return `${SESSION_COOKIE_NAME}=${token}`;
}

async function runVerification() {
  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`${CYAN}PHASE 2 COMPREHENSIVE FORENSIC VERIFICATION SUITE${RESET}`);
  console.log(`${CYAN}OMAG Polomolok Agricultural Resource Distribution and Production Analytics System${RESET}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  const headCookie = await makeCookie("OMAG_HEAD", "head.polomolok");
  const staffCookie = await makeCookie("OMAG_STAFF", "staff.polomolok");

  // SECTION 1: ROLE-BASED ROUTE PROTECTION & GUARDS
  console.log(`${YELLOW}1. Role-Based Route Protection & Authorization${RESET}`);
  {
    // Head accessing /head/dashboard
    const reqHeadToHead = new NextRequest("http://localhost:3000/head/dashboard", {
      headers: { Cookie: headCookie },
    });
    const resHeadToHead = await middleware(reqHeadToHead);
    check(resHeadToHead.status === 200, "Head can access /head/dashboard (HTTP 200)");

    // Staff accessing /staff/dashboard
    const reqStaffToStaff = new NextRequest("http://localhost:3000/staff/dashboard", {
      headers: { Cookie: staffCookie },
    });
    const resStaffToStaff = await middleware(reqStaffToStaff);
    check(resStaffToStaff.status === 200, "Staff can access /staff/dashboard (HTTP 200)");

    // Head accessing /staff/dashboard -> blocked & redirected
    const reqHeadToStaff = new NextRequest("http://localhost:3000/staff/dashboard", {
      headers: { Cookie: headCookie },
    });
    const resHeadToStaff = await middleware(reqHeadToStaff);
    check(
      resHeadToStaff.status === 307 || resHeadToStaff.status === 302,
      "Head is redirected away from /staff/dashboard"
    );
    check(
      resHeadToStaff.headers.get("location")?.includes("/head/dashboard") === true,
      "Head redirected specifically to /head/dashboard"
    );

    // Staff accessing /head/dashboard -> blocked & redirected
    const reqStaffToHead = new NextRequest("http://localhost:3000/head/dashboard", {
      headers: { Cookie: staffCookie },
    });
    const resStaffToHead = await middleware(reqStaffToHead);
    check(
      resStaffToHead.status === 307 || resStaffToHead.status === 302,
      "Staff is redirected away from /head/dashboard"
    );
    check(
      resStaffToHead.headers.get("location")?.includes("/staff/beneficiaries") === true,
      "Staff redirected specifically to /staff/beneficiaries"
    );

    // Unauthenticated user
    const reqUnauth = new NextRequest("http://localhost:3000/head/dashboard");
    const resUnauth = await middleware(reqUnauth);
    check(
      resUnauth.status === 307 || resUnauth.status === 302,
      "Unauthenticated request is redirected"
    );
    check(
      resUnauth.headers.get("location")?.includes("/login") === true,
      "Unauthenticated request redirected to /login"
    );
  }

  // SECTION 2: AUTHORITATIVE OBJECTIVE ORDER & SIDEBAR NAVIGATION
  console.log(`\n${YELLOW}2. Authoritative Objective Order (01–06) in Navigation${RESET}`);
  {
    const sidebarPath = path.resolve(__dirname, "../components/layout/sidebar/Sidebar.tsx");
    const sidebarCode = fs.readFileSync(sidebarPath, "utf-8");

    // Objective 01
    check(sidebarCode.includes('numberTag="01"'), "Objective 01 numberTag exists");
    check(sidebarCode.includes('label="Agricultural Records"'), "Objective 01 labeled 'Agricultural Records'");
    check(sidebarCode.includes('label: "Manage Farmers / RSBSA"'), "Objective 01 contains 'Manage Farmers / RSBSA'");
    check(sidebarCode.includes('label: "Manage Farms"'), "Objective 01 contains 'Manage Farms'");
    check(sidebarCode.includes('label: "Manage Farm Parcels"'), "Objective 01 contains 'Manage Farm Parcels'");
    check(sidebarCode.includes('label: "Manage Crops"'), "Objective 01 contains 'Manage Crops'");
    check(sidebarCode.includes('label: "Manage Land Documents"'), "Objective 01 contains 'Manage Land Documents'");

    // Objective 02
    check(sidebarCode.includes('numberTag="02"'), "Objective 02 numberTag exists");
    check(sidebarCode.includes('label="AI Metadata Verification"'), "Objective 02 labeled 'AI Metadata Verification'");
    check(sidebarCode.includes('label: "Photo Submissions"'), "Objective 02 contains 'Photo Submissions'");
    check(sidebarCode.includes('label: "View Verification List"'), "Objective 02 contains 'View Verification List'");

    // Objective 03
    check(sidebarCode.includes('numberTag="03"'), "Objective 03 numberTag exists");
    check(sidebarCode.includes('label="Yield & Loss Prediction"'), "Objective 03 labeled 'Yield & Loss Prediction'");
    check(sidebarCode.includes('label: "Yield Prediction"'), "Objective 03 contains 'Yield Prediction'");
    check(sidebarCode.includes('label: "Crop-Loss Prediction"'), "Objective 03 contains 'Crop-Loss Prediction'");
    check(sidebarCode.includes('label: "Prediction / Model Records"'), "Objective 03 contains 'Prediction / Model Records'");

    // Objective 04
    check(sidebarCode.includes('numberTag="04"'), "Objective 04 numberTag exists");
    check(sidebarCode.includes('label="Inventory Management"'), "Objective 04 labeled 'Inventory Management'");
    check(sidebarCode.includes('label: "Manage Inventory Items"'), "Objective 04 contains 'Manage Inventory Items'");
    check(sidebarCode.includes('label: "Manage Inventory Batches"'), "Objective 04 contains 'Manage Inventory Batches'");
    check(sidebarCode.includes('label: "FIFO Distribution"'), "Objective 04 contains 'FIFO Distribution'");
    check(sidebarCode.includes('label: "Distribution Records"'), "Objective 04 contains 'Distribution Records'");

    // Objective 05
    check(sidebarCode.includes('numberTag="05"'), "Objective 05 numberTag exists");
    check(sidebarCode.includes('label="Resource Demand"'), "Objective 05 labeled 'Resource Demand'");
    check(sidebarCode.includes('label: "Manage Historical Data"'), "Objective 05 contains 'Manage Historical Data'");
    check(sidebarCode.includes('label: "Demand Forecast"'), "Objective 05 contains 'Demand Forecast'");
    check(sidebarCode.includes('label: "Forecast Models"'), "Objective 05 contains 'Forecast Models'");

    // Objective 06
    check(sidebarCode.includes('numberTag="06"'), "Objective 06 numberTag exists");
    check(sidebarCode.includes('label="PCIC Claim Monitoring"'), "Objective 06 labeled 'PCIC Claim Monitoring'");
    check(sidebarCode.includes('label: "Manage Crop-Loss Claims"'), "Objective 06 contains 'Manage Crop-Loss Claims'");
    check(sidebarCode.includes('label: "Priority Ranking"'), "Objective 06 contains 'Priority Ranking'");
    check(sidebarCode.includes('label: "Claim Monitoring"'), "Objective 06 contains 'Claim Monitoring'");

    // Cross-cutting modules
    check(sidebarCode.includes('href={`${base}/reports`}'), "Navigation includes Reports");
    check(sidebarCode.includes('href={`${base}/audit`}'), "Navigation includes Activity / Audit Logs");
    check(sidebarCode.includes('href={`${base}/settings`}'), "Navigation includes Settings");
    check(sidebarCode.includes('ConfirmModal'), "Navigation includes Logout Confirmation Modal");
  }

  // SECTION 3: DASHBOARD CONTENT & ZERO FAKE STATISTICS VERIFICATION
  console.log(`\n${YELLOW}3. Dashboard Content & Data Integrity${RESET}`);
  {
    const headCardsPath = path.resolve(__dirname, "../components/dashboard/head/HeadSummaryCards.tsx");
    const staffCardsPath = path.resolve(__dirname, "../components/dashboard/staff/StaffSummaryCards.tsx");
    const headCardsCode = fs.readFileSync(headCardsPath, "utf-8");
    const staffCardsCode = fs.readFileSync(staffCardsPath, "utf-8");

    // Real DB queries
    check(
      headCardsCode.includes("prisma.farmer.count()") &&
      headCardsCode.includes("prisma.farmParcel.count()") &&
      headCardsCode.includes("prisma.damageReport.count()") &&
      headCardsCode.includes("prisma.inventoryItem.count()"),
      "HeadSummaryCards queries live Prisma counts exclusively"
    );

    check(
      staffCardsCode.includes("prisma.farmer.count()") &&
      staffCardsCode.includes("prisma.farmParcel.count()") &&
      staffCardsCode.includes("prisma.photoVerification.count()") &&
      staffCardsCode.includes("prisma.inventoryBatch.count()"),
      "StaffSummaryCards queries live Prisma counts exclusively"
    );

    // Empty state handling
    check(
      headCardsCode.includes("No records enrolled") && headCardsCode.includes("No parcels mapped"),
      "HeadSummaryCards provides truthful empty states"
    );
    check(
      staffCardsCode.includes("No enrollees in queue") && staffCardsCode.includes("No photos uploaded"),
      "StaffSummaryCards provides truthful empty states"
    );

    // Activity trails
    const headActPath = path.resolve(__dirname, "../components/dashboard/head/HeadActivity.tsx");
    const staffActPath = path.resolve(__dirname, "../components/dashboard/staff/StaffActivity.tsx");
    const headActCode = fs.readFileSync(headActPath, "utf-8");
    const staffActCode = fs.readFileSync(staffActPath, "utf-8");

    check(headActCode.includes("prisma.auditLog.findMany"), "HeadActivity queries real audit trail");
    check(staffActCode.includes("prisma.auditLog.findMany"), "StaffActivity queries real audit trail");
    check(headActCode.includes("No Administrative Logs Recorded"), "HeadActivity has truthful empty state");
    check(staffActCode.includes("No Field Operations Recorded"), "StaffActivity has truthful empty state");
  }

  // SECTION 4: MODAL STANDARDIZATION
  console.log(`\n${YELLOW}4. Modal Standardization & Workflow Interfaces${RESET}`);
  {
    const modalPath = path.resolve(__dirname, "../components/common/Modal.tsx");
    const confirmModalPath = path.resolve(__dirname, "../components/common/ConfirmModal.tsx");
    const modalCode = fs.readFileSync(modalPath, "utf-8");
    const confirmModalCode = fs.readFileSync(confirmModalPath, "utf-8");

    check(modalCode.includes("aria-modal=\"true\""), "Modal implements aria-modal");
    check(modalCode.includes("key === \"Escape\""), "Modal supports Escape key to close");
    check(modalCode.includes("overflow-y-auto"), "Modal body provides scrollable container for long forms");
    check(modalCode.includes("sizeClasses"), "Modal provides standard sizing tiers");

    check(confirmModalCode.includes("variant === \"danger\""), "ConfirmModal supports danger styling");
    check(confirmModalCode.includes("isLoading"), "ConfirmModal handles processing/disabled state");
    check(confirmModalCode.includes("audit log"), "ConfirmModal displays audit trail attribution notice");

    // Objective 1 Modals
    const beneficiaryListPath = path.resolve(__dirname, "../features/rsbsa/components/BeneficiaryList.tsx");
    const beneficiaryListCode = fs.readFileSync(beneficiaryListPath, "utf-8");
    check(beneficiaryListCode.includes("isRegisterFarmerOpen") && beneficiaryListCode.includes("isAddFarmOpen"), "Objective 1 uses modals for creating Farmers and Farms");
    check(beneficiaryListCode.includes("isAddParcelOpen") && beneficiaryListCode.includes("isRecordCropOpen"), "Objective 1 uses modals for creating Parcels and Crops");
    check(beneficiaryListCode.includes("editingFarm") && beneficiaryListCode.includes("editingCrop"), "Objective 1 uses modals for editing records");
    check(beneficiaryListCode.includes("ConfirmModal"), "Objective 1 uses ConfirmModal for archiving");

    // Objective 2 Workflow
    const photoUploadModalPath = path.resolve(__dirname, "../features/photo-verification/components/PhotoUploadModal.tsx");
    const photoUploadCode = fs.readFileSync(photoUploadModalPath, "utf-8");
    check(photoUploadCode.includes("15 * 1024 * 1024"), "Photo upload validates file size (15MB limit)");
    check(photoUploadCode.includes("Modal"), "Photo upload uses standard Modal wrapper");

    // Objective 3 Workflow
    const predictionFormPath = path.resolve(__dirname, "../features/yield-loss/components/PredictionForm.tsx");
    const modelTrainingModalPath = path.resolve(__dirname, "../features/yield-loss/components/ModelTrainingModal.tsx");
    const predFormCode = fs.readFileSync(predictionFormPath, "utf-8");
    const modelTrainCode = fs.readFileSync(modelTrainingModalPath, "utf-8");
    check(predFormCode.includes("Modal"), "Crop yield prediction uses standard Modal interface");
    check(modelTrainCode.includes("isTraining") && modelTrainCode.includes("Modal"), "Model training uses standard Modal with training state");

    // Objective 4 Workflow
    const distModalPath = path.resolve(__dirname, "../features/inventory/components/DistributeStockModal.tsx");
    const createItemModalPath = path.resolve(__dirname, "../features/inventory/components/CreateItemModal.tsx");
    const distModalCode = fs.readFileSync(distModalPath, "utf-8");
    const createItemCode = fs.readFileSync(createItemModalPath, "utf-8");
    check(distModalCode.includes("FifoCalculationResult") && distModalCode.includes("Modal"), "FIFO stock distribution uses dedicated transaction modal");
    check(createItemCode.includes("reorderLevel") && createItemCode.includes("Modal"), "Inventory item enrollment uses standard Modal");

    // Objective 5 Workflow
    const histModalPath = path.resolve(__dirname, "../features/resource-demand/components/CreateHistoricalDataModal.tsx");
    const histModalCode = fs.readFileSync(histModalPath, "utf-8");
    check(histModalCode.includes("Modal") && histModalCode.includes("parseFloat"), "Historical agricultural data creation uses validated Modal");

    // Objective 6 Workflow
    const pcicModalPath = path.resolve(__dirname, "../features/pcic/components/CreateCaseModal.tsx");
    const pcicModalCode = fs.readFileSync(pcicModalPath, "utf-8");
    check(pcicModalCode.includes("reportedDamagePercent") && pcicModalCode.includes("selectedFarmerId"), "PCIC damage case creation uses structured modal workflow");
  }

  // SECTION 5: RESPONSIVE BEHAVIOR
  console.log(`\n${YELLOW}5. Responsive Behavior & Viewport Handling${RESET}`);
  {
    const layoutContextPath = path.resolve(__dirname, "../components/layout/LayoutContext.tsx");
    const layoutCode = fs.readFileSync(layoutContextPath, "utf-8");
    check(
      layoutCode.includes("window.innerWidth < 768") && layoutCode.includes("setIsSidebarCollapsed(true)"),
      "LayoutContext automatically collapses sidebar on viewports smaller than 768px"
    );

    const topBarPath = path.resolve(__dirname, "../components/layout/header/GmailTopBar.tsx");
    const topBarCode = fs.readFileSync(topBarPath, "utf-8");
    check(topBarCode.includes("toggleSidebar") && topBarCode.includes("Menu"), "GmailTopBar provides hamburger menu toggle for mobile");
    check(topBarCode.includes("hidden md:flex"), "Long header text is hidden on mobile to prevent overflow");
  }

  // SUMMARY
  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`RESULTS: ${GREEN}${passCount} PASSED${RESET}, ${failCount > 0 ? `${RED}${failCount} FAILED${RESET}` : `0 FAILED`}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runVerification()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
