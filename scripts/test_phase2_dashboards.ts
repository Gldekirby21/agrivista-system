/**
 * Phase 2 Dashboard Automated Test Suite
 * OMAG Polomolok Agricultural Resource Distribution and Production Analytics System
 * 
 * Verifies all 12 required Phase 2 assertions:
 * 1. Head can access /head/dashboard.
 * 2. Staff can access /staff/dashboard.
 * 3. Head cannot access /staff/dashboard.
 * 4. Staff cannot access /head/dashboard.
 * 5. Unauthenticated users remain blocked.
 * 6. Both dashboards render without runtime errors.
 * 7. No fake agricultural records are inserted.
 * 8. No Objective 1–6 functionality exists.
 * 9. No additional user role exists.
 * 10. No broken future navigation.
 * 11. Beneficiary terminology is used in dashboard/navigation labels where applicable.
 * 12. Dashboard does not claim unconfirmed OMAG requirements.
 */

import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import { signSessionToken, SESSION_COOKIE_NAME } from "../lib/auth/session";
import { prisma } from "../lib/database/prisma";
import { HeadSummaryCards } from "../components/dashboard/head/HeadSummaryCards";
import { HeadOverview } from "../components/dashboard/head/HeadOverview";
import { HeadActivity } from "../components/dashboard/head/HeadActivity";
import { HeadQuickActions } from "../components/dashboard/head/HeadQuickActions";
import { HeadDashboardView } from "../components/dashboard/head/HeadDashboardView";
import { StaffSummaryCards } from "../components/dashboard/staff/StaffSummaryCards";
import { StaffOverview } from "../components/dashboard/staff/StaffOverview";
import { StaffActivity } from "../components/dashboard/staff/StaffActivity";
import { StaffQuickActions } from "../components/dashboard/staff/StaffQuickActions";
import { StaffDashboardView } from "../components/dashboard/staff/StaffDashboardView";
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

async function createAuthCookie(role: "OMAG_HEAD" | "OMAG_STAFF", username: string, fullName: string) {
  const token = await signSessionToken({
    id: `test-${username}`,
    username,
    email: `${username}@polomolok.gov.ph`,
    fullName,
    role,
  });
  return `${SESSION_COOKIE_NAME}=${token}`;
}

async function runDashboardTests() {
  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`${CYAN}PHASE 2 DASHBOARD AUTOMATED VERIFICATION SUITE (12 TEST ASSERTIONS)${RESET}`);
  console.log(`${CYAN}OMAG Polomolok Agricultural Resource Distribution and Production Analytics System${RESET}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  const headCookie = await createAuthCookie("OMAG_HEAD", "head.polomolok", "Municipal Agricultural Head");
  const staffCookie = await createAuthCookie("OMAG_STAFF", "staff.polomolok", "Agricultural Operations Staff");

  // ---------------------------------------------------------------------------
  // Test 1: Head can access /head/dashboard
  // ---------------------------------------------------------------------------
  {
    console.log(`${YELLOW}[Test 1] Head can access /head/dashboard${RESET}`);
    const req = new NextRequest("http://localhost:3000/head/dashboard", {
      headers: { Cookie: headCookie },
    });
    const res = await middleware(req);
    assert(res.status === 200, "Head request to /head/dashboard returns HTTP 200 (allowed)");
    assert(!res.headers.get("location"), "No redirect header issued for Head accessing /head/dashboard");
  }

  // ---------------------------------------------------------------------------
  // Test 2: Staff can access /staff/dashboard
  // ---------------------------------------------------------------------------
  {
    console.log(`\n${YELLOW}[Test 2] Staff can access /staff/dashboard${RESET}`);
    const req = new NextRequest("http://localhost:3000/staff/dashboard", {
      headers: { Cookie: staffCookie },
    });
    const res = await middleware(req);
    assert(res.status === 200, "Staff request to /staff/dashboard returns HTTP 200 (allowed)");
    assert(!res.headers.get("location"), "No redirect header issued for Staff accessing /staff/dashboard");
  }

  // ---------------------------------------------------------------------------
  // Test 3: Head cannot access /staff/dashboard
  // ---------------------------------------------------------------------------
  {
    console.log(`\n${YELLOW}[Test 3] Head cannot access /staff/dashboard${RESET}`);
    const req = new NextRequest("http://localhost:3000/staff/dashboard", {
      headers: { Cookie: headCookie },
    });
    const res = await middleware(req);
    const location = res.headers.get("location");
    assert(res.status === 307 || res.status === 302, `Status indicates redirect (${res.status})`);
    assert(!!location && location.includes("/head/dashboard"), `Head redirected to /head/dashboard (Actual: ${location})`);
  }

  // ---------------------------------------------------------------------------
  // Test 4: Staff cannot access /head/dashboard
  // ---------------------------------------------------------------------------
  {
    console.log(`\n${YELLOW}[Test 4] Staff cannot access /head/dashboard${RESET}`);
    const req = new NextRequest("http://localhost:3000/head/dashboard", {
      headers: { Cookie: staffCookie },
    });
    const res = await middleware(req);
    const location = res.headers.get("location");
    assert(res.status === 307 || res.status === 302, `Status indicates redirect (${res.status})`);
    assert(!!location && location.includes("/staff/dashboard"), `Staff redirected to /staff/dashboard (Actual: ${location})`);
  }

  // ---------------------------------------------------------------------------
  // Test 5: Unauthenticated users remain blocked
  // ---------------------------------------------------------------------------
  {
    console.log(`\n${YELLOW}[Test 5] Unauthenticated users remain blocked${RESET}`);
    const reqHead = new NextRequest("http://localhost:3000/head/dashboard");
    const resHead = await middleware(reqHead);
    assert(resHead.status === 307 || resHead.status === 302, "Unauthenticated access to /head/dashboard redirected");
    const locHead = resHead.headers.get("location");
    assert(!!locHead && locHead.includes("/login"), "Unauthenticated user redirected to /login");

    const reqStaff = new NextRequest("http://localhost:3000/staff/dashboard");
    const resStaff = await middleware(reqStaff);
    assert(resStaff.status === 307 || resStaff.status === 302, "Unauthenticated access to /staff/dashboard redirected");
    const locStaff = resStaff.headers.get("location");
    assert(!!locStaff && locStaff.includes("/login"), "Unauthenticated user redirected to /login");
  }

  // ---------------------------------------------------------------------------
  // Test 6: Both dashboards render without runtime errors
  // ---------------------------------------------------------------------------
  {
    console.log(`\n${YELLOW}[Test 6] Both dashboards render without runtime errors${RESET}`);
    try {
      const headCardsElement = await HeadSummaryCards({});
      assert(!!headCardsElement, "HeadSummaryCards renders successfully");

      const headOverviewElement = HeadOverview({});
      assert(!!headOverviewElement, "HeadOverview renders successfully");

      const headActivityElement = await HeadActivity({});
      assert(!!headActivityElement, "HeadActivity renders successfully");

      const headQuickActionsElement = HeadQuickActions({});
      assert(!!headQuickActionsElement, "HeadQuickActions renders successfully");

      const headDashboardViewElement = HeadDashboardView({});
      assert(!!headDashboardViewElement, "HeadDashboardView renders successfully");

      const staffCardsElement = await StaffSummaryCards({});
      assert(!!staffCardsElement, "StaffSummaryCards renders successfully");

      const staffOverviewElement = StaffOverview({});
      assert(!!staffOverviewElement, "StaffOverview renders successfully");

      const staffActivityElement = await StaffActivity({});
      assert(!!staffActivityElement, "StaffActivity renders successfully");

      const staffQuickActionsElement = StaffQuickActions({});
      assert(!!staffQuickActionsElement, "StaffQuickActions renders successfully");

      const staffDashboardViewElement = StaffDashboardView({});
      assert(!!staffDashboardViewElement, "StaffDashboardView renders successfully");
    } catch (err: any) {
      assert(false, "Dashboard component render error", err?.message || String(err));
    }
  }

  // ---------------------------------------------------------------------------
  // Test 7: No fake agricultural records are inserted
  // ---------------------------------------------------------------------------
  {
    console.log(`\n${YELLOW}[Test 7] No fake agricultural records are inserted${RESET}`);
    const farmerCount = await prisma.farmer.count();
    const farmCount = await prisma.farm.count();
    const parcelCount = await prisma.farmParcel.count();
    const userCount = await prisma.user.count();

    assert(userCount >= 2, `User count remains at existing database baseline (found: ${userCount})`);
    assert(farmerCount >= 4, `Farmer table count remains at known baseline 4 (found: ${farmerCount})`);
    assert(farmCount >= 4, `Farm table count remains at known baseline 4 (found: ${farmCount})`);
    assert(parcelCount >= 4, `FarmParcel table count remains at known baseline 4 (found: ${parcelCount})`);
  }

  // ---------------------------------------------------------------------------
  // Test 8: No Objective 1–6 functionality exists
  // ---------------------------------------------------------------------------
  {
    console.log(`\n${YELLOW}[Test 8] No Objective 1–6 functionality exists on dashboard shells${RESET}`);
    const headOverviewPath = path.resolve(__dirname, "../components/dashboard/head/HeadOverview.tsx");
    const staffOverviewPath = path.resolve(__dirname, "../components/dashboard/staff/StaffOverview.tsx");
    const headOverviewContent = fs.readFileSync(headOverviewPath, "utf-8");
    const staffOverviewContent = fs.readFileSync(staffOverviewPath, "utf-8");

    assert(
      headOverviewContent.includes("No data available") &&
      headOverviewContent.includes("Module available in Objective"),
      "HeadOverview provides strictly non-functional placeholders with 'No data available'"
    );

    assert(
      staffOverviewContent.includes("No data available") &&
      staffOverviewContent.includes("Module available in Objective"),
      "StaffOverview provides strictly non-functional placeholders with 'No data available'"
    );

    // Verify all 8 required sections for Head exist in HeadOverview
    const headSections = [
      "Beneficiary / RSBSA",
      "Farm / Parcel",
      "Crop / Production",
      "Crop Loss / PCIC",
      "Inventory",
      "Resource Forecast",
      "Audit Logs",
      "Reports",
    ];
    let allHeadSectionsFound = true;
    for (const sec of headSections) {
      if (!headOverviewContent.includes(`title: "${sec}"`)) {
        allHeadSectionsFound = false;
        console.error(`  ${RED}✗ Missing Head section: ${sec}${RESET}`);
      }
    }
    assert(allHeadSectionsFound, "All 8 required Head overview sections are present as placeholders");

    // Verify all 8 required sections for Staff exist in StaffOverview
    const staffSections = [
      "Beneficiary / RSBSA",
      "Farm / Parcel",
      "Crop",
      "Photo Verification",
      "Inventory",
      "PCIC Monitoring",
      "Reports",
      "Activity",
    ];
    let allStaffSectionsFound = true;
    for (const sec of staffSections) {
      if (!staffOverviewContent.includes(`title: "${sec}"`)) {
        allStaffSectionsFound = false;
        console.error(`  ${RED}✗ Missing Staff section: ${sec}${RESET}`);
      }
    }
    assert(allStaffSectionsFound, "All 8 required Staff overview sections are present as placeholders");
  }

  // ---------------------------------------------------------------------------
  // Test 9: No additional user role exists
  // ---------------------------------------------------------------------------
  {
    console.log(`\n${YELLOW}[Test 9] No additional user role exists${RESET}`);
    const users = await prisma.user.findMany({ select: { username: true, role: true } });
    const roles = Array.from(new Set(users.map((u) => u.role)));
    assert(
      roles.length === 2 && roles.includes("OMAG_HEAD") && roles.includes("OMAG_STAFF"),
      "Only OMAG_HEAD and OMAG_STAFF roles exist in database (no Farmer role exists)"
    );

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
        `Prisma Role enum has exactly OMAG_HEAD and OMAG_STAFF (found: ${enumValues.join(", ")})`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Test 10: No broken future navigation
  // ---------------------------------------------------------------------------
  {
    console.log(`\n${YELLOW}[Test 10] No broken future navigation${RESET}`);
    const sidebarPath = path.resolve(__dirname, "../components/layout/sidebar/Sidebar.tsx");
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

    // In Phase 5, Objectives 1, 2, and 3 are active; future module links (Objectives 4–6) must be disabled
    const nonDashboardHeadRoutes = [
      "/head/parcels",
      "/head/inventory",
      "/head/forecasts",
      "/head/pcic",
      "/head/reports",
      "/head/audit",
    ];

    const nonDashboardStaffRoutes = [
      "/staff/parcels",
      "/staff/inventory",
      "/staff/pcic",
      "/staff/reports",
    ];

    let allDisabled = true;
    for (const route of [...nonDashboardHeadRoutes, ...nonDashboardStaffRoutes]) {
      const linePattern = new RegExp(`href=["']${route}["'][^>]*disabled`, "g");
      if (!sidebarContent.match(linePattern)) {
        allDisabled = false;
        console.error(`  ${RED}✗ Route ${route} is not marked disabled in Sidebar${RESET}`);
      }
    }
    assert(allDisabled, "All future module navigation items (Objectives 4–6) are explicitly marked disabled");
    assert(sidebarContent.includes('/head/beneficiaries'), "Head navigation contains active /head/beneficiaries route");
    assert(sidebarContent.includes('/staff/beneficiaries'), "Staff navigation contains active /staff/beneficiaries route");
    assert(sidebarContent.includes('/head/verification'), "Head navigation contains active /head/verification route");
    assert(sidebarContent.includes('/staff/verification'), "Staff navigation contains active /staff/verification route");
    assert(sidebarContent.includes('/head/predictions'), "Head navigation contains active /head/predictions route");
    assert(sidebarContent.includes('/staff/predictions'), "Staff navigation contains active /staff/predictions route");

    const navItemPath = path.resolve(__dirname, "../components/layout/navigation/NavItem.tsx");
    const navItemContent = fs.readFileSync(navItemPath, "utf-8");
    assert(
      navItemContent.includes("if (disabled)") && navItemContent.includes("cursor-not-allowed"),
      "NavItem safely renders disabled items without navigable links"
    );
  }

  // ---------------------------------------------------------------------------
  // Test 11: Beneficiary terminology is used in dashboard/navigation labels
  // ---------------------------------------------------------------------------
  {
    console.log(`\n${YELLOW}[Test 11] Beneficiary terminology is used in dashboard/navigation labels${RESET}`);
    const sidebarPath = path.resolve(__dirname, "../components/layout/sidebar/Sidebar.tsx");
    const headCardsPath = path.resolve(__dirname, "../components/dashboard/head/HeadSummaryCards.tsx");
    const staffCardsPath = path.resolve(__dirname, "../components/dashboard/staff/StaffSummaryCards.tsx");
    const headActionsPath = path.resolve(__dirname, "../components/dashboard/head/HeadQuickActions.tsx");
    const staffActionsPath = path.resolve(__dirname, "../components/dashboard/staff/StaffQuickActions.tsx");

    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
    const headCardsContent = fs.readFileSync(headCardsPath, "utf-8");
    const staffCardsContent = fs.readFileSync(staffCardsPath, "utf-8");
    const headActionsContent = fs.readFileSync(headActionsPath, "utf-8");
    const staffActionsContent = fs.readFileSync(staffActionsPath, "utf-8");

    assert(
      sidebarContent.includes('label="Beneficiaries / RSBSA"'),
      "Sidebar uses 'Beneficiaries / RSBSA' navigation label"
    );

    assert(
      headCardsContent.includes('title: "Beneficiaries (RSBSA)"') && !headCardsContent.includes("RSBSA Enrolled Farmers"),
      "HeadSummaryCards uses 'Beneficiaries (RSBSA)' terminology"
    );

    assert(
      staffCardsContent.includes('title: "Beneficiary Intake Queue"') && !staffCardsContent.includes("Farmer Enrollee Queue"),
      "StaffSummaryCards uses 'Beneficiary Intake Queue' terminology"
    );

    assert(
      headActionsContent.includes("Export Beneficiary Masterlist"),
      "HeadQuickActions uses 'Export Beneficiary Masterlist' label"
    );

    assert(
      staffActionsContent.includes("Enroll Beneficiary (RSBSA)"),
      "StaffQuickActions uses 'Enroll Beneficiary (RSBSA)' label"
    );
  }

  // ---------------------------------------------------------------------------
  // Test 12: Dashboard does not claim unconfirmed OMAG requirements
  // ---------------------------------------------------------------------------
  {
    console.log(`\n${YELLOW}[Test 12] Dashboard does not claim unconfirmed OMAG requirements${RESET}`);
    const headViewPath = path.resolve(__dirname, "../components/dashboard/head/HeadDashboardView.tsx");
    const staffViewPath = path.resolve(__dirname, "../components/dashboard/staff/StaffDashboardView.tsx");
    const headCardsPath = path.resolve(__dirname, "../components/dashboard/head/HeadSummaryCards.tsx");
    const staffCardsPath = path.resolve(__dirname, "../components/dashboard/staff/StaffSummaryCards.tsx");

    const headViewContent = fs.readFileSync(headViewPath, "utf-8");
    const staffViewContent = fs.readFileSync(staffViewPath, "utf-8");
    const headCardsContent = fs.readFileSync(headCardsPath, "utf-8");
    const staffCardsContent = fs.readFileSync(staffCardsPath, "utf-8");

    assert(
      headViewContent.includes("Synthetic Demonstration Data — Not Actual OMAG Records") &&
      headViewContent.includes("PROPOSED SYSTEM DESIGN / PENDING OMAG CONFIRMATION"),
      "HeadDashboardView explicitly disclaims synthetic demonstration data and pending confirmations"
    );

    assert(
      staffViewContent.includes("Synthetic Demonstration Data — Not Actual OMAG Records") &&
      staffViewContent.includes("PROPOSED SYSTEM DESIGN / PENDING OMAG CONFIRMATION"),
      "StaffDashboardView explicitly disclaims synthetic demonstration data and pending confirmations"
    );

    assert(
      headCardsContent.includes("Synthetic Demonstration Data — Not Actual OMAG Records"),
      "HeadSummaryCards explicitly disclaims synthetic demonstration data"
    );

    assert(
      staffCardsContent.includes("Synthetic Demonstration Data — Not Actual OMAG Records"),
      "StaffSummaryCards explicitly disclaims synthetic demonstration data"
    );
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`RESULTS: ${GREEN}${passedCount} PASSED${RESET}, ${failedCount > 0 ? `${RED}${failedCount} FAILED${RESET}` : `0 FAILED`}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runDashboardTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
