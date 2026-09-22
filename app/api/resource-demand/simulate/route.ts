// ==============================================================================
// API Route: /api/resource-demand/simulate
// Objective 5 is strictly VIEW-ONLY per the approved FDD.
// Scenario simulations are permanently disabled.
// ==============================================================================

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Method Not Allowed",
      message: "Objective 5 (Historical Crop Yield & Purchase Modeling) is strictly VIEW-ONLY per the approved FDD. Simulation is disabled.",
    },
    { status: 405 }
  );
}
