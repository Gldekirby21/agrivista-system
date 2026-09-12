import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { extractExifMetadata } from "@/features/photo-verification";
import { prisma } from "@/lib/database/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
  }

  try {
    const existing = await prisma.photoVerification.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Photo verification record not found" }, { status: 404 });
    }

    let base64Data: string | undefined;
    try {
      const body = await req.json();
      base64Data = body.base64Data;
    } catch {
      // Body may be empty if re-extracting from already stored metadata
    }

    let extracted;
    if (base64Data) {
      extracted = await extractExifMetadata(base64Data);
    } else {
      extracted = {
        hasExif: existing.photoLatitude !== null || existing.photoTimestamp !== null,
        latitude: existing.photoLatitude,
        longitude: existing.photoLongitude,
        altitude: existing.photoAltitude,
        capturedDate: existing.photoTimestamp,
        deviceMake: existing.deviceMake,
        deviceModel: existing.deviceModel,
        rawExifData: existing.metadataJson as any,
      };
    }

    return NextResponse.json(extracted);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to extract metadata" },
      { status: 400 }
    );
  }
}
