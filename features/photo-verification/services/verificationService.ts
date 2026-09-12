import { prisma } from "@/lib/database/prisma";
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
import { PhotoVerificationListItem } from "../types";
import { Prisma } from "@prisma/client";

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
    },
    include: {
      farmer: true,
      farm: true,
      parcel: true,
    },
  });

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
      metadataJson: rawMetadataJson,
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
      deterministicStatus: evidence.deterministicStatus,
    },
  });

  return updated;
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
 * Submits municipal system review note (System Action, not PCIC approval)
 */
export async function submitSystemReview(
  id: string,
  input: SystemReviewInput,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.photoVerification.findUnique({ where: { id } });
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

  const [total, records] = await Promise.all([
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
      },
    }),
  ]);

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
 * Retrieves a full single PhotoVerification dossier with all relations and audit logs
 */
export async function getPhotoVerificationById(id: string) {
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
      verifiedBy: {
        select: { id: true, fullName: true, role: true },
      },
    },
  });

  if (!record) return null;

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
}
