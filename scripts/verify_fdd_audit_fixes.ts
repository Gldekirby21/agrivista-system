import { NextRequest } from "next/server";
import { POST as forecastsPost, GET as forecastsGet } from "../app/api/resource-demand/forecasts/route";
import { POST as forecastPost } from "../app/api/resource-demand/forecast/route";
import { POST as historicalPost, GET as historicalGet } from "../app/api/resource-demand/historical/route";
import { POST as simulatePost } from "../app/api/resource-demand/simulate/route";
import { POST as retrainPost } from "../app/api/resource-demand/retrain/route";
import { POST as trainPost } from "../app/api/resource-demand/train/route";
import { PATCH as histPatch, DELETE as histDelete } from "../app/api/resource-demand/historical/[id]/route";
import { POST as photoUploadPost } from "../app/api/photo-verification/upload/route";
import { POST as photoRootPost } from "../app/api/photo-verification/route";
import { signSessionToken, SESSION_COOKIE_NAME } from "../lib/auth/session";

async function runTests() {
  console.log("=== STARTING FDD VERIFICATION AUDIT SUITE ===");

  const headToken = await signSessionToken({
    id: "head-test-id",
    username: "head_user",
    role: "OMAG_HEAD",
    email: "head@polomolok.gov.ph",
    fullName: "OMAG Head",
  });

  const staffToken = await signSessionToken({
    id: "staff-test-id",
    username: "staff_user",
    role: "OMAG_STAFF",
    email: "staff@polomolok.gov.ph",
    fullName: "OMAG Staff",
  });

  console.log("\n[1] Verifying Objective 5 Write/Simulate/Retrain Decommissioning (Expecting 405 Method Not Allowed)...");

  // POST /api/resource-demand/forecasts
  const resForecasts = await forecastsPost();
  const jsonForecasts = await resForecasts.json();
  console.log(`POST /api/resource-demand/forecasts: HTTP ${resForecasts.status} -> ${jsonForecasts.message || jsonForecasts.error}`);
  if (resForecasts.status !== 405) throw new Error("Expected 405 for POST /api/resource-demand/forecasts");

  // POST /api/resource-demand/forecast
  const resForecast = await forecastPost();
  const jsonForecast = await resForecast.json();
  console.log(`POST /api/resource-demand/forecast: HTTP ${resForecast.status} -> ${jsonForecast.message || jsonForecast.error}`);
  if (resForecast.status !== 405) throw new Error("Expected 405 for POST /api/resource-demand/forecast");

  // POST /api/resource-demand/historical
  const resHistorical = await historicalPost();
  const jsonHistorical = await resHistorical.json();
  console.log(`POST /api/resource-demand/historical: HTTP ${resHistorical.status} -> ${jsonHistorical.message || jsonHistorical.error}`);
  if (resHistorical.status !== 405) throw new Error("Expected 405 for POST /api/resource-demand/historical");

  // POST /api/resource-demand/simulate
  const resSimulate = await simulatePost();
  const jsonSimulate = await resSimulate.json();
  console.log(`POST /api/resource-demand/simulate: HTTP ${resSimulate.status} -> ${jsonSimulate.message || jsonSimulate.error}`);
  if (resSimulate.status !== 405) throw new Error("Expected 405 for POST /api/resource-demand/simulate");

  // POST /api/resource-demand/retrain
  const resRetrain = await retrainPost();
  const jsonRetrain = await resRetrain.json();
  console.log(`POST /api/resource-demand/retrain: HTTP ${resRetrain.status} -> ${jsonRetrain.message || jsonRetrain.error}`);
  if (resRetrain.status !== 405) throw new Error("Expected 405 for POST /api/resource-demand/retrain");

  // POST /api/resource-demand/train
  const resTrain = await trainPost();
  const jsonTrain = await resTrain.json();
  console.log(`POST /api/resource-demand/train: HTTP ${resTrain.status} -> ${jsonTrain.message || jsonTrain.error}`);
  if (resTrain.status !== 405) throw new Error("Expected 405 for POST /api/resource-demand/train");

  // PATCH /api/resource-demand/historical/[id]
  const resPatch = await histPatch();
  console.log(`PATCH /api/resource-demand/historical/[id]: HTTP ${resPatch.status}`);
  if (resPatch.status !== 405) throw new Error("Expected 405 for PATCH historical/[id]");

  // DELETE /api/resource-demand/historical/[id]
  const resDelete = await histDelete();
  console.log(`DELETE /api/resource-demand/historical/[id]: HTTP ${resDelete.status}`);
  if (resDelete.status !== 405) throw new Error("Expected 405 for DELETE historical/[id]");

  console.log("\n[2] Verifying Objective 2 Photo Verification Upload RBAC...");

  // Call POST /api/photo-verification/upload with OMAG_HEAD cookie
  const reqHeadUpload = new NextRequest("http://localhost:3000/api/photo-verification/upload", {
    method: "POST",
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${headToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const resHeadUpload = await photoUploadPost(reqHeadUpload);
  console.log(`POST /api/photo-verification/upload (Head caller): HTTP ${resHeadUpload.status}`);
  if (resHeadUpload.status !== 403) throw new Error(`Expected 403 for Head calling photo upload, got ${resHeadUpload.status}`);

  // Call POST /api/photo-verification with OMAG_HEAD cookie
  const reqHeadRoot = new NextRequest("http://localhost:3000/api/photo-verification", {
    method: "POST",
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${headToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const resHeadRoot = await photoRootPost(reqHeadRoot);
  console.log(`POST /api/photo-verification (Head caller): HTTP ${resHeadRoot.status}`);
  if (resHeadRoot.status !== 403) throw new Error(`Expected 403 for Head calling root photo post, got ${resHeadRoot.status}`);

  console.log("\n[3] Verifying Objective 5 GET operations for OMAG_HEAD...");

  const reqHeadHistorical = new NextRequest("http://localhost:3000/api/resource-demand/historical?page=1&limit=5", {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${headToken}` },
  });
  const resHeadHistGet = await historicalGet(reqHeadHistorical);
  console.log(`GET /api/resource-demand/historical (Head): HTTP ${resHeadHistGet.status}`);
  if (resHeadHistGet.status !== 200) throw new Error("Expected 200 for Head reading historical data");

  const reqStaffHistorical = new NextRequest("http://localhost:3000/api/resource-demand/historical?page=1&limit=5", {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${staffToken}` },
  });
  const resStaffHistGet = await historicalGet(reqStaffHistorical);
  console.log(`GET /api/resource-demand/historical (Staff): HTTP ${resStaffHistGet.status}`);
  if (resStaffHistGet.status !== 403) throw new Error("Expected 403 for Staff reading historical data");

  const reqHeadForecasts = new NextRequest("http://localhost:3000/api/resource-demand/forecasts", {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${headToken}` },
  });
  const resHeadForecastsGet = await forecastsGet(reqHeadForecasts);
  console.log(`GET /api/resource-demand/forecasts (Head): HTTP ${resHeadForecastsGet.status}`);
  if (resHeadForecastsGet.status !== 200) throw new Error("Expected 200 for Head reading forecasts");

  console.log("\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
