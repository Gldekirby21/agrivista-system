import { z } from "zod";

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const PhotoUploadSchema = z.object({
  farmerId: z.coerce.number().int().positive("Beneficiary reference is required"),
  farmId: z.coerce.number().int().positive("Farm reference is required"),
  parcelId: z.coerce.number().int().positive("Farm parcel reference is required"),
  damageReportId: z.coerce.number().int().positive("Crop-loss case reference must be valid").optional().nullable(),
  originalFileName: z.string().trim().min(1, "File name is required"),
  fileSizeBytes: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(15 * 1024 * 1024, "File size exceeds municipal limit of 15MB")
    .default(0),
  mimeType: z
    .string()
    .trim()
    .refine(
      (val) =>
        ALLOWED_PHOTO_MIME_TYPES.includes(val.toLowerCase() as any) ||
        val.toLowerCase().startsWith("image/"),
      "Only valid image file formats (JPEG, PNG, WebP, HEIC) are accepted"
    )
    .default("image/jpeg"),
  storageKey: z.string().trim().optional(),
  base64Data: z.string().trim().optional(),
  remarks: z.string().trim().max(500).optional().nullable(),
});

export type PhotoUploadInput = z.infer<typeof PhotoUploadSchema>;

export const VerificationOptionsSchema = z.object({
  thresholdMeters: z.coerce
    .number()
    .positive("GPS threshold must be greater than 0 meters")
    .max(50000, "Threshold exceeds allowable bounds")
    .optional()
    .default(500.0),
  photoTimestamp: z.coerce.date().optional().nullable(),
  photoLatitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  photoLongitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  photoAltitude: z.coerce.number().optional().nullable(),
  deviceMake: z.string().trim().max(100).optional().nullable(),
  deviceModel: z.string().trim().max(100).optional().nullable(),
});

export type VerificationOptionsInput = z.infer<typeof VerificationOptionsSchema>;

export const GeminiOutputSchema = z.object({
  assessment: z.enum(["CONSISTENT", "INCONSISTENT", "INSUFFICIENT_EVIDENCE"]),
  recommendation: z.enum(["ACCEPT", "REVIEW", "REJECT"]),
  reviewRequired: z.boolean(),
  explanation: z.string().trim().min(1, "Explanation is required"),
  auditNote: z.string().trim().min(1, "Audit note is required"),
  confidence: z.string().trim().optional().nullable(),
});

export type GeminiOutput = z.infer<typeof GeminiOutputSchema>;

export const SystemReviewSchema = z.object({
  systemReviewStatus: z.enum(["PENDING", "REVIEWED", "CONFIRMED", "REJECTED"]),
  systemReviewNotes: z.string().trim().min(1, "Review notes are required").max(1000),
});

export type SystemReviewInput = z.infer<typeof SystemReviewSchema>;

export const QueryVerificationSchema = z.object({
  search: z.string().trim().optional(),
  barangay: z.string().trim().optional(),
  status: z.string().trim().optional(),
  caseStatus: z.string().trim().optional(),
  priorityLevel: z.string().trim().optional(),
  aiAssessment: z.string().trim().optional(),
  mode: z.enum(["cases", "photos"]).optional().default("cases"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(15),
});

export type QueryVerificationInput = z.infer<typeof QueryVerificationSchema>;
