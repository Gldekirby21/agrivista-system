import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import { getBeneficiaries } from "@/features/rsbsa/lib/beneficiaryQueries";
import { createBeneficiary } from "@/features/rsbsa/lib/beneficiaryMutations";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const barangay = searchParams.get("barangay") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    const result = await getBeneficiaries({ search, barangay, status, page, limit });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch beneficiaries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = await req.json();
    const beneficiary = await createBeneficiary(body, session.id, session.role);
    return NextResponse.json(beneficiary, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create beneficiary" }, { status: 400 });
  }
}
