import { prisma, withDbRetry } from "@/lib/database/prisma";
import { logAuditEvent } from "@/lib/audit/auditLog";
import { extractExifMetadata } from "./exifExtractor";
import { verifyPhotoMetadata } from "./deterministicVerifier";
import { generateAiAdvisoryAssessment } from "./geminiAdvisor";
import { validateAiConflict } from "./conflictGuard";
import {
  PhotoUploadInput,
  VerificationOptionsInput,
  SystemReviewInput,
  QueryVerificationInput,
} from "../validation/schemas";
import {
  PhotoVerificationListItem,
  VerificationStatusType,
  CropLossCaseVerificationListItem,
  CasePhotoSummaryItem,
  ConsolidatedCaseDossierDTO,
} from "../types";
import { Prisma } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

/**
 * Creates and uploads a new PhotoVerification record
 */
export async function createPhotoVerification(
  input: PhotoUploadInput,
  userId: string,
  roleSnapshot?: string
) {
  // Verify Farmer, Farm, and FarmParcel exist
  const parcel = await prisma.farmParcel.findUnique({
    where: { id: input.parcelId },
    include: {
      farm: {
        include: {
          farmer: true,
        },
      },
    },
  });

  if (!parcel) {
    throw new Error(`Farm Parcel ID ${input.parcelId} not found.`);
  }

  // Ensure farmId and farmerId match parcel relationships
  const targetFarmId = input.farmId || parcel.farmId;
  const targetFarmerId = input.farmerId || parcel.farm.farmerId;

  // Server-side validation of optional Crop-Loss Case link (Objective #6 integration)
  let validatedDamageReportId: number | null = null;
  if (input.damageReportId) {
    const damageReport = await prisma.damageReport.findUnique({
      where: { id: input.damageReportId },
      include: {
        parcel: { include: { farm: true } },
        farmer: true,
      },
    });

    if (!damageReport) {
      throw new Error(`Crop-loss case (DamageReport ID ${input.damageReportId}) not found.`);
    }

    if (damageReport.farmerId !== targetFarmerId) {
      throw new Error(
        `Farmer mismatch: Selected photo farmer (ID ${targetFarmerId}) does not match Crop-Loss Case farmer (ID ${damageReport.farmerId}).`
      );
    }

    if (damageReport.parcelId !== parcel.id) {
      throw new Error(
        `Parcel mismatch: Selected photo parcel (ID ${parcel.id}) does not match Crop-Loss Case parcel (ID ${damageReport.parcelId}).`
      );
    }

    if (input.farmId && damageReport.parcel.farmId !== targetFarmId) {
      throw new Error(
        `Farm mismatch: Selected photo farm (ID ${targetFarmId}) does not match Crop-Loss Case farm (ID ${damageReport.parcel.farmId}).`
      );
    }

    validatedDamageReportId = damageReport.id;
  }

  // Ensure uploadedById is a valid User foreign key
  let validUserId: string | null = userId;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
    validUserId = fallbackUser?.id || null;
  }

  // Generate storageKey if not provided
  const storageKey =
    input.storageKey ||
    `verifications/parcel-${parcel.id}/${Date.now()}-${input.originalFileName.replace(/[^\w.-]/g, "_")}`;

  // Initial record creation
  const record = await prisma.photoVerification.create({
    data: {
      farmerId: targetFarmerId,
      farmId: targetFarmId,
      parcelId: parcel.id,
      damageReportId: validatedDamageReportId,
      storageProvider: "LOCAL",
      bucketName: "agrivista-verifications",
      storageKey,
      originalFileName: input.originalFileName,
      fileSizeBytes: input.fileSizeBytes,
      mimeType: input.mimeType,
      registeredLatitude: parcel.latitude,
      registeredLongitude: parcel.longitude,
      verificationStatus: "PENDING",
      gpsStatus: "GPS_MISSING",
      timestampStatus: "TIMESTAMP_MISSING",
      thresholdMeters: Number(process.env.PHOTO_GPS_TOLERANCE_METERS || 500.0),
      verifiedById: validUserId,
      systemReviewStatus: "PENDING",
      metadataJson: input.base64Data ? ({ photoBase64: input.base64Data } as Prisma.InputJsonValue) : undefined,
    },
    include: {
      farmer: true,
      farm: true,
      parcel: true,
      damageReport: true,
    },
  });

  if (input.base64Data) {
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "verifications");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      let base64Clean = input.base64Data;
      if (base64Clean.startsWith("data:")) {
        base64Clean = base64Clean.split(",")[1] || "";
      }
      const buffer = Buffer.from(base64Clean, "base64");
      fs.writeFileSync(path.join(uploadsDir, `${record.id}.jpg`), buffer);
    } catch (e) {
      console.error("Failed to write verification photo to disk:", e);
    }
  }

  await logAuditEvent({
    userId: validUserId,
    roleSnapshot,
    action: "UPLOAD",
    module: "PHOTO_VERIFICATION",
    recordId: record.id,
    newValues: {
      id: record.id,
      farmerId: record.farmerId,
      parcelId: record.parcelId,
      damageReportId: record.damageReportId,
      fileName: record.originalFileName,
      fileSizeBytes: record.fileSizeBytes,
    },
  });

  return record;
}

/**
 * Extracts EXIF metadata and executes deterministic verification
 */
export async function extractAndVerifyPhoto(
  id: string,
  options?: VerificationOptionsInput & { base64Data?: string | null },
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.photoVerification.findUnique({
    where: { id },
    include: { parcel: true, farmer: true, farm: true },
  });

  if (!existing) {
    throw new Error(`Photo verification record '${id}' not found.`);
  }

  // 1. Metadata extraction
  let extractedLatitude = options?.photoLatitude ?? existing.photoLatitude;
  let extractedLongitude = options?.photoLongitude ?? existing.photoLongitude;
  let extractedAltitude = options?.photoAltitude ?? existing.photoAltitude;
  let extractedTimestamp = options?.photoTimestamp ?? existing.photoTimestamp;
  let deviceMake = options?.deviceMake ?? existing.deviceMake;
  let deviceModel = options?.deviceModel ?? existing.deviceModel;
  let rawMetadataJson: Prisma.InputJsonValue | undefined = existing.metadataJson ? (existing.metadataJson as Prisma.InputJsonValue) : undefined;

  if (options?.base64Data) {
    const exif = await extractExifMetadata(options.base64Data);
    if (exif.hasExif) {
      extractedLatitude = exif.latitude ?? extractedLatitude;
      extractedLongitude = exif.longitude ?? extractedLongitude;
      extractedAltitude = exif.altitude ?? extractedAltitude;
      extractedTimestamp = exif.capturedDate ?? extractedTimestamp;
      deviceMake = exif.deviceMake ?? deviceMake;
      deviceModel = exif.deviceModel ?? deviceModel;
      rawMetadataJson = exif.rawExifData ? (exif.rawExifData as Prisma.InputJsonValue) : undefined;
    }
  }

  const registeredLat = existing.parcel.latitude ?? existing.registeredLatitude;
  const registeredLon = existing.parcel.longitude ?? existing.registeredLongitude;
  const thresholdMeters = options?.thresholdMeters ?? existing.thresholdMeters ?? 500.0;

  // 2. Deterministic Verification
  const evidence = verifyPhotoMetadata({
    photoLatitude: extractedLatitude,
    photoLongitude: extractedLongitude,
    photoAltitude: extractedAltitude,
    photoTimestamp: extractedTimestamp,
    registeredLatitude: registeredLat,
    registeredLongitude: registeredLon,
    thresholdMeters,
  });

  const existingMeta = (existing.metadataJson as Record<string, any>) || {};
  const photoBase64 = options?.base64Data || existingMeta?.photoBase64;

  if (options?.base64Data) {
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "verifications");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      let base64Clean = options.base64Data;
      if (base64Clean.startsWith("data:")) {
        base64Clean = base64Clean.split(",")[1] || "";
      }
      const buffer = Buffer.from(base64Clean, "base64");
      fs.writeFileSync(path.join(uploadsDir, `${id}.jpg`), buffer);
    } catch (e) {
      console.error("Failed to write verification photo to disk in extractAndVerifyPhoto:", e);
    }
  }

  const mergedMetadataJson = {
    ...((rawMetadataJson as Record<string, any>) || {}),
    ...existingMeta,
    ...(photoBase64 ? { photoBase64 } : {}),
  };

  // 3. Persist deterministic verification state
  const updated = await prisma.photoVerification.update({
    where: { id },
    data: {
      photoLatitude: evidence.photoLatitude,
      photoLongitude: evidence.photoLongitude,
      photoAltitude: evidence.photoAltitude,
      photoTimestamp: evidence.timestampAvailable ? extractedTimestamp : null,
      deviceMake,
      deviceModel,
      registeredLatitude: registeredLat,
      registeredLongitude: registeredLon,
      calculatedDistanceMeters: evidence.calculatedDistanceMeters,
      thresholdMeters: evidence.thresholdMeters,
      verificationStatus: evidence.deterministicStatus,
      gpsStatus: evidence.gpsStatus,
      timestampStatus: evidence.timestampStatus,
      failureReasonCode: evidence.failureReasonCode,
      verificationNotes: evidence.verificationNotes,
      metadataJson: mergedMetadataJson as Prisma.InputJsonValue,
    },
    include: {
      farmer: true,
      farm: true,
      parcel: true,
      verifiedBy: { select: { id: true, fullName: true, role: true } },
    },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "VERIFY",
    module: "PHOTO_VERIFICATION",
    recordId: id,
    previousValues: {
      verificationStatus: existing.verificationStatus,
      gpsStatus: existing.gpsStatus,
    },
    newValues: {
      verificationStatus: updated.verificationStatus,
      gpsStatus: updated.gpsStatus,
      calculatedDistanceMeters: updated.calculatedDistanceMeters,
      thresholdMeters: updated.thresholdMeters,
    },
  });

  // 4. Automatically run Gemini AI Advisory Assessment
  try {
    const aiAssessed = await runAiAssessmentForRecord(id, userId, roleSnapshot);
    return aiAssessed;
  } catch (aiErr) {
    console.warn("Automated AI Advisory assessment notice (safe fallback):", aiErr);
    return updated;
  }
}

/**
 * Triggers Gemini AI Advisory Interpretation and Conflict Guarding
 */
export async function runAiAssessmentForRecord(
  id: string,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.photoVerification.findUnique({
    where: { id },
    include: { parcel: true, farmer: true, farm: true },
  });

  if (!existing) {
    throw new Error(`Photo verification record '${id}' not found.`);
  }

  // Build deterministic evidence snapshot
  const evidence = verifyPhotoMetadata({
    photoLatitude: existing.photoLatitude,
    photoLongitude: existing.photoLongitude,
    photoAltitude: existing.photoAltitude,
    photoTimestamp: existing.photoTimestamp,
    registeredLatitude: existing.registeredLatitude,
    registeredLongitude: existing.registeredLongitude,
    thresholdMeters: existing.thresholdMeters,
  });

  // Execute Gemini AI advisory interpretation
  const aiResult = await generateAiAdvisoryAssessment({
    evidence,
    deviceMake: existing.deviceMake,
    deviceModel: existing.deviceModel,
    fileName: existing.originalFileName,
  });

  // Execute Conflict Validation Safeguard
  const conflict = validateAiConflict(
    evidence.deterministicStatus,
    aiResult.recommendation
  );

  // Persist AI interpretation and conflict flags
  const updated = await prisma.photoVerification.update({
    where: { id },
    data: {
      aiAssessment: aiResult.assessment,
      aiRecommendation: aiResult.recommendation,
      aiReviewRequired: aiResult.reviewRequired || conflict.conflictDetected,
      aiExplanation: aiResult.explanation,
      aiAuditNote: aiResult.auditNote,
      aiConfidence: aiResult.confidence || "ADVISORY",
      aiConflict: conflict.conflictDetected,
      aiModelUsed: aiResult.modelUsed,
      aiAssessedAt: aiResult.assessedAt,
      aiRawResponse: aiResult.rawResponse ? (aiResult.rawResponse as Prisma.InputJsonValue) : undefined,
      verificationStatus: conflict.finalSystemStatus,
    },
    include: {
      farmer: true,
      farm: true,
      parcel: true,
      verifiedBy: { select: { id: true, fullName: true, role: true } },
    },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "AI_ASSESS",
    module: "PHOTO_VERIFICATION",
    recordId: id,
    newValues: {
      aiAssessment: aiResult.assessment,
      aiRecommendation: aiResult.recommendation,
      aiConflict: conflict.conflictDetected,
      conflictReason: conflict.conflictReason,
      finalSystemStatus: conflict.finalSystemStatus,
      modelUsed: aiResult.modelUsed,
    },
  });

  return updated;
}

/**
 * Submits municipal system review note and cascades Head decision to linked PcicClaim.
 * 
 * When OMAG_HEAD sets systemReviewStatus to CONFIRMED or REJECTED, the decision
 * is cascaded to the linked PcicClaim.headApprovalStatus (if one exists) so that
 * all downstream eligibility gates (prediction, priority ranking, claim monitoring)
 * are automatically enforced.
 */
export async function submitSystemReview(
  id: string,
  input: SystemReviewInput,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.photoVerification.findUnique({
    where: { id },
    include: {
      damageReport: {
        include: {
          pcicClaim: true,
        },
      },
    },
  });
  if (!existing) {
    throw new Error(`Photo verification record '${id}' not found.`);
  }

  const updated = await prisma.photoVerification.update({
    where: { id },
    data: {
      systemReviewStatus: input.systemReviewStatus,
      systemReviewNotes: input.systemReviewNotes,
      systemReviewedById: userId || null,
      systemReviewedAt: new Date(),
    },
    include: {
      farmer: true,
      farm: true,
      parcel: true,
    },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "REVIEW",
    module: "PHOTO_VERIFICATION",
    recordId: id,
    previousValues: {
      systemReviewStatus: existing.systemReviewStatus,
    },
    newValues: {
      systemReviewStatus: updated.systemReviewStatus,
      systemReviewNotes: updated.systemReviewNotes,
    },
  });

  // =========================================================================
  // CASCADE HEAD DECISION TO LINKED PCIC CLAIM
  // =========================================================================
  // When OMAG_HEAD approves (CONFIRMED) or declines (REJECTED) a photo
  // verification record, cascade the decision to the linked PcicClaim so that
  // downstream eligibility gates (prediction, priority ranking, claim monitoring)
  // are automatically enforced via PcicClaim.headApprovalStatus.
  // =========================================================================
  const linkedClaim = existing.damageReport?.pcicClaim;
  if (linkedClaim && (input.systemReviewStatus === "CONFIRMED" || input.systemReviewStatus === "REJECTED")) {
    const cascadedApprovalStatus =
      input.systemReviewStatus === "CONFIRMED" ? "APPROVED" : "REJECTED";

    const previousClaimStatus = linkedClaim.headApprovalStatus;

    await prisma.pcicClaim.update({
      where: { id: linkedClaim.id },
      data: {
        headApprovalStatus: cascadedApprovalStatus,
        headApprovedById: userId || null,
        headApprovedAt: new Date(),
        headApprovalRemarks: input.systemReviewNotes || null,
      },
    });

    await logAuditEvent({
      userId,
      roleSnapshot,
      action: cascadedApprovalStatus === "APPROVED"
        ? "HEAD_PHOTO_APPROVED"
        : "HEAD_PHOTO_DECLINED",
      module: "PCIC_CLAIM",
      recordId: linkedClaim.id,
      previousValues: {
        headApprovalStatus: previousClaimStatus,
        source: "PHOTO_VERIFICATION_CASCADE",
        photoVerificationId: id,
      },
      newValues: {
        headApprovalStatus: cascadedApprovalStatus,
        headApprovedById: userId,
        headApprovedAt: new Date().toISOString(),
        headApprovalRemarks: input.systemReviewNotes || null,
        claimNumber: linkedClaim.claimNumber,
        source: "PHOTO_VERIFICATION_CASCADE",
        photoVerificationId: id,
      },
    });
  }

  return updated;
}

/**
 * Links or unlinks a PhotoVerification record to/from a Crop-Loss DamageReport.
 * Validates that beneficiary farmer and parcel match authoritatively.
 */
export async function linkPhotoToDamageReport(
  photoId: string,
  damageReportId: number | null,
  userId: string,
  roleSnapshot?: string
) {
  const photo = await prisma.photoVerification.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw new Error(`Photo verification record '${photoId}' not found.`);
  }

  if (damageReportId !== null) {
    const report = await prisma.damageReport.findUnique({
      where: { id: damageReportId },
      include: { pcicClaim: true },
    });

    if (!report) {
      throw new Error(`Damage Report ID ${damageReportId} not found.`);
    }

    if (report.farmerId !== photo.farmerId) {
      throw new Error(`Mismatched beneficiary: Photo farmer (ID ${photo.farmerId}) does not match Report farmer (ID ${report.farmerId}).`);
    }

    if (report.parcelId !== photo.parcelId) {
      throw new Error(`Mismatched parcel: Photo parcel (ID ${photo.parcelId}) does not match Report parcel (ID ${report.parcelId}).`);
    }
  }

  const updated = await prisma.photoVerification.update({
    where: { id: photoId },
    data: { damageReportId },
    include: {
      damageReport: {
        include: { pcicClaim: true },
      },
    },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: damageReportId ? "LINK_CLAIM" : "UNLINK_CLAIM",
    module: "PHOTO_VERIFICATION",
    recordId: photoId,
    previousValues: { damageReportId: photo.damageReportId },
    newValues: { damageReportId },
  });

  return updated;
}

/**
 * Queries paginated and filtered photo verification records
 */
export async function getPhotoVerifications(params: Partial<QueryVerificationInput> = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 15));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.PhotoVerificationWhereInput = {};

  if (params.status && params.status !== "ALL") {
    whereClause.verificationStatus = {
      equals: params.status,
      mode: "insensitive",
    };
  }

  if (params.aiAssessment && params.aiAssessment !== "ALL") {
    whereClause.aiAssessment = {
      equals: params.aiAssessment,
      mode: "insensitive",
    };
  }

  if (params.barangay && params.barangay !== "ALL") {
    whereClause.farm = {
      barangay: {
        equals: params.barangay,
        mode: "insensitive",
      },
    };
  }

  if (params.search && params.search.trim().length > 0) {
    const q = params.search.trim();
    whereClause.OR = [
      { originalFileName: { contains: q, mode: "insensitive" } },
      { farmer: { firstName: { contains: q, mode: "insensitive" } } },
      { farmer: { lastName: { contains: q, mode: "insensitive" } } },
      { farmer: { rsbsaNumber: { contains: q, mode: "insensitive" } } },
      { parcel: { parcelNumber: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, records] = await withDbRetry(() =>
    Promise.all([
      prisma.photoVerification.count({ where: whereClause }),
      prisma.photoVerification.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          farmer: { select: { id: true, firstName: true, lastName: true, rsbsaNumber: true, farmerCode: true } },
          farm: { select: { id: true, farmName: true, barangay: true } },
          parcel: { select: { id: true, parcelNumber: true, latitude: true, longitude: true, areaHa: true } },
          damageReport: {
            include: {
              crop: { select: { cropType: true } },
              pcicClaim: {
                include: {
                  priorityScore: { select: { score: true, priorityLevel: true } },
                },
              },
            },
          },
        },
      }),
    ])
  );

  const items: PhotoVerificationListItem[] = records.map((r) => ({
    id: r.id,
    farmerId: r.farmerId,
    farmerName: `${r.farmer.firstName} ${r.farmer.lastName}`,
    farmerCode: r.farmer.farmerCode,
    rsbsaNumber: r.farmer.rsbsaNumber,
    farmId: r.farmId,
    farmName: r.farm.farmName,
    barangay: r.farm.barangay,
    parcelId: r.parcelId,
    parcelNumber: r.parcel.parcelNumber,
    originalFileName: r.originalFileName,
    storageKey: r.storageKey,
    mimeType: r.mimeType,
    fileSizeBytes: r.fileSizeBytes,
    photoTimestamp: r.photoTimestamp,
    photoLatitude: r.photoLatitude,
    photoLongitude: r.photoLongitude,
    registeredLatitude: r.registeredLatitude,
    registeredLongitude: r.registeredLongitude,
    calculatedDistanceMeters: r.calculatedDistanceMeters,
    thresholdMeters: r.thresholdMeters,
    verificationStatus: r.verificationStatus,
    gpsStatus: r.gpsStatus,
    timestampStatus: r.timestampStatus,
    failureReasonCode: r.failureReasonCode,
    aiAssessment: r.aiAssessment,
    aiRecommendation: r.aiRecommendation,
    aiReviewRequired: r.aiReviewRequired,
    aiConflict: r.aiConflict,
    systemReviewStatus: r.systemReviewStatus,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    damageReportId: r.damageReportId,
    claimId: r.damageReport?.pcicClaim?.id || null,
    claimNumber: r.damageReport?.pcicClaim?.claimNumber || null,
    reportNumber: r.damageReport?.reportNumber || null,
    claimStatus: r.damageReport?.pcicClaim?.claimStatus || r.damageReport?.status || null,
    priorityLevel: r.damageReport?.pcicClaim?.priorityScore?.priorityLevel || null,
    cropType: r.damageReport?.crop?.cropType || null,
    reportedDamagePercent: r.damageReport?.reportedDamagePercent ?? null,
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Deterministic aggregation rule for case-level verification status:
 * Precedence: REJECTED / NOT_ACCEPTED > REVIEW > PENDING > ACCEPTED
 * If 0 photos: PENDING
 */
export function aggregateVerificationStatus(
  photos: { verificationStatus: string }[]
): VerificationStatusType {
  if (!photos || photos.length === 0) {
    return "PENDING";
  }

  const hasRejected = photos.some(
    (p) => p.verificationStatus === "REJECTED" || p.verificationStatus === "NOT_ACCEPTED"
  );
  if (hasRejected) {
    const hasNotAccepted = photos.some((p) => p.verificationStatus === "NOT_ACCEPTED");
    return hasNotAccepted ? "NOT_ACCEPTED" : "REJECTED";
  }

  const hasReview = photos.some((p) => p.verificationStatus === "REVIEW");
  if (hasReview) {
    return "REVIEW";
  }

  const hasPending = photos.some((p) => p.verificationStatus === "PENDING");
  if (hasPending) {
    return "PENDING";
  }

  const allAccepted = photos.every((p) => p.verificationStatus === "ACCEPTED");
  if (allAccepted) {
    return "ACCEPTED";
  }

  return "PENDING";
}

/**
 * Queries paginated and filtered Crop-Loss Cases with their consolidated PhotoVerification records
 */
export async function getCropLossCaseVerifications(params: Partial<QueryVerificationInput> = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 15));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.DamageReportWhereInput = {};

  // For OMAG Head oversight or when explicitly requested:
  // Strictly only show cases that HAVE photos AND do not show NOT_ACCEPTED cases
  if (params.userRole === "OMAG_HEAD" || params.hasPhotos === "true") {
    whereClause.photoVerifications = {
      some: {
        verificationStatus: params.userRole === "OMAG_HEAD" ? { not: "NOT_ACCEPTED" } : undefined,
      },
    };
  }

  if (params.barangay && params.barangay !== "ALL") {
    whereClause.farmer = {
      barangay: { equals: params.barangay, mode: "insensitive" },
    };
  }

  if (params.caseStatus && params.caseStatus !== "ALL") {
    whereClause.OR = [
      { status: { equals: params.caseStatus as any } },
      { pcicClaim: { claimStatus: { equals: params.caseStatus as any } } },
    ];
  }

  if (params.priorityLevel && params.priorityLevel !== "ALL") {
    (whereClause as any).pcicClaim = {
      priorityScore: {
        priorityLevel: { equals: params.priorityLevel as any },
      },
    };
  }

  if (params.search && params.search.trim().length > 0) {
    const q = params.search.trim();
    whereClause.OR = [
      { reportNumber: { contains: q, mode: "insensitive" } },
      { pcicClaim: { claimNumber: { contains: q, mode: "insensitive" } } },
      { farmer: { firstName: { contains: q, mode: "insensitive" } } },
      { farmer: { lastName: { contains: q, mode: "insensitive" } } },
      { farmer: { rsbsaNumber: { contains: q, mode: "insensitive" } } },
      { crop: { cropType: { contains: q, mode: "insensitive" } } },
      { parcel: { parcelNumber: { contains: q, mode: "insensitive" } } },
    ];
  }

  return await withDbRetry(async () => {
    const [total, reports] = await Promise.all([
      prisma.damageReport.count({ where: whereClause }),
      prisma.damageReport.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [
          { incidentDate: "desc" },
          { createdAt: "desc" },
        ],
        include: {
          farmer: true,
          crop: true,
          parcel: {
            include: { farm: true },
          },
          assessment: true,
          pcicClaim: {
            include: { priorityScore: true },
          },
          photoVerifications: {
            orderBy: { createdAt: "desc" },
            include: { verifiedBy: { select: { fullName: true } } },
          },
        },
      }),
    ]);

    const mappedItems: CropLossCaseVerificationListItem[] = reports.map((r) => {
      const photos: CasePhotoSummaryItem[] = r.photoVerifications.map((p: any) => ({
        id: p.id,
        originalFileName: p.originalFileName,
        storageKey: p.storageKey,
        mimeType: p.mimeType,
        fileSizeBytes: p.fileSizeBytes,
        photoTimestamp: p.photoTimestamp ? p.photoTimestamp.toISOString() : null,
        photoLatitude: p.photoLatitude,
        photoLongitude: p.photoLongitude,
        photoAltitude: p.photoAltitude,
        deviceMake: p.deviceMake,
        deviceModel: p.deviceModel,
        registeredLatitude: p.registeredLatitude,
        registeredLongitude: p.registeredLongitude,
        calculatedDistanceMeters: p.calculatedDistanceMeters,
        thresholdMeters: p.thresholdMeters,
        verificationStatus: p.verificationStatus,
        gpsStatus: p.gpsStatus,
        timestampStatus: p.timestampStatus,
        failureReasonCode: p.failureReasonCode,
        verificationNotes: p.verificationNotes,
        aiAssessment: p.aiAssessment,
        aiRecommendation: p.aiRecommendation,
        aiReviewRequired: p.aiReviewRequired,
        aiExplanation: p.aiExplanation,
        aiAuditNote: p.aiAuditNote,
        aiConfidence: p.aiConfidence,
        aiConflict: p.aiConflict,
        aiModelUsed: p.aiModelUsed,
        aiAssessedAt: p.aiAssessedAt ? p.aiAssessedAt.toISOString() : null,
        systemReviewStatus: p.systemReviewStatus,
        systemReviewNotes: p.systemReviewNotes,
        createdAt: p.createdAt.toISOString(),
        verifiedByName: p.verifiedBy?.fullName || null,
      }));

      const consolidatedVerificationStatus = aggregateVerificationStatus(photos);

      return {
        id: r.id,
        reportNumber: r.reportNumber,
        claimId: r.pcicClaim?.id || null,
        claimNumber: r.pcicClaim?.claimNumber || null,
        farmerId: r.farmerId,
        farmerName: `${r.farmer.firstName} ${r.farmer.lastName}`,
        farmerRsbsa: r.farmer.rsbsaNumber,
        farmerCode: r.farmer.farmerCode,
        farmId: r.parcel.farmId,
        farmName: r.parcel.farm?.farmName || null,
        barangay: r.farmer.barangay,
        parcelId: r.parcelId,
        parcelNumber: r.parcel.parcelNumber,
        parcelAreaHa: r.parcel.areaHa,
        parcelLatitude: r.parcel.latitude,
        parcelLongitude: r.parcel.longitude,
        cropId: r.cropId,
        cropType: r.crop.cropType,
        variety: r.crop.variety,
        plantedAreaHa: r.crop.plantedAreaHa,
        incidentDate: r.incidentDate.toISOString(),
        calamityType: r.calamityType,
        reportedDamagePercent: r.reportedDamagePercent,
        assessedDamagePercent: r.assessment?.assessedDamagePercent ?? null,
        reportedAffectedAreaHa: r.reportedAffectedAreaHa,
        narrativeDescription: r.narrativeDescription,
        caseStatus: r.pcicClaim?.claimStatus || r.status,
        dateReported: r.createdAt.toISOString(),
        photoCount: photos.length,
        photos,
        consolidatedVerificationStatus,
        priorityScore: r.pcicClaim?.priorityScore?.score ?? null,
        priorityLevel: r.pcicClaim?.priorityScore?.priorityLevel ?? null,
        rankPosition: r.pcicClaim?.priorityScore?.rankPosition ?? null,
        insurancePolicyNo: r.pcicClaim?.insurancePolicyNo ?? null,
        coordinationRemarks: r.pcicClaim?.remarks ?? null,
      };
    });

    // If verificationStatus filter is applied, filter on the aggregated status
    let filteredItems = params.status && params.status !== "ALL"
      ? mappedItems.filter((i) => i.consolidatedVerificationStatus.toUpperCase() === params.status!.toUpperCase())
      : mappedItems;

    // For OMAG_HEAD oversight, strictly exclude NOT_ACCEPTED records and 0-photo records
    if (params.userRole === "OMAG_HEAD") {
      filteredItems = filteredItems.filter(
        (i) => i.photoCount > 0 && i.consolidatedVerificationStatus !== "NOT_ACCEPTED"
      );
    }

    return {
      items: filteredItems,
      pagination: {
        page,
        limit,
        total: filteredItems.length,
        totalPages: Math.ceil(filteredItems.length / limit) || 1,
      },
    };
  });
}

/**
 * Retrieves full unified case dossier with all linked photos, metadata, priority, and audit logs
 */
export async function getConsolidatedCaseDossier(identifier: string): Promise<ConsolidatedCaseDossierDTO | null> {
  return await withDbRetry(async () => {
    let report: any = null;

    // 1. Try numeric DamageReport ID
    const numId = Number(identifier);
    if (!isNaN(numId) && numId > 0 && !identifier.includes("-")) {
      report = await prisma.damageReport.findUnique({
        where: { id: numId },
        include: {
          farmer: true,
          crop: true,
          parcel: { include: { farm: true } },
          assessment: true,
          pcicClaim: { include: { priorityScore: true } },
          photoVerifications: {
            orderBy: { createdAt: "desc" },
            include: { verifiedBy: { select: { id: true, fullName: true, role: true } } },
          },
        },
      });
    }

    // 2. Try reportNumber if starts with "DR-"
    if (!report && identifier.startsWith("DR-")) {
      report = await prisma.damageReport.findUnique({
        where: { reportNumber: identifier },
        include: {
          farmer: true,
          crop: true,
          parcel: { include: { farm: true } },
          assessment: true,
          pcicClaim: { include: { priorityScore: true } },
          photoVerifications: {
            orderBy: { createdAt: "desc" },
            include: { verifiedBy: { select: { id: true, fullName: true, role: true } } },
          },
        },
      });
    }

    // 3. Try claimNumber if starts with "PCIC-"
    if (!report && identifier.startsWith("PCIC-")) {
      const claim = await prisma.pcicClaim.findUnique({
        where: { claimNumber: identifier },
        select: { reportId: true },
      });
      if (claim?.reportId) {
        return getConsolidatedCaseDossier(String(claim.reportId));
      }
    }

    // 4. Try UUID lookup: Check if it's a PhotoVerification ID
    if (!report && identifier.length >= 30) {
      const photo = await prisma.photoVerification.findUnique({
        where: { id: identifier },
        include: {
          farmer: true,
          farm: true,
          parcel: { include: { crops: true, farm: true } },
          damageReport: {
            include: {
              farmer: true,
              crop: true,
              parcel: { include: { farm: true } },
              assessment: true,
              pcicClaim: { include: { priorityScore: true } },
              photoVerifications: {
                orderBy: { createdAt: "desc" },
                include: { verifiedBy: { select: { id: true, fullName: true, role: true } } },
              },
            },
          },
        },
      });

      if (photo?.damageReport) {
        report = photo.damageReport;
      } else if (photo) {
        // Standalone photo with no attached damage report: construct dossier wrapping this photo
        const auditLogs = await prisma.auditLog.findMany({
          where: { module: "PHOTO_VERIFICATION", recordId: photo.id },
          orderBy: { timestamp: "desc" },
          include: { user: { select: { fullName: true, username: true, role: true } } },
        });

        const photoSummary: CasePhotoSummaryItem = {
          id: photo.id,
          originalFileName: photo.originalFileName,
          storageKey: photo.storageKey,
          mimeType: photo.mimeType,
          fileSizeBytes: photo.fileSizeBytes,
          photoTimestamp: photo.photoTimestamp ? photo.photoTimestamp.toISOString() : null,
          photoLatitude: photo.photoLatitude,
          photoLongitude: photo.photoLongitude,
          photoAltitude: photo.photoAltitude,
          deviceMake: photo.deviceMake,
          deviceModel: photo.deviceModel,
          registeredLatitude: photo.registeredLatitude,
          registeredLongitude: photo.registeredLongitude,
          calculatedDistanceMeters: photo.calculatedDistanceMeters,
          thresholdMeters: photo.thresholdMeters,
          verificationStatus: photo.verificationStatus,
          gpsStatus: photo.gpsStatus,
          timestampStatus: photo.timestampStatus,
          failureReasonCode: photo.failureReasonCode,
          verificationNotes: photo.verificationNotes,
          aiAssessment: photo.aiAssessment,
          aiRecommendation: photo.aiRecommendation,
          aiReviewRequired: photo.aiReviewRequired,
          aiExplanation: photo.aiExplanation,
          aiAuditNote: photo.aiAuditNote,
          aiConfidence: photo.aiConfidence,
          aiConflict: photo.aiConflict,
          aiModelUsed: photo.aiModelUsed,
          aiAssessedAt: photo.aiAssessedAt ? photo.aiAssessedAt.toISOString() : null,
          systemReviewStatus: photo.systemReviewStatus,
          systemReviewNotes: photo.systemReviewNotes,
          createdAt: photo.createdAt.toISOString(),
          verifiedByName: null,
        };

        const primaryCrop = photo.parcel?.crops?.[0];

        return {
          id: 0,
          reportNumber: `STANDALONE-${photo.id.slice(0, 8)}`,
          claimId: null,
          claimNumber: null,
          farmerId: photo.farmerId,
          farmerName: `${photo.farmer.firstName} ${photo.farmer.lastName}`,
          farmerRsbsa: photo.farmer.rsbsaNumber,
          farmerCode: photo.farmer.farmerCode,
          farmId: photo.farmId,
          farmName: photo.farm.farmName,
          barangay: photo.farm.barangay,
          parcelId: photo.parcelId,
          parcelNumber: photo.parcel.parcelNumber,
          parcelAreaHa: photo.parcel.areaHa,
          parcelLatitude: photo.registeredLatitude ?? photo.parcel.latitude,
          parcelLongitude: photo.registeredLongitude ?? photo.parcel.longitude,
          cropId: primaryCrop?.id || 0,
          cropType: primaryCrop?.cropType || "Registered Farmland",
          variety: primaryCrop?.variety || null,
          plantedAreaHa: primaryCrop?.plantedAreaHa || photo.parcel.areaHa,
          incidentDate: photo.photoTimestamp ? photo.photoTimestamp.toISOString() : photo.createdAt.toISOString(),
          calamityType: "Field Verification Audit",
          reportedDamagePercent: 0,
          assessedDamagePercent: null,
          reportedAffectedAreaHa: photo.parcel.areaHa,
          narrativeDescription: photo.verificationNotes,
          caseStatus: photo.systemReviewStatus || "PENDING",
          dateReported: photo.createdAt.toISOString(),
          photoCount: 1,
          photos: [photoSummary],
          consolidatedVerificationStatus: photo.verificationStatus as VerificationStatusType,
          priorityScore: null,
          priorityLevel: null,
          rankPosition: null,
          insurancePolicyNo: null,
          coordinationRemarks: photo.systemReviewNotes,
          assessment: null,
          priorityFormula: null,
          auditLogs: auditLogs.map((l) => ({
            id: l.id,
            action: l.action,
            module: l.module,
            timestamp: l.timestamp.toISOString(),
            roleSnapshot: l.roleSnapshot,
            user: l.user,
            newValues: l.newValues,
            previousValues: l.previousValues,
          })),
        };
      }
    }

    if (!report) return null;

    // Fetch unified audit logs for the case, claim, and all linked photos
    const relatedRecordIds: string[] = [
      String(report.id),
      ...(report.pcicClaim ? [report.pcicClaim.id] : []),
      ...report.photoVerifications.map((p: any) => p.id),
    ];

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        recordId: { in: relatedRecordIds },
      },
      orderBy: { timestamp: "desc" },
      include: {
        user: { select: { fullName: true, username: true, role: true } },
      },
    });

    const photos: CasePhotoSummaryItem[] = report.photoVerifications.map((p: any) => ({
      id: p.id,
      originalFileName: p.originalFileName,
      storageKey: p.storageKey,
      mimeType: p.mimeType,
      fileSizeBytes: p.fileSizeBytes,
      photoTimestamp: p.photoTimestamp ? p.photoTimestamp.toISOString() : null,
      photoLatitude: p.photoLatitude,
      photoLongitude: p.photoLongitude,
      photoAltitude: p.photoAltitude,
      deviceMake: p.deviceMake,
      deviceModel: p.deviceModel,
      registeredLatitude: p.registeredLatitude,
      registeredLongitude: p.registeredLongitude,
      calculatedDistanceMeters: p.calculatedDistanceMeters,
      thresholdMeters: p.thresholdMeters,
      verificationStatus: p.verificationStatus,
      gpsStatus: p.gpsStatus,
      timestampStatus: p.timestampStatus,
      failureReasonCode: p.failureReasonCode,
      verificationNotes: p.verificationNotes,
      aiAssessment: p.aiAssessment,
      aiRecommendation: p.aiRecommendation,
      aiReviewRequired: p.aiReviewRequired,
      aiExplanation: p.aiExplanation,
      aiAuditNote: p.aiAuditNote,
      aiConfidence: p.aiConfidence,
      aiConflict: p.aiConflict,
      aiModelUsed: p.aiModelUsed,
      aiAssessedAt: p.aiAssessedAt ? p.aiAssessedAt.toISOString() : null,
      systemReviewStatus: p.systemReviewStatus,
      systemReviewNotes: p.systemReviewNotes,
      createdAt: p.createdAt.toISOString(),
      verifiedByName: p.verifiedBy?.fullName || null,
    }));

    const consolidatedVerificationStatus = aggregateVerificationStatus(photos);
    const formulaBreakdown = report.pcicClaim?.priorityScore?.formulaBreakdown as any;

    return {
      id: report.id,
      reportNumber: report.reportNumber,
      claimId: report.pcicClaim?.id || null,
      claimNumber: report.pcicClaim?.claimNumber || null,
      farmerId: report.farmerId,
      farmerName: `${report.farmer.firstName} ${report.farmer.lastName}`,
      farmerRsbsa: report.farmer.rsbsaNumber,
      farmerCode: report.farmer.farmerCode,
      farmId: report.parcel.farmId,
      farmName: report.parcel.farm?.farmName || null,
      barangay: report.farmer.barangay,
      parcelId: report.parcelId,
      parcelNumber: report.parcel.parcelNumber,
      parcelAreaHa: report.parcel.areaHa,
      parcelLatitude: report.parcel.latitude,
      parcelLongitude: report.parcel.longitude,
      cropId: report.cropId,
      cropType: report.crop.cropType,
      variety: report.crop.variety,
      plantedAreaHa: report.crop.plantedAreaHa,
      incidentDate: report.incidentDate.toISOString(),
      calamityType: report.calamityType,
      reportedDamagePercent: report.reportedDamagePercent,
      assessedDamagePercent: report.assessment?.assessedDamagePercent ?? null,
      reportedAffectedAreaHa: report.reportedAffectedAreaHa,
      narrativeDescription: report.narrativeDescription,
      caseStatus: report.pcicClaim?.claimStatus || report.status,
      dateReported: report.createdAt.toISOString(),
      photoCount: photos.length,
      photos,
      consolidatedVerificationStatus,
      priorityScore: report.pcicClaim?.priorityScore?.score ?? null,
      priorityLevel: report.pcicClaim?.priorityScore?.priorityLevel ?? null,
      rankPosition: report.pcicClaim?.priorityScore?.rankPosition ?? null,
      insurancePolicyNo: report.pcicClaim?.insurancePolicyNo ?? null,
      coordinationRemarks: report.pcicClaim?.remarks ?? null,
      assessment: report.assessment
        ? {
            id: report.assessment.id,
            assessedDamagePercent: report.assessment.assessedDamagePercent,
            assessedAreaHa: report.assessment.assessedAreaHa,
            cropStage: report.assessment.cropStage,
            assessorNotes: report.assessment.assessorNotes,
            assessedAt: report.assessment.assessedAt.toISOString(),
          }
        : null,
      priorityFormula: formulaBreakdown
        ? {
            damageBasis: formulaBreakdown.damageBasis || (report.assessment ? "ASSESSED" : "REPORTED"),
            applicableDamagePercent: formulaBreakdown.applicableDamagePercent || report.reportedDamagePercent,
            daysElapsed: formulaBreakdown.daysElapsed || 0,
            explanation: formulaBreakdown.explanation || "",
          }
        : null,
      auditLogs: auditLogs.map((l) => ({
        id: l.id,
        action: l.action,
        module: l.module,
        timestamp: l.timestamp.toISOString(),
        roleSnapshot: l.roleSnapshot,
        user: l.user,
        newValues: l.newValues,
        previousValues: l.previousValues,
      })),
    };
  });
}

/**
 * Retrieves a full single PhotoVerification dossier with all relations and audit logs.
 * If identifier is a case id or starts with "DR-", redirects to consolidated case loader.
 */
export async function getPhotoVerificationById(id: string) {
  // If id is numeric or starts with DR- or PCIC-, resolve via getConsolidatedCaseDossier
  const numId = Number(id);
  if ((!isNaN(numId) && numId > 0 && !id.includes("-")) || id.startsWith("DR-") || id.startsWith("PCIC-")) {
    return await getConsolidatedCaseDossier(id);
  }

  return await withDbRetry(async () => {
    const record = await prisma.photoVerification.findUnique({
      where: { id },
      include: {
        farmer: true,
        farm: true,
        parcel: {
          include: {
            crops: { where: { status: { not: "Archived" } } },
          },
        },
        damageReport: {
          include: {
            crop: true,
            assessment: true,
            pcicClaim: { include: { priorityScore: true } },
            photoVerifications: {
              orderBy: { createdAt: "desc" },
              include: { verifiedBy: { select: { id: true, fullName: true, role: true } } },
            },
          },
        },
        verifiedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    if (!record) {
      // Fallback check: could this be a case identifier?
      return await getConsolidatedCaseDossier(id);
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        module: "PHOTO_VERIFICATION",
        recordId: id,
      },
      orderBy: { timestamp: "desc" },
      include: {
        user: { select: { id: true, fullName: true, role: true } },
      },
    });

    return {
      ...record,
      auditLogs,
    };
  });
}
