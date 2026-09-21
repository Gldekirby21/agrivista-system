import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { logAuditEvent } from "@/lib/audit/auditLog";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ApprovalSchema = z.object({
  headApprovalStatus: z.enum(["APPROVED", "REJECTED", "PENDING"]),
  headApprovalRemarks: z.string().optional().nullable(),
});

/**
 * POST /api/pcic/claims/[id]/approval
 * 
 * PROPOSED SYSTEM DESIGN:
 * OMAG Head Approval Gate for Crop-Loss Prediction.
 * Strictly restricted to OMAG_HEAD role.
 * Sets headApprovalStatus (APPROVED | REJECTED | PENDING), approver ID, timestamp, and remarks.
 * Emits immutable audit log entry.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_HEAD"], request);
  if (!auth.authorized) return auth.response;

  try {
    const { id: claimId } = await params;
    const body = await request.json();

    const validated = ApprovalSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const claim = await prisma.pcicClaim.findUnique({
      where: { id: claimId },
      include: {
        report: {
          select: {
            id: true,
            reportNumber: true,
            farmerId: true,
          },
        },
      },
    });

    if (!claim) {
      return NextResponse.json(
        { error: `PCIC Claim #${claimId} not found.` },
        { status: 404 }
      );
    }

    const { headApprovalStatus, headApprovalRemarks } = validated.data;
    const approvalTimestamp = new Date();

    const updatedClaim = await prisma.pcicClaim.update({
      where: { id: claimId },
      data: {
        headApprovalStatus,
        headApprovedById: auth.session.id,
        headApprovedAt: approvalTimestamp,
        headApprovalRemarks: headApprovalRemarks?.trim() || null,
      },
      include: {
        headApprovedBy: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    // Write immutable audit log
    try {
      await logAuditEvent({
        userId: auth.session.id,
        roleSnapshot: auth.session.role,
        action:
          headApprovalStatus === "APPROVED"
            ? "CROP_LOSS_HEAD_APPROVED"
            : headApprovalStatus === "REJECTED"
            ? "CROP_LOSS_HEAD_REJECTED"
            : "CROP_LOSS_HEAD_APPROVAL_RESET",
        module: "PCIC_CLAIM",
        recordId: claimId,
        previousValues: {
          headApprovalStatus: claim.headApprovalStatus,
          headApprovedById: claim.headApprovedById,
          headApprovedAt: claim.headApprovedAt,
        },
        newValues: {
          claimId,
          claimNumber: claim.claimNumber,
          reportNumber: claim.report?.reportNumber,
          headApprovalStatus,
          headApprovedById: auth.session.id,
          headApprovedAt: approvalTimestamp.toISOString(),
          headApprovalRemarks: headApprovalRemarks?.trim() || null,
        },
      });
    } catch (auditErr) {
      console.error("POST /approval audit log error (non-blocking):", auditErr);
    }

    return NextResponse.json({
      success: true,
      data: updatedClaim,
      message: `Claim #${claim.claimNumber} approval status updated to ${headApprovalStatus}.`,
    });
  } catch (error: any) {
    console.error("POST /api/pcic/claims/[id]/approval error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during approval" },
      { status: 500 }
    );
  }
}
