import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/permissions/guards";
import {
  getPhotoVerifications,
  getCropLossCaseVerifications,
  createPhotoVerification,
  PhotoUploadSchema,
  QueryVerificationSchema,
} from "@/features/photo-verification";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = QueryVerificationSchema.parse({
      search: searchParams.get("search") || undefined,
      barangay: searchParams.get("barangay") || undefined,
      status: searchParams.get("status") || undefined,
      caseStatus: searchParams.get("caseStatus") || undefined,
      priorityLevel: searchParams.get("priorityLevel") || undefined,
      aiAssessment: searchParams.get("aiAssessment") || undefined,
      mode: (searchParams.get("mode") as any) || "cases",
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 15,
    });

    if (query.mode === "photos") {
      const result = await getPhotoVerifications(query);
      return NextResponse.json(result);
    }

    const result = await getCropLossCaseVerifications(query);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch photo verification records" },
      { status: 500 }
    );
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
    const validated = PhotoUploadSchema.parse(body);

    const record = await createPhotoVerification(validated, session.id, session.role);
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create photo verification record" },
      { status: 400 }
    );
  }
}
