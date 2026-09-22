import { DeterministicEvidence, GpsStatusType, TimestampStatusType, VerificationStatusType } from "../types";

/**
 * Standard Haversine formula to compute great-circle distance between two GPS coordinates in meters.
 * Strictly deterministic, zero AI involvement.
 * 
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_METERS = 6371000; // Mean radius of Earth in meters

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_METERS * c;
  return Number(distance.toFixed(2));
}

export interface VerificationInputParams {
  photoLatitude?: number | null;
  photoLongitude?: number | null;
  photoAltitude?: number | null;
  photoTimestamp?: Date | null;
  registeredLatitude?: number | null;
  registeredLongitude?: number | null;
  thresholdMeters?: number;
}

/**
 * Authoritative Deterministic Verification Engine
 * 
 * Evaluates raw extracted metadata against registered parcel benchmarks.
 * Computes exact mathematical distance and evaluates criteria deterministically.
 */
export function verifyPhotoMetadata(
  params: VerificationInputParams
): DeterministicEvidence {
  const thresholdMeters =
    params.thresholdMeters && params.thresholdMeters > 0
      ? params.thresholdMeters
      : Number(process.env.PHOTO_GPS_TOLERANCE_METERS || 500.0);

  const photoLat = params.photoLatitude ?? null;
  const photoLon = params.photoLongitude ?? null;
  const parcelLat = params.registeredLatitude ?? null;
  const parcelLon = params.registeredLongitude ?? null;
  const timestamp = params.photoTimestamp ?? null;

  const gpsAvailable =
    photoLat !== null &&
    photoLon !== null &&
    !isNaN(photoLat) &&
    !isNaN(photoLon);

  const parcelCoordinatesAvailable =
    parcelLat !== null &&
    parcelLon !== null &&
    !isNaN(parcelLat) &&
    !isNaN(parcelLon);

  const timestampAvailable = timestamp !== null && timestamp instanceof Date && !isNaN(timestamp.getTime());

  // Check 1: Missing Photo GPS
  // GPS Location Embedded is OPTIONAL per OMAG Polomolok verification rules.
  // Missing GPS alone must NOT produce NOT_ACCEPTED — the record moves to REVIEW
  // since the Great-Circle Geofence (a REQUIRED check) cannot be computed without GPS,
  // but the record is not definitively rejected.
  if (!gpsAvailable) {
    const timestampStatus: TimestampStatusType = timestampAvailable ? "VALID" : "TIMESTAMP_MISSING";
    return {
      gpsAvailable: false,
      timestampAvailable,
      parcelCoordinatesAvailable,
      photoLatitude: null,
      photoLongitude: null,
      photoAltitude: params.photoAltitude ?? null,
      registeredLatitude: parcelLat,
      registeredLongitude: parcelLon,
      calculatedDistanceMeters: null,
      thresholdMeters,
      gpsStatus: "GPS_MISSING",
      timestampStatus,
      deterministicStatus: "REVIEW",
      failureReasonCode: "WARN_PHOTO_GPS_MISSING",
      verificationNotes:
        "GPS metadata unavailable. Great-Circle Geofence cannot be computed. Ground verification may be required.",
    };
  }

  // Check 2: Invalid Photo GPS Coordinate Range
  if (photoLat! < -90 || photoLat! > 90 || photoLon! < -180 || photoLon! > 180) {
    return {
      gpsAvailable: false,
      timestampAvailable,
      parcelCoordinatesAvailable,
      photoLatitude: photoLat,
      photoLongitude: photoLon,
      photoAltitude: params.photoAltitude ?? null,
      registeredLatitude: parcelLat,
      registeredLongitude: parcelLon,
      calculatedDistanceMeters: null,
      thresholdMeters,
      gpsStatus: "INVALID_COORDINATES",
      timestampStatus: timestampAvailable ? "VALID" : "TIMESTAMP_MISSING",
      deterministicStatus: "NOT_ACCEPTED",
      failureReasonCode: "ERR_INVALID_COORDINATES",
      verificationNotes: `Photo GPS coordinates (${photoLat}, ${photoLon}) are outside valid geographical bounds.`,
    };
  }

  // Check 3: Missing Registered Parcel Centroid GPS
  if (!parcelCoordinatesAvailable) {
    return {
      gpsAvailable: true,
      timestampAvailable,
      parcelCoordinatesAvailable: false,
      photoLatitude: photoLat,
      photoLongitude: photoLon,
      photoAltitude: params.photoAltitude ?? null,
      registeredLatitude: null,
      registeredLongitude: null,
      calculatedDistanceMeters: null,
      thresholdMeters,
      gpsStatus: "PARCEL_GPS_MISSING",
      timestampStatus: timestampAvailable ? "VALID" : "TIMESTAMP_MISSING",
      deterministicStatus: "NOT_ACCEPTED",
      failureReasonCode: "ERR_PARCEL_GPS_MISSING",
      verificationNotes:
        "Target farm parcel has no registered reference GPS coordinates in the database.",
    };
  }

  // Check 4: Calculate exact deterministic Haversine distance
  const calculatedDistanceMeters = calculateHaversineDistance(
    photoLat!,
    photoLon!,
    parcelLat!,
    parcelLon!
  );

  const withinThreshold = calculatedDistanceMeters <= thresholdMeters;
  const gpsStatus: GpsStatusType = withinThreshold ? "MATCH" : "OUTSIDE_THRESHOLD";

  // Check 5: Timestamp verification
  let timestampStatus: TimestampStatusType = "VALID";
  let isQuestionableTimestamp = false;
  let timestampQuestionableReason = "";

  if (!timestampAvailable) {
    timestampStatus = "TIMESTAMP_MISSING";
  } else {
    const timeMs = timestamp!.getTime();
    const nowMs = Date.now();
    const futureToleranceMs = 24 * 60 * 60 * 1000; // 24 hours future tolerance for time zone skew
    const minAcceptableYear = 2000;

    if (timeMs > nowMs + futureToleranceMs) {
      timestampStatus = "OUT_OF_RANGE";
      isQuestionableTimestamp = true;
      timestampQuestionableReason = `Photo timestamp (${timestamp!.toISOString()}) is set in the future. System clock anomaly or metadata inconsistency detected.`;
    } else if (timestamp!.getFullYear() < minAcceptableYear) {
      timestampStatus = "OUT_OF_RANGE";
      isQuestionableTimestamp = true;
      timestampQuestionableReason = `Photo timestamp (${timestamp!.toISOString()}) pre-dates year ${minAcceptableYear}. Unreliable hardware clock or corrupted metadata detected.`;
    }
  }

  // Determine final deterministic status
  let deterministicStatus: VerificationStatusType = "ACCEPTED";
  let failureReasonCode: string | null = null;
  let verificationNotes = "";

  if (!withinThreshold) {
    deterministicStatus = "REJECTED";
    failureReasonCode = "ERR_GPS_OUTSIDE_TOLERANCE";
    verificationNotes = `Photo GPS coordinates (${photoLat!.toFixed(6)}, ${photoLon!.toFixed(6)}) are ${calculatedDistanceMeters.toFixed(1)}m from registered parcel centroid (${parcelLat!.toFixed(6)}, ${parcelLon!.toFixed(6)}), exceeding configured system threshold of ${thresholdMeters}m.`;
  } else if (!timestampAvailable) {
    deterministicStatus = "REVIEW";
    failureReasonCode = "WARN_TIMESTAMP_MISSING";
    verificationNotes = `Photo GPS matches registered parcel centroid (${calculatedDistanceMeters.toFixed(1)}m <= ${thresholdMeters}m), but timestamp is missing from EXIF metadata. Manual verification required.`;
  } else if (isQuestionableTimestamp) {
    deterministicStatus = "REVIEW";
    failureReasonCode = "WARN_TIMESTAMP_INCONSISTENT";
    verificationNotes = `Photo GPS matches registered parcel centroid (${calculatedDistanceMeters.toFixed(1)}m <= ${thresholdMeters}m), but ${timestampQuestionableReason} Manual verification required.`;
  } else {
    deterministicStatus = "ACCEPTED";
    failureReasonCode = null;
    verificationNotes = `Photo GPS location is within the configured system tolerance (${calculatedDistanceMeters.toFixed(1)}m <= ${thresholdMeters}m). Timestamp is present and recorded (${timestamp!.toISOString()}).`;
  }

  return {
    gpsAvailable: true,
    timestampAvailable,
    parcelCoordinatesAvailable: true,
    photoLatitude: photoLat,
    photoLongitude: photoLon,
    photoAltitude: params.photoAltitude ?? null,
    registeredLatitude: parcelLat,
    registeredLongitude: parcelLon,
    calculatedDistanceMeters,
    thresholdMeters,
    gpsStatus,
    timestampStatus,
    deterministicStatus,
    failureReasonCode,
    verificationNotes,
  };
}
