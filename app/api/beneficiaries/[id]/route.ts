import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { getBeneficiaryById } from "@/features/rsbsa/lib/beneficiaryQueries";
import { updateBeneficiary, archiveBeneficiary } from "@/features/rsbsa/lib/beneficiaryMutations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const beneficiaryId = parseInt(id, 10);
  if (isNaN(beneficiaryId)) {
    return NextResponse.json({ error: "Invalid beneficiary ID" }, { status: 400 });
  }

  const beneficiary = await getBeneficiaryById(beneficiaryId);
  if (!beneficiary) {
    return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
  }

  return NextResponse.json(beneficiary);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id } = await params;
  const beneficiaryId = parseInt(id, 10);
  if (isNaN(beneficiaryId)) {
    return NextResponse.json({ error: "Invalid beneficiary ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updated = await updateBeneficiary(beneficiaryId, body, session.id, session.role);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update beneficiary" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id } = await params;
  const beneficiaryId = parseInt(id, 10);
  if (isNaN(beneficiaryId)) {
    return NextResponse.json({ error: "Invalid beneficiary ID" }, { status: 400 });
  }

  try {
    const archived = await archiveBeneficiary(beneficiaryId, session.id, session.role);
    return NextResponse.json(archived);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to archive beneficiary" }, { status: 400 });
  }
}
