/**
 * Phase 8 — Objective 6: PCIC Claim Monitoring Validation Schemas
 */

import { z } from "zod";
import { ClaimStatus, PriorityLevel } from "@prisma/client";

export const CreatePcicClaimSchema = z.object({
  farmerId: z.coerce.number().int().positive("Farmer ID is required"),
  parcelId: z.coerce.number().int().positive("Farm Parcel ID is required"),
  cropId: z.coerce.number().int().positive("Crop ID is required"),
  incidentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Valid incident date is required",
  }),
  calamityType: z.string().min(1, "Calamity type is required").max(100),
  reportedDamagePercent: z.coerce
    .number()
    .min(0, "Damage percentage cannot be negative")
    .max(100, "Damage percentage cannot exceed 100%"),
  reportedAffectedAreaHa: z.coerce
    .number()
    .positive("Reported affected area must be greater than 0 ha"),
  narrativeDescription: z.string().max(1000).optional(),
  insurancePolicyNo: z.string().max(100).optional(),
  remarks: z.string().max(1000).optional(),
  claimStatus: z.nativeEnum(ClaimStatus).optional().default(ClaimStatus.SUBMITTED),
  photoVerificationId: z.string().uuid().optional().nullable(),
});

export type CreatePcicClaimInput = z.infer<typeof CreatePcicClaimSchema>;

export const UpdatePcicClaimSchema = z.object({
  incidentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Valid incident date is required",
  }).optional(),
  calamityType: z.string().min(1).max(100).optional(),
  reportedDamagePercent: z.coerce
    .number()
    .min(0, "Damage percentage cannot be negative")
    .max(100, "Damage percentage cannot exceed 100%")
    .optional(),
  reportedAffectedAreaHa: z.coerce
    .number()
    .positive("Reported affected area must be greater than 0 ha")
    .optional(),
  narrativeDescription: z.string().max(1000).optional(),
  insurancePolicyNo: z.string().max(100).optional(),
  remarks: z.string().max(1000).optional(),
  // Optional Assessed Damage (Field Assessment)
  assessedDamagePercent: z.coerce
    .number()
    .min(0, "Assessed damage percentage cannot be negative")
    .max(100, "Assessed damage percentage cannot exceed 100%")
    .nullable()
    .optional(),
  assessedAreaHa: z.coerce
    .number()
    .positive("Assessed area must be greater than 0 ha")
    .nullable()
    .optional(),
  cropStage: z.string().max(100).nullable().optional(),
  assessorNotes: z.string().max(1000).nullable().optional(),
});

export type UpdatePcicClaimInput = z.infer<typeof UpdatePcicClaimSchema>;

export const UpdateClaimStatusSchema = z.object({
  claimStatus: z.nativeEnum(ClaimStatus, {
    message: "Invalid claim status",
  }),
  remarks: z.string().max(1000).optional(),
});

export type UpdateClaimStatusInput = z.infer<typeof UpdateClaimStatusSchema>;

export const UpdateCoordinationSchema = z.object({
  remarks: z.string().min(1, "Coordination notes cannot be empty").max(2000),
  reviewedBy: z.string().max(100).optional(),
});

export type UpdateCoordinationInput = z.infer<typeof UpdateCoordinationSchema>;

export const ClaimQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  claimStatus: z.nativeEnum(ClaimStatus).optional(),
  priorityLevel: z.nativeEnum(PriorityLevel).optional(),
  calamityType: z.string().optional(),
  barangay: z.string().optional(),
  farmerId: z.coerce.number().int().positive().optional(),
  parcelId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});

export type ClaimQueryParams = z.infer<typeof ClaimQuerySchema>;
