import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions/guards";
import { getPhotoVerificationById } from "@/features/photo-verification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
  }

  try {
    const record = await getPhotoVerificationById(id);
    if (!record) {
      return NextResponse.json({ error: "Photo verification record not found" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve photo verification record" },
      { status: 500 }
    );
  }
}
