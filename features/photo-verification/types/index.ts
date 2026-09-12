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
}
