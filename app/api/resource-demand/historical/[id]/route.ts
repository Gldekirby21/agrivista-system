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

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId <= 0) {
    return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const parsed = UpdateHistoricalDataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const updated = await updateHistoricalData(
      numId,
      parsed.data,
      auth.session.id,
      auth.session.role
    );
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`PATCH /api/resource-demand/historical/${id} error:`, error);
    const status = error.message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to update historical record", message: error.message },
      { status }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId <= 0) {
    return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
  }

  try {
    const archived = await archiveHistoricalData(
      numId,
      auth.session.id,
      auth.session.role
    );
    return NextResponse.json({
      message: "Historical record archived successfully",
      record: archived,
    });
  } catch (error: any) {
    console.error(`DELETE /api/resource-demand/historical/${id} error:`, error);
    const status = error.message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to archive historical record", message: error.message },
      { status }
    );
  }
}
