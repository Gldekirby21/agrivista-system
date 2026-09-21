// ==============================================================================
// OMAG Polomolok Agricultural Resource Distribution and Production Analytics System
// Objective 2 Domain Types: Deterministic Photo & GPS Metadata Verification
// ==============================================================================

export type VerificationStatusType =
  | "ACCEPTED"
  | "REVIEW"
  | "REJECTED"
  | "NOT_ACCEPTED"
  | "PENDING";

export type GpsStatusType =
  | "MATCH"
  | "OUTSIDE_THRESHOLD"
  | "GPS_MISSING"
  | "PARCEL_GPS_MISSING"
  | "INVALID_COORDINATES";

export type TimestampStatusType =
  | "VALID"
  | "TIMESTAMP_MISSING"
  | "OUT_OF_RANGE";

export type AiAssessmentType =
  | "CONSISTENT"
  | "INCONSISTENT"
  | "INSUFFICIENT_EVIDENCE";

export type AiRecommendationType =
  | "ACCEPT"
  | "REVIEW"
  | "REJECT";

export interface ExtractedExifData {
  hasExif: boolean;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  capturedDate: Date | null;
  deviceMake: string | null;
  deviceModel: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  rawExifData?: Record<string, unknown> | null;
}

export interface DeterministicEvidence {
  gpsAvailable: boolean;
  timestampAvailable: boolean;
  parcelCoordinatesAvailable: boolean;
  photoLatitude: number | null;
  photoLongitude: number | null;
  photoAltitude: number | null;
  registeredLatitude: number | null;
  registeredLongitude: number | null;
  calculatedDistanceMeters: number | null;
  thresholdMeters: number;
  gpsStatus: GpsStatusType;
  timestampStatus: TimestampStatusType;
  deterministicStatus: VerificationStatusType;
  failureReasonCode: string | null;
  verificationNotes: string;
}

export interface AiAssessmentResult {
  assessment: AiAssessmentType;
  recommendation: AiRecommendationType;
  reviewRequired: boolean;
  explanation: string;
  auditNote: string;
  confidence?: string | null;
  modelUsed: string;
  assessedAt: Date;
  rawResponse?: Record<string, unknown> | null;
  conflictDetected: boolean;
  finalSystemStatus: VerificationStatusType;
}

export interface PhotoVerificationListItem {
  id: string;
  farmerId: number;
  farmerName: string;
  farmerCode: string | null;
  rsbsaNumber: string | null;
  farmId: number;
  farmName: string | null;
  barangay: string;
  parcelId: number;
  parcelNumber: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  photoTimestamp: Date | null;
  photoLatitude: number | null;
  photoLongitude: number | null;
  registeredLatitude: number | null;
  registeredLongitude: number | null;
  calculatedDistanceMeters: number | null;
  thresholdMeters: number;
  verificationStatus: string;
  gpsStatus: string;
  timestampStatus: string;
  failureReasonCode: string | null;
  aiAssessment: string | null;
  aiRecommendation: string | null;
  aiReviewRequired: boolean;
  aiConflict: boolean;
  systemReviewStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
  damageReportId?: number | null;
  claimId?: string | null;
  claimNumber?: string | null;
  reportNumber?: string | null;
  claimStatus?: string | null;
  priorityLevel?: string | null;
  cropType?: string | null;
  reportedDamagePercent?: number | null;
}

export interface CasePhotoSummaryItem {
  id: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  photoTimestamp: string | null;
  photoLatitude: number | null;
  photoLongitude: number | null;
  photoAltitude: number | null;
  deviceMake: string | null;
  deviceModel: string | null;
  registeredLatitude: number | null;
  registeredLongitude: number | null;
  calculatedDistanceMeters: number | null;
  thresholdMeters: number;
  verificationStatus: string;
  gpsStatus: string;
  timestampStatus: string;
  failureReasonCode: string | null;
  verificationNotes: string | null;
  aiAssessment: string | null;
  aiRecommendation: string | null;
  aiReviewRequired: boolean;
  aiExplanation: string | null;
  aiAuditNote: string | null;
  aiConfidence: string | null;
  aiConflict: boolean;
  aiModelUsed: string | null;
  aiAssessedAt: string | null;
  systemReviewStatus: string | null;
  systemReviewNotes: string | null;
  createdAt: string;
  verifiedByName: string | null;
}

export interface CropLossCaseVerificationListItem {
  id: number | string; // DamageReport ID or PhotoVerification UUID
  reportNumber: string;
  claimId: string | null;
  claimNumber: string | null;
  farmerId: number;
  farmerName: string;
  farmerRsbsa: string | null;
  farmerCode: string | null;
  farmId: number;
  farmName: string | null;
  barangay: string;
  parcelId: number;
  parcelNumber: string;
  parcelAreaHa: number;
  parcelLatitude: number | null;
  parcelLongitude: number | null;
  cropId: number;
  cropType: string;
  variety: string | null;
  plantedAreaHa: number;
  incidentDate: string;
  calamityType: string;
  reportedDamagePercent: number;
  assessedDamagePercent: number | null;
  reportedAffectedAreaHa: number;
  narrativeDescription: string | null;
  caseStatus: string;
  dateReported: string;
  photoCount: number;
  photos: CasePhotoSummaryItem[];
  consolidatedVerificationStatus: VerificationStatusType;
  priorityScore: number | null;
  priorityLevel: string | null;
  rankPosition: number | null;
  insurancePolicyNo: string | null;
  coordinationRemarks: string | null;
}

export interface ConsolidatedCaseDossierDTO extends CropLossCaseVerificationListItem {
  assessment: {
    id: string;
    assessedDamagePercent: number;
    assessedAreaHa: number;
    cropStage: string;
    assessorNotes: string | null;
    assessedAt: string;
  } | null;
  priorityFormula: {
    damageBasis: string;
    applicableDamagePercent: number;
    daysElapsed: number;
    explanation: string;
  } | null;
  auditLogs: {
    id: string;
    action: string;
    module: string;
    timestamp: string;
    roleSnapshot: string | null;
    user?: {
      fullName: string;
      username: string;
      role: string;
    } | null;
    newValues?: any;
    previousValues?: any;
  }[];
}
