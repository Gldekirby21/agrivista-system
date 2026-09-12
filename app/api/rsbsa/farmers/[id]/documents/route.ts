import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { addSupportingDocument } from "@/features/rsbsa/lib/mutations";
import { prisma } from "@/lib/database/prisma";

/**
 * GET /api/rsbsa/farmers/[id]/documents
 * Authenticated endpoint to list supporting documents for a farmer
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const farmerId = parseInt(id, 10);
    if (isNaN(farmerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid farmer ID format" },
        { status: 400 }
      );
    }

    const documents = await prisma.landDocument.findMany({
      where: { farmerId },
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    console.error("GET /api/rsbsa/farmers/[id]/documents error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rsbsa/farmers/[id]/documents
 * Staff-only endpoint to record supporting document metadata
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["OMAG_STAFF"], request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const farmerId = parseInt(id, 10);
    if (isNaN(farmerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid farmer ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const document = await addSupportingDocument(
      { ...body, farmerId },
      auth.session.id,
      auth.session.role
    );

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/rsbsa/farmers/[id]/documents error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to attach document" },
      { status: 400 }
    );
  }
}
