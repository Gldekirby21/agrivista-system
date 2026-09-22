// ==============================================================================
// API Route: /api/resource-demand/historical/[id]
// GET: Retrieve Historical Record (Staff & Head)
// PATCH: Update Historical Record (Staff Only)
// DELETE: Soft-Archive Historical Record (Staff Only)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import {
  getHistoricalDataById,
  updateHistoricalData,
  archiveHistoricalData,
  UpdateHistoricalDataSchema,
} from "@/features/resource-demand";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId <= 0) {
    return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
  }

  try {
    const record = await getHistoricalDataById(numId);
    if (!record) {
      return NextResponse.json({ error: "Historical record not found" }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error: any) {
    console.error(`GET /api/resource-demand/historical/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to retrieve historical record", message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: "Method Not Allowed",
      message: "Objective 5 (Historical Crop Yield & Purchase Modeling) is strictly VIEW-ONLY per the approved FDD. Updating historical records is disabled.",
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: "Method Not Allowed",
      message: "Objective 5 (Historical Crop Yield & Purchase Modeling) is strictly VIEW-ONLY per the approved FDD. Deleting or archiving historical records is disabled.",
    },
    { status: 405 }
  );
}
