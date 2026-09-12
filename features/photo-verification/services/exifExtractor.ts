import exifr from "exifr";
import { ExtractedExifData } from "../types";

/**
 * Extracts EXIF metadata from an image buffer, base64 string, or ArrayBuffer.
 * Handles missing GPS, missing timestamps, corrupted data, and non-image payloads safely.
 */
export async function extractExifMetadata(
  input: Buffer | ArrayBuffer | Uint8Array | string
): Promise<ExtractedExifData> {
  const fallbackResult: ExtractedExifData = {
    hasExif: false,
    latitude: null,
    longitude: null,
    altitude: null,
    capturedDate: null,
    deviceMake: null,
    deviceModel: null,
    imageWidth: null,
    imageHeight: null,
    rawExifData: null,
  };

  try {
    let buffer: Buffer | ArrayBuffer | Uint8Array;

    if (typeof input === "string") {
      // If it's a data URL (e.g. data:image/jpeg;base64,...), strip prefix
      const base64Clean = input.includes(",") ? input.split(",")[1] : input;
      buffer = Buffer.from(base64Clean, "base64");
    } else {
      buffer = input;
    }

    // Attempt EXIF extraction using exifr
    const parsed = await exifr.parse(buffer, {
      gps: true,
      tiff: true,
      exif: true,
      xmp: true,
      mergeOutput: true,
    });

    if (!parsed || Object.keys(parsed).length === 0) {
      return fallbackResult;
    }

    // Extract latitude and longitude
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (typeof parsed.latitude === "number" && !isNaN(parsed.latitude)) {
      latitude = Number(parsed.latitude.toFixed(6));
    }
    if (typeof parsed.longitude === "number" && !isNaN(parsed.longitude)) {
      longitude = Number(parsed.longitude.toFixed(6));
    }

    // Fallback: Check GPSLatitude & GPSLongitude if direct latitude/longitude was not populated
    if (latitude === null && Array.isArray(parsed.GPSLatitude)) {
      const [d, m, s] = parsed.GPSLatitude;
      const ref = parsed.GPSLatitudeRef || "N";
      let latVal = d + m / 60 + s / 3600;
      if (ref === "S") latVal = -latVal;
      latitude = Number(latVal.toFixed(6));
    }
    if (longitude === null && Array.isArray(parsed.GPSLongitude)) {
      const [d, m, s] = parsed.GPSLongitude;
      const ref = parsed.GPSLongitudeRef || "E";
      let lonVal = d + m / 60 + s / 3600;
      if (ref === "W") lonVal = -lonVal;
      longitude = Number(lonVal.toFixed(6));
    }

    // Extract timestamp
    let capturedDate: Date | null = null;
    const rawDate = parsed.DateTimeOriginal || parsed.CreateDate || parsed.ModifyDate;
    if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      capturedDate = rawDate;
    } else if (typeof rawDate === "string") {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        capturedDate = parsedDate;
      }
    }

    // Device metadata
    const deviceMake = parsed.Make ? String(parsed.Make).trim() : null;
    const deviceModel = parsed.Model ? String(parsed.Model).trim() : null;
    const altitude = typeof parsed.GPSAltitude === "number" ? Number(parsed.GPSAltitude.toFixed(1)) : null;
    const imageWidth = typeof parsed.ImageWidth === "number" ? parsed.ImageWidth : (parsed.ExifImageWidth || null);
    const imageHeight = typeof parsed.ImageHeight === "number" ? parsed.ImageHeight : (parsed.ExifImageHeight || null);

    // Filter safe metadata subset for persistence
    const safeSubset: Record<string, unknown> = {
      Make: deviceMake,
      Model: deviceModel,
      Software: parsed.Software ? String(parsed.Software) : null,
      Orientation: parsed.Orientation || null,
      ImageWidth: imageWidth,
      ImageHeight: imageHeight,
      ISO: parsed.ISO || null,
      FNumber: parsed.FNumber || null,
      ExposureTime: parsed.ExposureTime || null,
      FocalLength: parsed.FocalLength || null,
      GPSAltitude: altitude,
      GPSProcessingMethod: parsed.GPSProcessingMethod || null,
    };

    const hasExif = latitude !== null || longitude !== null || capturedDate !== null || deviceMake !== null;

    return {
      hasExif,
      latitude,
      longitude,
      altitude,
      capturedDate,
      deviceMake,
      deviceModel,
      imageWidth,
      imageHeight,
      rawExifData: safeSubset,
    };
  } catch (error) {
    console.warn("EXIF extraction notice (handled gracefully):", error);
    return fallbackResult;
  }
}
