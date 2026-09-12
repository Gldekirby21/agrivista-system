import { z } from "zod";

/**
 * Validates Farmer Registration Input (Objective 1)
 *
 * OMAG-Confirmed Fields:
 * - Farmer/Registration ID (rsbsaNumber)
 * - Name (firstName, lastName; middleName & extensionName optional)
 * - Address & Barangay
 * - Contact Information (contactNumber)
 * - Farmer sector/category (farmerCode)
 *
 * Proposed System Design (Optional / Technical usability):
 * - Sex (optional, defaults to "Unspecified" to satisfy DB constraint)
 * - Date of Birth (optional, defaults to placeholder date to satisfy DB constraint)
 * - Email, Civil Status (optional)
 * - Senior Citizen, PWD, 4Ps, IP flags (optional statutory demographic indicators)
 */
export const FarmerCreateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  middleName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  extensionName: z.string().trim().max(20).optional().nullable(),
  rsbsaNumber: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  farmerCode: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  sex: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val && val !== "" ? val : "Unspecified")),
  dateOfBirth: z.coerce
    .date()
    .optional()
    .nullable()
    .transform((val) => val ?? new Date("1970-01-01")),
  contactNumber: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  email: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  barangay: z.string().trim().min(1, "Barangay is required"),
  municipality: z.string().trim().default("Polomolok"),
  province: z.string().trim().default("South Cotabato"),
  civilStatus: z.string().trim().max(50).optional().nullable(),
  isSenior: z.coerce.boolean().optional().default(false),
  isPwd: z.coerce.boolean().optional().default(false),
  is4ps: z.coerce.boolean().optional().default(false),
  isIp: z.coerce.boolean().optional().default(false),
});

export type FarmerCreateInput = z.input<typeof FarmerCreateSchema>;

export const FarmerUpdateSchema = FarmerCreateSchema.partial();
export type FarmerUpdateInput = z.input<typeof FarmerUpdateSchema>;

/**
 * Validates Farm Landholding & Parcel Input (Objective 1)
 *
 * OMAG-Confirmed Fields:
 * - Barangay
 * - Farm Area (totalAreaHa, areaHa)
 * - Land Ownership / Tenure (tenureType - open string, not closed enum)
 *
 * Proposed System Design:
 * - Centroid Geolocation coordinates (latitude, longitude)
 * - Parcel Number format (flexible open string, default "P-1")
 */
export const FarmParcelCreateSchema = z.object({
  farmName: z.string().trim().max(150).optional().nullable(),
  barangay: z.string().trim().min(1, "Barangay is required"),
  municipality: z.string().trim().default("Polomolok"),
  province: z.string().trim().default("South Cotabato"),
  sitioPurok: z.string().trim().max(100).optional().nullable(),
  totalAreaHa: z.coerce
    .number()
    .positive("Farm land area must be greater than 0 hectares")
    .max(10000, "Area exceeds valid municipal land bounds"),
  tenureType: z.string().trim().min(1, "Tenure type is required").default("Owned"),
  soilType: z.string().trim().max(100).optional().nullable(),
  waterSource: z.string().trim().default("Rainfed"),
  // Parcel sub-fields
  parcelNumber: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val && val !== "" ? val : "P-1")),
  areaHa: z.coerce
    .number()
    .positive("Parcel area must be greater than 0 hectares")
    .max(10000, "Area exceeds valid bounds"),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  remarks: z.string().trim().max(500).optional().nullable(),
});

export type FarmParcelCreateInput = z.input<typeof FarmParcelCreateSchema>;

/**
 * Validates Crop Record Input (Objective 1)
 *
 * OMAG-Confirmed Fields:
 * - Crop Type (open flexible string, NOT a restricted closed list)
 *
 * Proposed System Design:
 * - Cultivar / Variety (optional)
 * - Planting Date (optional, defaults to now)
 * - Season, Year, Status (optional / defaults)
 */
export const CropRecordSchema = z.object({
  parcelId: z.coerce.number().int().positive("Valid parcel reference is required"),
  cropType: z.string().trim().min(1, "Crop type is required"),
  variety: z.string().trim().max(100).optional().nullable(),
  category: z.string().trim().default("Primary"),
  plantedAreaHa: z.coerce
    .number()
    .positive("Planted area must be greater than 0 hectares"),
  plantingDate: z.coerce
    .date()
    .optional()
    .nullable()
    .transform((val) => val ?? new Date()),
  expectedHarvestDate: z.coerce.date().optional().nullable(),
  season: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val !== "" ? val : "Unspecified")),
  year: z.coerce
    .number()
    .int()
    .min(1900, "Year must be valid")
    .max(2100, "Year exceeds allowed bounds")
    .optional()
    .nullable()
    .transform((val) => val ?? new Date().getFullYear()),
  status: z.string().trim().default("Standing"),
  remarks: z.string().trim().max(500).optional().nullable(),
});

export type CropRecordInput = z.input<typeof CropRecordSchema>;

export const DocumentUploadSchema = z.object({
  farmerId: z.coerce.number().int().positive().optional(),
  beneficiaryId: z.coerce.number().int().positive().optional(),
  farmId: z.coerce.number().int().positive().optional().nullable(),
  documentType: z.string().trim().min(1, "Document type is required"),
  fileName: z.string().trim().min(1, "File name is required"),
  fileFormat: z.string().trim().optional(),
  fileSizeBytes: z.coerce.number().int().nonnegative().optional().default(102400),
  storageKey: z.string().trim().optional(),
  fileUrl: z.string().trim().optional().nullable(),
  mimeType: z.string().trim().optional().nullable(),
  remarks: z.string().trim().max(500).optional().nullable(),
}).transform((data) => {
  const targetId = data.farmerId ?? data.beneficiaryId;
  const ext = data.fileName.includes(".") ? data.fileName.split(".").pop() || "pdf" : "pdf";
  return {
    ...data,
    farmerId: targetId as number,
    fileFormat: data.fileFormat || ext,
    storageKey: data.storageKey || `rsbsa-docs/beneficiary-${targetId}/${Date.now()}-${data.fileName}`,
  };
});

export type DocumentUploadInput = z.input<typeof DocumentUploadSchema>;

// Beneficiary Aliases (Aligning with Phase 3 Central Entity Concept)
export const BeneficiaryCreateSchema = FarmerCreateSchema;
export type BeneficiaryCreateInput = FarmerCreateInput;
export const BeneficiaryUpdateSchema = FarmerUpdateSchema;
export type BeneficiaryUpdateInput = FarmerUpdateInput;

// Granular Standalone Farm Schemas
const FarmBaseFields = {
  farmName: z.string().trim().max(150).optional().nullable(),
  barangay: z.string().trim().min(1, "Barangay is required"),
  municipality: z.string().trim().default("Polomolok"),
  province: z.string().trim().default("South Cotabato"),
  sitioPurok: z.string().trim().max(100).optional().nullable(),
  totalAreaHa: z.coerce
    .number()
    .positive("Farm land area must be greater than 0 hectares")
    .max(10000, "Area exceeds valid municipal land bounds"),
  tenureType: z.string().trim().min(1, "Tenure type is required").default("Owned"),
  soilType: z.string().trim().max(100).optional().nullable(),
  waterSource: z.string().trim().default("Rainfed"),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  remarks: z.string().trim().max(500).optional().nullable(),
};

export const FarmCreateSchema = z.object({
  ...FarmBaseFields,
  beneficiaryId: z.coerce.number().int().positive().optional(),
  farmerId: z.coerce.number().int().positive().optional(),
}).transform((data) => ({
  ...data,
  beneficiaryId: (data.beneficiaryId ?? data.farmerId) as number,
}));

export type FarmCreateInput = z.input<typeof FarmCreateSchema>;

export const FarmUpdateSchema = z.object(FarmBaseFields).partial().extend({
  status: z.string().trim().optional(),
});
export type FarmUpdateInput = z.input<typeof FarmUpdateSchema>;

// Granular Standalone FarmParcel Schemas
const ParcelBaseFields = {
  parcelNumber: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val && val !== "" ? val : "P-1")),
  areaHa: z.coerce
    .number()
    .positive("Parcel area must be greater than 0 hectares")
    .max(10000, "Area exceeds valid bounds"),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  soilType: z.string().trim().max(100).optional().nullable(),
  remarks: z.string().trim().max(500).optional().nullable(),
};

export const ParcelCreateSchema = z.object({
  ...ParcelBaseFields,
  farmId: z.coerce.number().int().positive("Valid farm ID is required"),
});
export type ParcelCreateInput = z.input<typeof ParcelCreateSchema>;

export const ParcelUpdateSchema = z.object(ParcelBaseFields).partial().extend({
  status: z.string().trim().optional(),
});
export type ParcelUpdateInput = z.input<typeof ParcelUpdateSchema>;

// Granular Crop Update Schema
export const CropUpdateSchema = CropRecordSchema.partial();
export type CropUpdateInput = z.input<typeof CropUpdateSchema>;

// Granular Document Update Schema
export const DocumentUpdateSchema = z.object({
  documentType: z.string().trim().optional(),
  remarks: z.string().trim().max(500).optional().nullable(),
  verificationStatus: z.string().trim().optional(),
});
export type DocumentUpdateInput = z.input<typeof DocumentUpdateSchema>;

