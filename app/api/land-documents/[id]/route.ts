import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import { updateLandDocument, archiveLandDocument } from "@/features/rsbsa/lib/beneficiaryMutations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id: docId } = await params;
  if (!docId || docId.trim() === "") {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  const doc = await prisma.landDocument.findUnique({
    where: { id: docId },
    include: {
      uploadedBy: {
        select: { id: true, fullName: true, role: true },
      },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id: docId } = await params;
  if (!docId || docId.trim() === "") {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updated = await updateLandDocument(docId, body, session.id, session.role);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update document" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id: docId } = await params;
  if (!docId || docId.trim() === "") {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  try {
    const archived = await archiveLandDocument(docId, session.id, session.role);
    return NextResponse.json(archived);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to archive document" }, { status: 400 });
  }
}
