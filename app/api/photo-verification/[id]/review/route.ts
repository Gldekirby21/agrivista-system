import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import {
  submitSystemReview,
  SystemReviewSchema,
} from "@/features/photo-verification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  // Staff and Head can submit municipal system review notes
  const auth = await requireRole(["OMAG_STAFF", "OMAG_HEAD"], req);
  if (!auth.authorized) {
    return auth.response;
  }
  const session = auth.session;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
  }

  try {
    // Server-side eligibility gate: verify the 4 mandatory verification/advisory items
    // before accepting any review submission.
    // 1. Great-Circle Geofence (calculatedDistanceMeters must be non-null)
    // 2. EXIF Camera Timestamp (photoTimestamp must be non-null)
    // 3. Device Hardware Sensor (deviceMake or deviceModel must be non-null)
    // 4. AI Advisory (aiAssessment must be non-null)
    // GPS Location Embedded is functional; review eligibility requires valid geofence, timestamp, and device sensors.
    const record = await prisma.photoVerification.findUnique({
      where: { id },
      select: {
        calculatedDistanceMeters: true,
        photoTimestamp: true,
        deviceMake: true,
        deviceModel: true,
        aiAssessment: true,
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: `Photo verification record '${id}' not found.` },
        { status: 404 }
      );
    }

    const missingBaseChecks: string[] = [];
    if (record.photoTimestamp === null) {
      missingBaseChecks.push("EXIF Camera Timestamp (3)");
    }
    if (record.deviceMake === null && record.deviceModel === null) {
      missingBaseChecks.push("Device Hardware Sensor (4)");
    }

    if (missingBaseChecks.length > 0) {
      return NextResponse.json(
        {
          error: `This record cannot be submitted for or reviewed by OMAG Head. The following baseline checks must be valid: ${missingBaseChecks.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // When 3 & 4 are valid, AI Advisory is required for Head review
    if (record.aiAssessment === null) {
      return NextResponse.json(
        {
          error: `AI Advisory Interpretation is required for OMAG Head review/approval. Please generate the AI advisory before finalizing review.`,
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validated = SystemReviewSchema.parse(body);

    const updated = await submitSystemReview(id, validated, session.id, session.role);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit system review" },
      { status: 400 }
    );
  }
}
