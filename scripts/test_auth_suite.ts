/**
 * Phase 1 Authentication and Role Authorization Automated Test Suite
 * OMAG Polomolok Agricultural Resource Distribution & Production Analytics System
 */

import { NextRequest } from "next/server";
import { POST as loginHandler } from "../app/api/auth/login/route";
import { POST as logoutHandler } from "../app/api/auth/logout/route";
import { GET as protectedApiHandler } from "../app/api/test-protected/route";
import { GET as meHandler } from "../app/api/auth/me/route";
import { signSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from "../lib/auth/session";
import { middleware } from "../middleware";
import { UserSession } from "../types";
import * as fs from "fs";
import * as path from "path";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
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

async function runTests() {
  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`${CYAN}PHASE 1 AUTHENTICATION & ROLE AUTHORIZATION TEST SUITE${RESET}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  // Test 1: Valid OMAG_HEAD Login
  {
    console.log("[Test 1] Valid OMAG_HEAD Login");
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "head.polomolok", password: "Password123!" }),
    });
    const res = await loginHandler(req);
    const data = await res.json();
    assert(res.status === 200, "HTTP Status is 200");
    assert(data.success === true, "data.success is true");
    assert(data.user.role === "OMAG_HEAD", "User role is OMAG_HEAD");
    assert(data.redirectUrl === "/head/dashboard", "Redirects to /head/dashboard");
    const setCookie = res.headers.get("set-cookie");
    assert(!!setCookie && setCookie.includes(SESSION_COOKIE_NAME), "Session cookie header is present");
    assert(!!setCookie && setCookie.includes("HttpOnly"), "Session cookie is HttpOnly");
  }

  // Test 2: Valid OMAG_STAFF Login (via Email)
  {
    console.log("\n[Test 2] Valid OMAG_STAFF Login (via Email)");
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "staff@polomolok.gov.ph", password: "Password123!" }),
    });
    const res = await loginHandler(req);
    const data = await res.json();
    assert(res.status === 200, "HTTP Status is 200");
    assert(data.success === true, "data.success is true");
    assert(data.user.role === "OMAG_STAFF", "User role is OMAG_STAFF");
    assert(data.redirectUrl === "/staff/dashboard", "Redirects to /staff/dashboard");
    const setCookie = res.headers.get("set-cookie");
    assert(!!setCookie && setCookie.includes(SESSION_COOKIE_NAME), "Session cookie header is present");
  }

  // Test 3: Invalid Password Rejection
  {
    console.log("\n[Test 3] Invalid Password Rejection");
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "head.polomolok", password: "WrongPassword999!" }),
    });
    const res = await loginHandler(req);
    const data = await res.json();
    assert(res.status === 401, "HTTP Status is 401");
    assert(data.error === "Invalid username or password.", "Returns generic invalid credentials error");
    assert(!res.headers.get("set-cookie"), "No session cookie is issued on invalid password");
  }

  // Test 4: Invalid Identifier Rejection
  {
    console.log("\n[Test 4] Invalid Identifier Rejection");
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "nonexistent.user", password: "Password123!" }),
    });
    const res = await loginHandler(req);
    const data = await res.json();
    assert(res.status === 401, "HTTP Status is 401");
    assert(data.error === "Invalid username or password.", "Returns identical generic error (prevents enumeration)");
  }

  // Test 5: Missing Credentials Validation
  {
    console.log("\n[Test 5] Missing Credentials Validation");
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "", password: "" }),
    });
    const res = await loginHandler(req);
    assert(res.status === 400, "HTTP Status is 400 on empty credentials");
  }

  // Setup sample valid tokens for middleware and guard testing
  const headSession: UserSession = {
    id: "head-uuid-1234",
    username: "head.polomolok",
    email: "head@polomolok.gov.ph",
    fullName: "Engr. Maria Santos",
    role: "OMAG_HEAD",
  };
  const staffSession: UserSession = {
    id: "staff-uuid-5678",
    username: "staff.polomolok",
    email: "staff@polomolok.gov.ph",
    fullName: "Juan Dela Cruz",
    role: "OMAG_STAFF",
  };
  const headToken = await signSessionToken(headSession);
  const staffToken = await signSessionToken(staffSession);

  // Test 6: Unauthenticated Access to Head Dashboard
  {
    console.log("\n[Test 6] Unauthenticated Access to Head Dashboard");
    const req = new NextRequest("http://localhost:3000/head/dashboard");
    const res = await middleware(req);
    assert(res.status === 307 || res.status === 302, "Middleware intercepts request with redirect");
    const location = res.headers.get("location");
    assert(!!location && location.includes("/login"), "Redirects unauthenticated user to /login");
  }

  // Test 7: Unauthenticated Access to Staff Dashboard
  {
    console.log("\n[Test 7] Unauthenticated Access to Staff Dashboard");
    const req = new NextRequest("http://localhost:3000/staff/dashboard");
    const res = await middleware(req);
    assert(res.status === 307 || res.status === 302, "Middleware intercepts request with redirect");
    const location = res.headers.get("location");
    assert(!!location && location.includes("/login"), "Redirects unauthenticated user to /login");
  }

  // Test 8: OMAG_STAFF Attempting Head Dashboard
  {
    console.log("\n[Test 8] OMAG_STAFF Attempting Head Dashboard (Role Boundary Enforcement)");
    const req = new NextRequest("http://localhost:3000/head/dashboard");
    req.cookies.set(SESSION_COOKIE_NAME, staffToken);
    const res = await middleware(req);
    assert(res.status === 307 || res.status === 302, "Middleware denies cross-role access with redirect");
    const location = res.headers.get("location");
    assert(!!location && location.includes("/staff/dashboard"), "Redirects Staff back to /staff/dashboard safely");
  }

  // Test 9: OMAG_HEAD Attempting Staff Dashboard
  {
    console.log("\n[Test 9] OMAG_HEAD Attempting Staff Dashboard (Role Boundary Enforcement)");
    const req = new NextRequest("http://localhost:3000/staff/dashboard");
    req.cookies.set(SESSION_COOKIE_NAME, headToken);
    const res = await middleware(req);
    assert(res.status === 307 || res.status === 302, "Middleware denies cross-role access with redirect");
    const location = res.headers.get("location");
    assert(!!location && location.includes("/head/dashboard"), "Redirects Head back to /head/dashboard safely");
  }

  // Test 10: Logout Invalidates Cookie
  {
    console.log("\n[Test 10] Logout Invalidation");
    const res = await logoutHandler();
    assert(res.status === 200, "Logout responds with HTTP 200");
    const setCookie = res.headers.get("set-cookie");
    assert(!!setCookie && (setCookie.includes("Max-Age=0") || setCookie.includes("max-age=0")), "Cookie is expired with Max-Age=0");
  }

  // Test 11: Protected API Without Session
  {
    console.log("\n[Test 11] Protected API Without Session");
    const req = new Request("http://localhost:3000/api/test-protected");
    const res = await protectedApiHandler(req);
    assert(res.status === 401, "Protected API returns HTTP 401 when no session exists");
  }

  // Test 12: Protected API With Wrong Role (requireRole Enforcement)
  {
    console.log("\n[Test 12] Protected API With Wrong Role Enforcement");
    // OMAG_STAFF trying to access OMAG_HEAD-only endpoint
    const req = new Request("http://localhost:3000/api/test-protected", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${staffToken}` },
    });
    const res = await protectedApiHandler(req);
    assert(res.status === 403, "Protected API returns HTTP 403 when wrong role attempts access");

    // OMAG_HEAD accessing OMAG_HEAD endpoint
    const headReq = new Request("http://localhost:3000/api/test-protected", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${headToken}` },
    });
    const headRes = await protectedApiHandler(headReq);
    assert(headRes.status === 200, "Protected API returns HTTP 200 when authorized role accesses");
  }

  // Test 13: Client-Supplied Fake Role Attempt
  {
    console.log("\n[Test 13] Client-Supplied Fake Role Tampering Attempt");
    // Attempting to send a forged / untrusted token
    const tamperedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiT01BR19IRUFEIn0.fake_signature";
    const req = new Request("http://localhost:3000/api/test-protected", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${tamperedToken}` },
    });
    const res = await protectedApiHandler(req);
    assert(res.status === 401, "Tampered / forged JWT token is rejected with HTTP 401");
  }

  // Test 14: Role-Testing / Impersonation Bypass Audit in LoginForm Source
  {
    console.log("\n[Test 14] Source Code Audit for Login Bypass and Impersonation Switches");
    const loginFormPath = path.resolve(__dirname, "../features/auth/components/LoginForm.tsx");
    const source = fs.readFileSync(loginFormPath, "utf-8");
    const hasRoleSelector = source.includes("handleRoleSelect") || source.includes("selectedRole");
    const hasQuickSwitchButtons = source.includes("OMAG Head") && source.includes("OMAG Staff") && source.includes("<button");
    const hasBypassRedirect = source.includes("setTimeout") && source.includes("router.push('/head/dashboard')");

    assert(!hasRoleSelector, "LoginForm contains no role selection state or handlers");
    assert(!hasQuickSwitchButtons, "LoginForm contains no role-testing switch buttons");
    assert(!hasBypassRedirect, "LoginForm contains no direct navigation bypass");
  }

  console.log(`\n${CYAN}==============================================================================${RESET}`);
  console.log(`TEST SUMMARY: ${GREEN}${passedCount} PASSED${RESET}, ${failedCount > 0 ? `${RED}${failedCount} FAILED${RESET}` : `${GREEN}0 FAILED${RESET}`}`);
  console.log(`${CYAN}==============================================================================\n${RESET}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
