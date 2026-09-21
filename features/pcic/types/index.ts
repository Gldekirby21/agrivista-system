/**
 * Phase 8 — Objective 6: PCIC Crop-Loss Claim Monitoring & Prioritization Types
 * 
 * Truth Classifications:
 * 🟢 OMAG Confirmed:
 *   - Farmers report crop loss to PCIC focal person.
 *   - Priority factors: Higher damage severity and earlier report date.
 *   - Role boundaries: OMAG_STAFF operational, OMAG_HEAD read-only oversight.
 * 🔵 Official External Reference:
 *   - Standard PCIC claim docket concepts, standard damage percentage scale (0–100%).
 * 🟡 Proposed System Design:
 *   - Deterministic 70/30 weighting between severity and date factor.
 *   - PriorityLevel categorization thresholds (HIGH >= 70, MEDIUM 40–69.9, LOW < 40).
 *   - Using assessed damage over reported damage when assessment exists.
 * 🔴 Pending OMAG Confirmation:
 *   - Whether reported and assessed damage must be treated as separate official values.
 *   - Exact numerical weights and priority thresholds.
 * ⚫ Synthetic Demonstration Data:
 *   - Demonstration cases generated for validation and training.
 */

import { ClaimStatus, PriorityLevel } from "@prisma/client";

export { ClaimStatus, PriorityLevel };

export const CALAMITY_TYPES = [
  "Typhoon",
  "Flood",
  "Drought",
  "Pest Infestation",
  "Disease Outbreak",
  "Landslide",
  "Heavy Rain / Flashflood",
  "Other",
] as const;

export type CalamityType = (typeof CALAMITY_TYPES)[number];

export const CROP_STAGES = [
  "Vegetative",
  "Reproductive",
  "Maturity / Harvesting",
  "Seedling",
  "Flowering",
  "Grain Filling",
  "Other",
] as const;

export type CropStage = (typeof CROP_STAGES)[number];

export interface FormulaBreakdown {
  damageBasis: "REPORTED" | "ASSESSED";
  applicableDamagePercent: number;
  reportedDamagePercent: number;
  assessedDamagePercent?: number | null;
  severityScore: number;
  severityWeight: number;
  incidentDate: string;
  daysElapsed: number;
  datePriorityScore: number;
  dateWeight: number;
  compositeScore: number;
  algorithmVersion: string;
  explanation: string;
  classificationNotice: string;
}

export interface ClaimPriorityScoreDTO {
  id: string;
  claimId: string;
  score: number;
  priorityLevel: PriorityLevel;
  rankPosition: number | null;
  formulaBreakdown: FormulaBreakdown;
  calculatedAt: string;
}

export interface DamageAssessmentDTO {
  id: string;
  reportId: number;
  assessedDamagePercent: number;
  assessedAreaHa: number;
  cropStage: string;
  assessorNotes?: string | null;
  assessedAt: string;
}

export interface DamagePhotoDTO {
  id: string;
  reportId: number;
  storageKey: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
}

export interface DamageReportDTO {
  id: number;
  reportNumber: string;
  farmerId: number;
  parcelId: number;
  cropId: number;
  incidentDate: string;
  calamityType: string;
  reportedDamagePercent: number;
  reportedAffectedAreaHa: number;
  narrativeDescription?: string | null;
  status: ClaimStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assessment?: DamageAssessmentDTO | null;
  photos?: DamagePhotoDTO[];
  farmer?: {
    id: number;
    firstName: string;
    lastName: string;
    rsbsaNumber?: string | null;
    barangay: string;
    contactNumber?: string | null;
  };
  crop?: {
    id: number;
    cropType: string;
    variety?: string | null;
    plantedAreaHa: number;
    plantingDate: string;
  };
  parcel?: {
    id: number;
    parcelNumber: string;
    areaHa: number;
    farm?: {
      id: number;
      barangay: string;
      farmName?: string | null;
    };
  };
}

export interface PcicClaimDTO {
  id: string;
  claimNumber: string;
  reportId: number;
  claimStatus: ClaimStatus;
  insurancePolicyNo?: string | null;
  filingDate: string;
  remarks?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  report: DamageReportDTO;
  priorityScore?: ClaimPriorityScoreDTO | null;
}

export interface PcicClaimListItemDTO {
  id: string;
  claimNumber: string;
  claimStatus: ClaimStatus;
  insurancePolicyNo?: string | null;
  filingDate: string;
  remarks?: string | null;
  reportId: number;
  reportNumber: string;
  farmerId?: number;
  farmerName: string;
  farmerRsbsa?: string | null;
  barangay: string;
  cropType: string;
  calamityType: string;
  incidentDate: string;
  reportedDamagePercent: number;
  assessedDamagePercent?: number | null;
  applicableDamagePercent: number;
  damageBasis: "REPORTED" | "ASSESSED";
  reportedAffectedAreaHa: number;
  parcelNumber?: string | null;
  cropStage?: string | null;
  priorityScore?: number | null;
  priorityLevel?: PriorityLevel | null;
  rankPosition?: number | null;
  priorityExplanation?: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
