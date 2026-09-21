import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { syncCohortRankings } from "@/features/pcic/services/pcicService";
import { logAuditEvent } from "@/lib/audit/auditLog";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const AssessmentSchema = z.object({
  assessedDamagePercent: z
    .number()
    .min(0, "Must be at least 0")
    .max(100, "Cannot exceed 100"),
  assessedAreaHa: z
    .number()
    .positive("Must be greater than 0"),
  cropStage: z.string().min(1, "Crop Stage is required"),
  assessorNotes: z.string().optional().nullable(),
});

/**
 * POST /api/pcic/claims/[id]/assessment
 * Creates or updates the DamageAssessment for the DamageReport linked to a PCIC claim.
 * Staff enters field assessment data: assessed damage %, area, crop stage, notes.
 * Accessible to OMAG_STAFF only.
 * After saving, re-syncs cohort priority rankings since assessed damage affects scoring.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], request);
  if (!auth.authorized) return auth.response;

  try {
    const { id: claimId } = await params;
    const body = await request.json();

    const validated = AssessmentSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    // Verify claim exists and get its reportId
    const claim = await prisma.pcicClaim.findUnique({
      where: { id: claimId },
      select: { id: true, reportId: true, claimNumber: true },
    });

    if (!claim) {
      return NextResponse.json(
        { error: `PCIC Claim ${claimId} not found` },
        { status: 404 }
      );
    }

    const { assessedDamagePercent, assessedAreaHa, cropStage, assessorNotes } =
      validated.data;

    // Upsert DamageAssessment for the linked DamageReport
    const assessment = await prisma.damageAssessment.upsert({
      where: { reportId: claim.reportId },
      create: {
        reportId: claim.reportId,
        assessedDamagePercent,
        assessedAreaHa,
        cropStage,
        assessorNotes: assessorNotes ?? null,
        assessedAt: new Date(),
      },
      update: {
        assessedDamagePercent,
        assessedAreaHa,
        cropStage,
        assessorNotes: assessorNotes ?? null,
        assessedAt: new Date(),
      },
    });

    // Re-sync cohort priority rankings — assessed damage affects score
    try {
      await syncCohortRankings();
    } catch (rankErr) {
      console.error("POST assessment: syncCohortRankings error (non-blocking):", rankErr);
    }

    // Log to audit trail
    try {
      await logAuditEvent({
        userId: auth.session.id,
        roleSnapshot: auth.session.role,
        action: "DAMAGE_ASSESSMENT_UPSERT",
        module: "PCIC_CLAIM",
        recordId: claimId,
        newValues: {
          claimId,
          reportId: claim.reportId,
          assessedDamagePercent,
          assessedAreaHa,
          cropStage,
        },
      });
    } catch (auditErr) {
      console.error("POST assessment: audit log error (non-blocking):", auditErr);
    }

    return NextResponse.json(
      {
        success: true,
        assessment: {
          ...assessment,
          assessedAt: assessment.assessedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/pcic/claims/[id]/assessment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save field assessment" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pcic/claims/[id]/assessment
 * Staff deletes an OMAG field evaluation from a claim without deleting the claim.
 * Accessible to OMAG_STAFF only.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], request);
  if (!auth.authorized) return auth.response;

  try {
    const { id: claimId } = await params;
    const { deleteDamageAssessment } = await import("@/features/pcic/services/pcicService");
    const result = await deleteDamageAssessment(claimId, auth.session.id, auth.session.role);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("DELETE /api/pcic/claims/[id]/assessment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete assessment" },
      { status: 400 }
    );
  }
}
