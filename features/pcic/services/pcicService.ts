/**
 * PCIC Crop-Loss Claim Monitoring & Prioritization Service Layer
 * Objective 6: Automated PCIC Claim Prioritization
 */

import { prisma } from "@/lib/database/prisma";
import { ClaimStatus, PriorityLevel } from "@prisma/client";
import {
  CreatePcicClaimInput,
  UpdatePcicClaimInput,
  UpdateClaimStatusInput,
  UpdateCoordinationInput,
  ClaimQueryParams,
} from "../validation/schemas";
import {
  PcicClaimDTO,
  PcicClaimListItemDTO,
  PaginatedResult,
} from "../types";
import {
  computeClaimScore,
  rankClaims,
  ClaimPrioritizationInput,
} from "./priorityEngine";

/**
 * Generates human-readable sequential report and claim numbers.
 */
function generateReferenceNumbers(): { reportNumber: string; claimNumber: string } {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return {
    reportNumber: `DR-POL-${timestamp.toString().slice(-6)}-${randomSuffix}`,
    claimNumber: `PCIC-POL-${timestamp.toString().slice(-6)}-${randomSuffix}`,
  };
}

/**
 * Re-ranks eligible claims in the database and updates ClaimPriorityScore records atomically.
 * Claims that are APPROVED or PENDING participate in priority ranking.
 * Explicitly REJECTED, DECLINED, or SETTLED claims are excluded.
 */
export async function syncCohortRankings(tx: any = prisma): Promise<void> {
  const claims = await tx.pcicClaim.findMany({
    where: {
      headApprovalStatus: { notIn: ["REJECTED", "DECLINED"] },
    },
    include: {
      report: {
        include: {
          assessment: true,
        },
      },
    },
  });

  if (claims.length === 0) return;

  const rankingInputs: ClaimPrioritizationInput[] = claims.map((c: any) => ({
    claimId: c.id,
    claimNumber: c.claimNumber,
    incidentDate: c.report.incidentDate,
    reportedDamagePercent: c.report.reportedDamagePercent,
    assessedDamagePercent: c.report.assessment?.assessedDamagePercent ?? null,
  }));

  const rankedResults = rankClaims(rankingInputs);

  await Promise.all(
    rankedResults.map((item) =>
      tx.claimPriorityScore.upsert({
        where: { claimId: item.claimId },
        create: {
          claimId: item.claimId,
          score: item.score,
          priorityLevel: item.priorityLevel,
          rankPosition: item.rankPosition,
          formulaBreakdown: item.formulaBreakdown as any,
        },
        update: {
          score: item.score,
          priorityLevel: item.priorityLevel,
          rankPosition: item.rankPosition,
          formulaBreakdown: item.formulaBreakdown as any,
          calculatedAt: new Date(),
        },
      })
    )
  );
}

/**
 * Retrieves paginated PCIC claims with relational details and priority ranking.
 */
export async function getPcicClaims(
  params: ClaimQueryParams
): Promise<PaginatedResult<PcicClaimListItemDTO>> {
  const {
    page = 1,
    limit = 10,
    claimStatus,
    priorityLevel,
    calamityType,
    barangay,
    farmerId,
    parcelId,
    search,
  } = params;

  const skip = (page - 1) * limit;
  const where: any = {};

  if (claimStatus) {
    where.claimStatus = claimStatus;
  }

  if (priorityLevel) {
    where.priorityScore = {
      priorityLevel,
    };
  }

  if (calamityType) {
    where.report = {
      ...(where.report || {}),
      calamityType: { equals: calamityType, mode: "insensitive" },
    };
  }

  if (barangay) {
    where.report = {
      ...(where.report || {}),
      farmer: {
        barangay: { equals: barangay, mode: "insensitive" },
      },
    };
  }

  if (farmerId) {
    where.report = {
      ...(where.report || {}),
      farmerId,
    };
  }

  if (parcelId) {
    where.report = {
      ...(where.report || {}),
      parcelId,
    };
  }

  if (search) {
    where.OR = [
      { claimNumber: { contains: search, mode: "insensitive" } },
      { report: { reportNumber: { contains: search, mode: "insensitive" } } },
      { report: { farmer: { firstName: { contains: search, mode: "insensitive" } } } },
      { report: { farmer: { lastName: { contains: search, mode: "insensitive" } } } },
      { report: { farmer: { rsbsaNumber: { contains: search, mode: "insensitive" } } } },
      { report: { crop: { cropType: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [total, rawClaims] = await Promise.all([
    prisma.pcicClaim.count({ where }),
    prisma.pcicClaim.findMany({
      where,
      skip,
      take: limit,
      include: {
        report: {
          include: {
            farmer: true,
            crop: true,
            parcel: {
              include: { farm: true },
            },
            assessment: true,
          },
        },
        priorityScore: true,
      },
      orderBy: [
        { priorityScore: { rankPosition: "asc" } },
        { filingDate: "desc" },
      ],
    }),
  ]);

  const items: PcicClaimListItemDTO[] = rawClaims.map((c) => {
    const hasAssessed =
      c.report.assessment?.assessedDamagePercent !== undefined &&
      c.report.assessment?.assessedDamagePercent !== null;

    const applicableDamage = hasAssessed
      ? Number(c.report.assessment!.assessedDamagePercent)
      : Number(c.report.reportedDamagePercent);

    return {
      id: c.id,
      claimNumber: c.claimNumber,
      claimStatus: c.claimStatus,
      insurancePolicyNo: c.insurancePolicyNo,
      filingDate: c.filingDate.toISOString(),
      remarks: c.remarks,
      reportId: c.report.id,
      reportNumber: c.report.reportNumber,
      farmerId: c.report.farmer.id,
      farmerName: `${c.report.farmer.firstName} ${c.report.farmer.lastName}`,
      farmerRsbsa: c.report.farmer.rsbsaNumber,
      barangay: c.report.farmer.barangay,
      cropType: c.report.crop.cropType,
      calamityType: c.report.calamityType,
      incidentDate: c.report.incidentDate.toISOString(),
      reportedDamagePercent: c.report.reportedDamagePercent,
      assessedDamagePercent: c.report.assessment?.assessedDamagePercent ?? null,
      applicableDamagePercent: applicableDamage,
      damageBasis: hasAssessed ? "ASSESSED" : "REPORTED",
      reportedAffectedAreaHa: c.report.reportedAffectedAreaHa,
      parcelNumber: c.report.parcel?.parcelNumber ?? null,
      cropStage: c.report.assessment?.cropStage ?? null,
      priorityScore: c.priorityScore?.score ?? null,
      priorityLevel: c.priorityScore?.priorityLevel ?? null,
      rankPosition: c.priorityScore?.rankPosition ?? null,
      priorityExplanation: (c.priorityScore?.formulaBreakdown as any)?.explanation ?? null,
    };
  });

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Retrieves full dossier of a PCIC claim including audit logs.
 */
export async function getPcicClaimById(id: string): Promise<any> {
  const claim = await prisma.pcicClaim.findUnique({
    where: { id },
    include: {
      report: {
        include: {
          farmer: true,
          crop: true,
          parcel: {
            include: { farm: true },
          },
          photos: true,
          photoVerifications: {
            orderBy: { createdAt: "desc" },
            include: {
              verifiedBy: { select: { fullName: true } },
            },
          },
          assessment: true,
          prediction: true,
        },
      },
      priorityScore: true,
    },
  });

  if (!claim) return null;

  // Fetch immutable audit trail for this claim and report
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      module: "PCIC_CLAIM",
      recordId: claim.id,
    },
    orderBy: { timestamp: "desc" },
    include: { user: { select: { fullName: true, username: true, role: true } } },
  });

  return {
    ...claim,
    report: {
      ...claim.report,
      incidentDate: claim.report.incidentDate.toISOString(),
      createdAt: claim.report.createdAt.toISOString(),
      updatedAt: claim.report.updatedAt.toISOString(),
      assessment: claim.report.assessment
        ? {
            ...claim.report.assessment,
            assessedAt: claim.report.assessment.assessedAt.toISOString(),
          }
        : null,
      photoVerifications:
        claim.report.photoVerifications?.map((pv: any) => ({
          ...pv,
          photoTimestamp: pv.photoTimestamp ? pv.photoTimestamp.toISOString() : null,
          createdAt: pv.createdAt ? pv.createdAt.toISOString() : null,
          aiAssessedAt: pv.aiAssessedAt ? pv.aiAssessedAt.toISOString() : null,
        })) || [],
    },
    filingDate: claim.filingDate.toISOString(),
    reviewedAt: claim.reviewedAt ? claim.reviewedAt.toISOString() : null,
    priorityScore: claim.priorityScore
      ? {
          ...claim.priorityScore,
          calculatedAt: claim.priorityScore.calculatedAt.toISOString(),
        }
      : null,
    auditLogs,
  };
}

/**
 * Staff creates a new crop damage incident report and opens a PCIC claim monitoring record.
 */
export async function createPcicClaim(
  input: CreatePcicClaimInput,
  userId: string,
  userRole: string
): Promise<any> {
  const { reportNumber, claimNumber } = generateReferenceNumbers();

  // Verify farmer, parcel, and crop exist
  const [farmer, parcel, crop] = await Promise.all([
    prisma.farmer.findUnique({ where: { id: input.farmerId } }),
    prisma.farmParcel.findUnique({ where: { id: input.parcelId } }),
    prisma.crop.findUnique({ where: { id: input.cropId } }),
  ]);

  if (!farmer) throw new Error(`Farmer ID ${input.farmerId} not found.`);
  if (!parcel) throw new Error(`Farm Parcel ID ${input.parcelId} not found.`);
  if (!crop) throw new Error(`Crop ID ${input.cropId} not found.`);

  return await prisma.$transaction(
    async (tx) => {
    // 1. Create DamageReport
    const damageReport = await tx.damageReport.create({
      data: {
        reportNumber,
        farmerId: input.farmerId,
        parcelId: input.parcelId,
        cropId: input.cropId,
        incidentDate: new Date(input.incidentDate),
        calamityType: input.calamityType,
        reportedDamagePercent: input.reportedDamagePercent,
        reportedAffectedAreaHa: input.reportedAffectedAreaHa,
        narrativeDescription: input.narrativeDescription || null,
        status: input.claimStatus || ClaimStatus.SUBMITTED,
        createdById: userId,
      },
    });

    // 2. Create PcicClaim
    const pcicClaim = await tx.pcicClaim.create({
      data: {
        claimNumber,
        reportId: damageReport.id,
        claimStatus: input.claimStatus || ClaimStatus.SUBMITTED,
        insurancePolicyNo: input.insurancePolicyNo || null,
        remarks: input.remarks || null,
      },
    });

    // 3. Calculate deterministic priority score
    const initialScore = computeClaimScore({
      claimId: pcicClaim.id,
      claimNumber: pcicClaim.claimNumber,
      incidentDate: damageReport.incidentDate,
      reportedDamagePercent: damageReport.reportedDamagePercent,
    });

    await tx.claimPriorityScore.create({
      data: {
        claimId: pcicClaim.id,
        score: initialScore.score,
        priorityLevel: initialScore.priorityLevel,
        rankPosition: null, // Will be cohort ranked
        formulaBreakdown: initialScore.formulaBreakdown as any,
      },
    });

    // 4. Re-rank entire cohort atomically
    await syncCohortRankings(tx);

    // 4b. If photoVerificationId is provided, associate the photo verification record with the newly created DamageReport
    if (input.photoVerificationId) {
      await tx.photoVerification.update({
        where: { id: input.photoVerificationId },
        data: { damageReportId: damageReport.id },
      });

      await tx.auditLog.create({
        data: {
          userId,
          roleSnapshot: userRole,
          module: "PHOTO_VERIFICATION",
          action: "LINK_CLAIM",
          recordId: input.photoVerificationId,
          newValues: {
            photoVerificationId: input.photoVerificationId,
            damageReportId: damageReport.id,
            claimNumber,
            reportNumber,
          },
        },
      });
    }

    // 5. Audit Log
    await tx.auditLog.create({
      data: {
        userId,
        roleSnapshot: userRole,
        module: "PCIC_CLAIM",
        action: "PCIC_CLAIM_CREATE",
        recordId: pcicClaim.id,
        newValues: {
          claimNumber,
          reportNumber,
          farmerId: input.farmerId,
          farmerName: `${farmer.firstName} ${farmer.lastName}`,
          cropType: crop.cropType,
          calamityType: input.calamityType,
          reportedDamagePercent: input.reportedDamagePercent,
          initialScore: initialScore.score,
          initialPriorityLevel: initialScore.priorityLevel,
        },
      },
    });

    return await tx.pcicClaim.findUnique({
      where: { id: pcicClaim.id },
      include: {
        report: {
          include: { farmer: true, crop: true, parcel: true },
        },
        priorityScore: true,
      },
    });
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Staff updates damage information, operational remarks, and optional field assessment.
 */
export async function updatePcicClaim(
  id: string,
  input: UpdatePcicClaimInput,
  userId: string,
  userRole: string
): Promise<any> {
  const existing = await prisma.pcicClaim.findUnique({
    where: { id },
    include: {
      report: {
        include: { assessment: true },
      },
      priorityScore: true,
    },
  });

  if (!existing) throw new Error(`PCIC Claim ID ${id} not found.`);

  return await prisma.$transaction(async (tx) => {
    // 1. Update DamageReport
    const reportUpdateData: any = {};
    if (input.incidentDate) reportUpdateData.incidentDate = new Date(input.incidentDate);
    if (input.calamityType) reportUpdateData.calamityType = input.calamityType;
    if (input.reportedDamagePercent !== undefined) {
      reportUpdateData.reportedDamagePercent = input.reportedDamagePercent;
    }
    if (input.reportedAffectedAreaHa !== undefined) {
      reportUpdateData.reportedAffectedAreaHa = input.reportedAffectedAreaHa;
    }
    if (input.narrativeDescription !== undefined) {
      reportUpdateData.narrativeDescription = input.narrativeDescription;
    }

    if (Object.keys(reportUpdateData).length > 0) {
      await tx.damageReport.update({
        where: { id: existing.reportId },
        data: reportUpdateData,
      });
    }

    // 2. Update PcicClaim
    const claimUpdateData: any = {};
    if (input.insurancePolicyNo !== undefined) claimUpdateData.insurancePolicyNo = input.insurancePolicyNo;
    if (input.remarks !== undefined) claimUpdateData.remarks = input.remarks;

    if (Object.keys(claimUpdateData).length > 0) {
      await tx.pcicClaim.update({
        where: { id },
        data: claimUpdateData,
      });
    }

    // 3. Upsert DamageAssessment if assessedDamagePercent is supplied
    if (input.assessedDamagePercent !== undefined && input.assessedDamagePercent !== null) {
      await tx.damageAssessment.upsert({
        where: { reportId: existing.reportId },
        create: {
          reportId: existing.reportId,
          assessedDamagePercent: input.assessedDamagePercent,
          assessedAreaHa: input.assessedAreaHa || existing.report.reportedAffectedAreaHa,
          cropStage: input.cropStage || "Reproductive",
          assessorNotes: input.assessorNotes || null,
        },
        update: {
          assessedDamagePercent: input.assessedDamagePercent,
          assessedAreaHa: input.assessedAreaHa || existing.report.reportedAffectedAreaHa,
          cropStage: input.cropStage || "Reproductive",
          assessorNotes: input.assessorNotes || null,
          assessedAt: new Date(),
        },
      });
    }

    // 4. Recalculate priority rankings cohort
    await syncCohortRankings(tx);

    // 5. Audit Log
    await tx.auditLog.create({
      data: {
        userId,
        roleSnapshot: userRole,
        module: "PCIC_CLAIM",
        action: "PCIC_CLAIM_UPDATE",
        recordId: id,
        previousValues: {
          reportedDamagePercent: existing.report.reportedDamagePercent,
          assessedDamagePercent: existing.report.assessment?.assessedDamagePercent ?? null,
          remarks: existing.remarks,
        },
        newValues: {
          reportedDamagePercent: input.reportedDamagePercent ?? existing.report.reportedDamagePercent,
          assessedDamagePercent: input.assessedDamagePercent ?? existing.report.assessment?.assessedDamagePercent,
          remarks: input.remarks ?? existing.remarks,
        },
      },
    });

    return await tx.pcicClaim.findUnique({
      where: { id },
      include: {
        report: {
          include: { farmer: true, crop: true, parcel: true, assessment: true },
        },
        priorityScore: true,
      },
    });
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Staff updates claim monitoring status (e.g. SUBMITTED -> FOR_REVIEW -> COORDINATED_WITH_PCIC).
 */
export async function updateClaimStatus(
  id: string,
  input: UpdateClaimStatusInput,
  userId: string,
  userRole: string
): Promise<any> {
  const existing = await prisma.pcicClaim.findUnique({ where: { id } });
  if (!existing) throw new Error(`PCIC Claim ID ${id} not found.`);

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.pcicClaim.update({
      where: { id },
      data: {
        claimStatus: input.claimStatus,
        remarks: input.remarks ? `${existing.remarks ? `${existing.remarks}\n` : ""}[Status Update: ${input.claimStatus}] ${input.remarks}` : existing.remarks,
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
      include: {
        report: { include: { farmer: true, crop: true } },
        priorityScore: true,
      },
    });

    // Also synchronize DamageReport status
    await tx.damageReport.update({
      where: { id: existing.reportId },
      data: { status: input.claimStatus },
    });

    // Audit Log
    await tx.auditLog.create({
      data: {
        userId,
        roleSnapshot: userRole,
        module: "PCIC_CLAIM",
        action: "PCIC_STATUS_UPDATE",
        recordId: id,
        previousValues: { claimStatus: existing.claimStatus },
        newValues: { claimStatus: input.claimStatus, remarks: input.remarks },
      },
    });

    return updated;
  }, { maxWait: 15000, timeout: 30000 });
}

/**
 * Staff records adjuster follow-up notes and focal person coordination details.
 */
export async function updateCoordinationNotes(
  id: string,
  input: UpdateCoordinationInput,
  userId: string,
  userRole: string
): Promise<any> {
  const existing = await prisma.pcicClaim.findUnique({ where: { id } });
  if (!existing) throw new Error(`PCIC Claim ID ${id} not found.`);

  const dateHeader = new Date().toISOString().split("T")[0];
  const formattedNote = `[Coordination ${dateHeader}] ${input.remarks}`;
  const combinedRemarks = existing.remarks ? `${existing.remarks}\n${formattedNote}` : formattedNote;

  const updated = await prisma.pcicClaim.update({
    where: { id },
    data: {
      remarks: combinedRemarks,
      reviewedAt: new Date(),
      reviewedBy: input.reviewedBy || userId,
    },
    include: {
      report: { include: { farmer: true, crop: true } },
      priorityScore: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      roleSnapshot: userRole,
      module: "PCIC_CLAIM",
      action: "PCIC_COORDINATION_UPDATE",
      recordId: id,
      previousValues: { remarks: existing.remarks },
      newValues: { remarks: combinedRemarks, reviewedBy: input.reviewedBy || userId },
    },
  });

  return updated;
}

/**
 * Explicit cohort-wide priority recalculation trigger.
 */
export async function recalculateAllPriorities(
  userId: string,
  userRole: string
): Promise<{ success: boolean; recalculatedCount: number; timestamp: string }> {
  const claims = await prisma.pcicClaim.findMany();
  await syncCohortRankings(prisma);

  await prisma.auditLog.create({
    data: {
      userId,
      roleSnapshot: userRole,
      module: "PCIC_CLAIM",
      action: "PCIC_PRIORITY_CALCULATE",
      recordId: "COHORT",
      newValues: {
        recalculatedCount: claims.length,
        algorithm: "70/30 deterministic severity & date aging",
      },
    },
  });

  return {
    success: true,
    recalculatedCount: claims.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Retrieves the prioritized leaderboard of claims sorted by rankPosition ASC.
 * Automatically synchronizes cohort rankings before querying to ensure all
 * pending and approved claims are scored and ranked.
 */
export async function getPriorityLeaderboard(limit: number = 20): Promise<any[]> {
  // Sync cohort rankings so any newly added or pending claims are scored and assigned rank positions
  try {
    await syncCohortRankings(prisma);
  } catch (syncErr) {
    console.error("syncCohortRankings error inside getPriorityLeaderboard (continuing):", syncErr);
  }

  return await prisma.claimPriorityScore.findMany({
    where: {
      claim: {
        headApprovalStatus: { notIn: ["REJECTED", "DECLINED"] },
      },
    },
    take: limit,
    orderBy: [
      { rankPosition: "asc" },
      { score: "desc" },
    ],
    include: {
      claim: {
        include: {
          report: {
            include: {
              farmer: true,
              crop: true,
              parcel: { include: { farm: true } },
              assessment: true,
              photoVerifications: {
                select: {
                  id: true,
                  systemReviewStatus: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Staff deletes a PCIC claim and associated DamageReport.
 * Cascade deletes linked DamageAssessment, ClaimPriorityScore, DamagePhoto.
 * Re-ranks remaining claims in the cohort.
 */
export async function deletePcicClaim(
  id: string,
  userId: string,
  userRole: string
): Promise<{ success: boolean; claimNumber: string }> {
  const existing = await prisma.pcicClaim.findUnique({
    where: { id },
    include: { report: true },
  });

  if (!existing) {
    throw new Error(`PCIC Claim ID ${id} not found.`);
  }

  const claimNumber = existing.claimNumber;
  const reportId = existing.reportId;

  await prisma.$transaction(async (tx) => {
    // 1. Delete the claim (deleting DamageReport will cascade delete PcicClaim, DamageAssessment, PriorityScore)
    await tx.damageReport.delete({
      where: { id: reportId },
    });

    // 2. Re-rank remaining claims
    await syncCohortRankings(tx);

    // 3. Audit log
    await tx.auditLog.create({
      data: {
        userId,
        roleSnapshot: userRole,
        module: "PCIC_CLAIM",
        action: "PCIC_CLAIM_DELETE",
        recordId: id,
        previousValues: {
          claimNumber,
          reportId,
          farmerId: existing.report.farmerId,
          reportedDamagePercent: existing.report.reportedDamagePercent,
        },
      },
    });
  });

  return { success: true, claimNumber };
}

/**
 * Staff deletes an OMAG field evaluation (DamageAssessment) for a claim without deleting the claim itself.
 * Re-ranks cohort since score reverts to reported damage percent.
 */
export async function deleteDamageAssessment(
  claimId: string,
  userId: string,
  userRole: string
): Promise<{ success: boolean }> {
  const claim = await prisma.pcicClaim.findUnique({
    where: { id: claimId },
    include: { report: { include: { assessment: true } } },
  });

  if (!claim) {
    throw new Error(`PCIC Claim ID ${claimId} not found.`);
  }

  if (!claim.report?.assessment) {
    throw new Error(`No field assessment found for PCIC Claim ${claimId}.`);
  }

  const prevAssessment = claim.report.assessment;

  await prisma.$transaction(async (tx) => {
    await tx.damageAssessment.delete({
      where: { reportId: claim.reportId },
    });

    await syncCohortRankings(tx);

    await tx.auditLog.create({
      data: {
        userId,
        roleSnapshot: userRole,
        module: "PCIC_CLAIM",
        action: "DAMAGE_ASSESSMENT_DELETE",
        recordId: claimId,
        previousValues: {
          reportId: claim.reportId,
          assessedDamagePercent: prevAssessment.assessedDamagePercent,
          assessedAreaHa: prevAssessment.assessedAreaHa,
          cropStage: prevAssessment.cropStage,
        },
      },
    });
  });

  return { success: true };
}
