/**
 * Automated Verification Script: Sidebar Navigation Structure & "Manage" CRUD Rule Verification
 * OMAG Polomolok Agricultural Resource Distribution & Production Analytics System (AgriVista 3.0)
 */

import * as fs from "fs";
import * as path from "path";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

let passedCount = 0;
let failedCount = 0;

function check(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ${GREEN}✓ PASS:${RESET} ${testName}`);
    passedCount++;
  } else {
    console.log(`  ${RED}✗ FAIL:${RESET} ${testName}`);
    if (detail) console.log(`    ${YELLOW}Detail: ${detail}${RESET}`);
    failedCount++;
  }
}

async function runSidebarAudit() {
  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`${CYAN}  SIDEBAR NAVIGATION STRUCTURE & "MANAGE" CRUD RULE VERIFICATION SUITE       ${RESET}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  const sidebarPath = path.resolve(__dirname, "../components/layout/sidebar/Sidebar.tsx");
  check(fs.existsSync(sidebarPath), "Sidebar.tsx component file exists");

  const sidebarCode = fs.readFileSync(sidebarPath, "utf-8");

  // SECTION 1: DASHBOARD
  console.log(`${YELLOW}\n1. Dashboard Navigation${RESET}`);
  check(sidebarCode.includes('href={`${base}/dashboard`}'), "Dashboard points to ${base}/dashboard");
  check(sidebarCode.includes("Dashboard"), "Dashboard label exists");

  // SECTION 2: OBJECTIVE 01 — AGRICULTURAL RECORDS (COMPLETE CRUD)
  console.log(`${YELLOW}\n2. Objective 01: Agricultural Records (Complete CRUD Pages)${RESET}`);
  check(sidebarCode.includes('numberTag="01"'), "Objective 01 numberTag exists");
  check(sidebarCode.includes('label="Agricultural Records"'), "Objective 01 label is 'Agricultural Records'");

  const obj1CrudLabels = [
    "Manage Farmers / RSBSA",
    "Manage Farms",
    "Manage Farm Parcels",
    "Manage Crops",
    "Manage Land Documents",
  ];

  for (const label of obj1CrudLabels) {
    check(sidebarCode.includes(`label: "${label}"`), `Objective 01 contains '${label}' (COMPLETE CRUD)`);
  }

  // Verify routes for Objective 01
  check(sidebarCode.includes('href: `${base}/beneficiaries`'), "Farmers / RSBSA maps to ${base}/beneficiaries");
  check(sidebarCode.includes('href: `${base}/beneficiaries?view=farms`'), "Farms maps to ?view=farms");
  check(sidebarCode.includes('href: `${base}/beneficiaries?view=parcels`'), "Farm Parcels maps to ?view=parcels");
  check(sidebarCode.includes('href: `${base}/beneficiaries?view=crops`'), "Crops maps to ?view=crops");
  check(sidebarCode.includes('href: `${base}/beneficiaries?view=documents`'), "Land Documents maps to ?view=documents");

  // SECTION 3: OBJECTIVE 02 — AI METADATA VERIFICATION (NON-CRUD, STRICTLY 2 ITEMS)
  console.log(`${YELLOW}\n3. Objective 02: AI Metadata Verification (Strictly 2 Submenu Items)${RESET}`);
  check(sidebarCode.includes('numberTag="02"'), "Objective 02 numberTag exists");
  check(sidebarCode.includes('label="AI Metadata Verification"'), "Objective 02 label is 'AI Metadata Verification'");

  check(sidebarCode.includes('label: "Photo Submissions"'), "Objective 02 contains 'Photo Submissions'");
  check(sidebarCode.includes('label: "View Verification List"'), "Objective 02 contains 'View Verification List'");

  // PROHIBITED SUBMENU ITEMS (Sections that belong inside workflow/detail view)
  const prohibitedObj2Items = [
    "label: \"Metadata Verification\"",
    "label: \"GPS Verification\"",
    "label: \"Verification Audit\"",
    "label: \"AI Assessment\"",
    "label: \"Timestamp Verification\"",
    "label: \"Manage Photo Submissions\"",
    "label: \"Manage Verification List\"",
    "label: \"Manage Photo Verification\"",
  ];

  for (const prohibited of prohibitedObj2Items) {
    check(!sidebarCode.includes(prohibited), `Objective 02 does NOT contain '${prohibited}' (correctly excluded from sidebar)`);
  }

  // SECTION 4: OBJECTIVE 03 — YIELD & LOSS PREDICTION (NON-CRUD)
  console.log(`${YELLOW}\n4. Objective 03: Yield & Loss Prediction (Analytical/Model Workflows)${RESET}`);
  check(sidebarCode.includes('numberTag="03"'), "Objective 03 numberTag exists");
  check(sidebarCode.includes('label="Yield & Loss Prediction"'), "Objective 03 label is 'Yield & Loss Prediction'");

  const obj3Items = [
    "Yield Prediction",
    "Crop-Loss Prediction",
    "Prediction / Model Records",
  ];

  for (const label of obj3Items) {
    check(sidebarCode.includes(`label: "${label}"`), `Objective 03 contains '${label}'`);
    check(!sidebarCode.includes(`label: "Manage ${label}"`), `Objective 03 does NOT use 'Manage ${label}'`);
  }

  // SECTION 5: OBJECTIVE 04 — INVENTORY MANAGEMENT (CRUD VS TRANSACTION SEPARATION)
  console.log(`${YELLOW}\n5. Objective 04: Inventory Management (CRUD vs Transaction Workflow)${RESET}`);
  check(sidebarCode.includes('numberTag="04"'), "Objective 04 numberTag exists");
  check(sidebarCode.includes('label="Inventory Management"'), "Objective 04 label is 'Inventory Management'");

  // Complete CRUD items
  check(sidebarCode.includes('label: "Manage Inventory Items"'), "Objective 04 contains 'Manage Inventory Items' (COMPLETE CRUD)");
  check(sidebarCode.includes('label: "Manage Inventory Batches"'), "Objective 04 contains 'Manage Inventory Batches' (COMPLETE CRUD)");

  // Workflow / History items (MUST NOT use Manage)
  check(sidebarCode.includes('label: "FIFO Distribution"'), "Objective 04 contains 'FIFO Distribution' (Workflow)");
  check(!sidebarCode.includes('label: "Manage FIFO Distribution"'), "FIFO Distribution does NOT use 'Manage'");
  check(sidebarCode.includes('label: "Distribution Records"'), "Objective 04 contains 'Distribution Records' (History)");
  check(!sidebarCode.includes('label: "Manage Distribution Records"'), "Distribution Records does NOT use 'Manage'");

  // SECTION 6: OBJECTIVE 05 — RESOURCE DEMAND (CRUD VS FORECAST SEPARATION)
  console.log(`${YELLOW}\n6. Objective 05: Resource Demand (CRUD vs Forecast Output)${RESET}`);
  check(sidebarCode.includes('numberTag="05"'), "Objective 05 numberTag exists");
  check(sidebarCode.includes('label="Resource Demand"'), "Objective 05 label is 'Resource Demand'");

  // Complete CRUD
  check(sidebarCode.includes('label: "Manage Historical Data"'), "Objective 05 contains 'Manage Historical Data' (COMPLETE CRUD)");

  // Forecasting Workflow / Output
  check(sidebarCode.includes('label: "Demand Forecast"'), "Objective 05 contains 'Demand Forecast' (Forecasting Output)");
  check(!sidebarCode.includes('label: "Manage Demand Forecast"'), "Demand Forecast does NOT use 'Manage'");
  check(sidebarCode.includes('label: "Forecast Models"'), "Objective 05 contains 'Forecast Models' (Model Info)");
  check(!sidebarCode.includes('label: "Manage Forecast Models"'), "Forecast Models does NOT use 'Manage'");

  // SECTION 7: OBJECTIVE 06 — PCIC CLAIM MONITORING (CRUD VS MONITORING SEPARATION)
  console.log(`${YELLOW}\n7. Objective 06: PCIC Claim Monitoring (CRUD vs Monitoring Separation)${RESET}`);
  check(sidebarCode.includes('numberTag="06"'), "Objective 06 numberTag exists");
  check(sidebarCode.includes('label="PCIC Claim Monitoring"'), "Objective 06 label is 'PCIC Claim Monitoring'");

  // Complete CRUD
  check(sidebarCode.includes('label: "Manage Crop-Loss Claims"'), "Objective 06 contains 'Manage Crop-Loss Claims' (COMPLETE CRUD)");

  // Ranking & Monitoring (MUST NOT use Manage)
  check(sidebarCode.includes('label: "Priority Ranking"'), "Objective 06 contains 'Priority Ranking' (System Ranking)");
  check(!sidebarCode.includes('label: "Manage Priority Ranking"'), "Priority Ranking does NOT use 'Manage'");
  check(sidebarCode.includes('label: "Claim Monitoring"'), "Objective 06 contains 'Claim Monitoring' (Monitoring View)");
  check(!sidebarCode.includes('label: "Manage Claim Monitoring"'), "Claim Monitoring does NOT use 'Manage'");

  // SECTION 8: CROSS-CUTTING & LOGOUT
  console.log(`${YELLOW}\n8. Cross-Cutting & Session Logout${RESET}`);
  check(sidebarCode.includes('href={`${base}/reports`}'), "Reports link exists");
  check(sidebarCode.includes('href={`${base}/audit`}'), "Activity / Audit Logs link exists");
  check(sidebarCode.includes('href={`${base}/settings`}'), "Settings link exists");
  check(sidebarCode.includes("ConfirmModal"), "Standardized Sign Out modal exists");
  check(sidebarCode.includes("handleLogout"), "Logout handler exists");

  // SECTION 9: ROUTE EXISTENCE VERIFICATION
  console.log(`${YELLOW}\n9. Physical Page & Route Resolution Verification${RESET}`);
  const roles = ["staff", "head"];
  const targetRoutes = [
    "dashboard",
    "beneficiaries",
    "photo-verification",
    "photo-verification/new",
    "predictions",
    "inventory",
    "resource-demand",
    "pcic",
    "reports",
    "audit",
    "settings",
  ];

  for (const role of roles) {
    for (const route of targetRoutes) {
      const pagePath = path.resolve(__dirname, `../app/(dashboard)/${role}/${route}/page.tsx`);
      const exists = fs.existsSync(pagePath);
      check(exists, `Page exists for /${role}/${route}`);
    }
  }

  // SECTION 10: PROHIBITION OF VERB / ACTION BUTTONS AS SIDEBAR ITEMS
  console.log(`${YELLOW}\n10. Absence of In-Page CRUD Action Buttons in Sidebar${RESET}`);
  const prohibitedActionItems = [
    'label: "CREATE"',
    'label: "READ"',
    'label: "UPDATE"',
    'label: "DELETE"',
    'label: "Add"',
    'label: "Upload"',
    'label: "Edit"',
    'label: "Delete"',
    'label: "Verify"',
    'label: "Review"',
  ];

  for (const actionItem of prohibitedActionItems) {
    check(!sidebarCode.includes(actionItem), `Sidebar does not contain standalone action button '${actionItem}'`);
  }

  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`  VERIFICATION RESULTS: ${GREEN}${passedCount} PASSED${RESET}, ${failedCount > 0 ? `${RED}${failedCount} FAILED${RESET}` : `${GREEN}0 FAILED${RESET}`}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSidebarAudit().catch((e) => {
  console.error("Audit script failed:", e);
  process.exit(1);
});
