// ==============================================================================
// Objective 1: RSBSA Centralized Record Management — Types & Interfaces
// Polomolok Agricultural Resource Distribution and Production Analytics System
// ==============================================================================

export const POLOMOLOK_BARANGAYS = [
  "Bentung",
  "Cannery Site",
  "Crossing Palkan",
  "Glamang",
  "Kinilis",
  "Klinan 6",
  "Koronadal Proper",
  "Lam-Calvis",
  "Lapu",
  "Landan",
  "Lumakil",
  "Maligo",
  "Magsaysay",
  "Pagalungan",
  "Palkan",
  "Poblacion",
  "Polo",
  "Rubber",
  "Silway 7",
  "Silway 8",
  "Sulit",
  "Sumbakil",
  "Upper Klinan",
] as const;

export type PolomolokBarangay = (typeof POLOMOLOK_BARANGAYS)[number];

/**
 * Land Ownership / Tenure Options
 *
 * 🟢 OMAG CONFIRMED: Requirement to record "Land Ownership/Tenure".
 * 🟡 PROPOSED SYSTEM DESIGN: The specific list below represents common suggested options for UI convenience.
 * The system accepts any open tenure text and does NOT restrict to a closed OMAG list.
 */
export const PROPOSED_TENURE_SUGGESTIONS = [
  "Owned",
  "Leased",
  "Tenant",
  "Agrarian Reform Beneficiary (ARB)",
  "Usufruct",
  "Other",
] as const;

export const TENURE_TYPES = PROPOSED_TENURE_SUGGESTIONS;
export type TenureType = string;

/**
 * Common Crop Types
 *
 * 🟢 OMAG CONFIRMED: Requirement to record "Crop Type".
 * 🟡 PROPOSED SYSTEM DESIGN: The list below represents common suggested crops in Polomolok for autocomplete/suggestions.
 * The system accepts any crop type text and does NOT restrict enrollees to a closed list.
 */
export const PROPOSED_CROP_SUGGESTIONS = [
  "Corn",
  "Rice",
  "Pineapple",
  "Banana",
  "Cassava",
  "Coconut",
  "Coffee",
  "Cacao",
  "Vegetables",
  "Other",
] as const;

export const COMMON_CROP_TYPES = PROPOSED_CROP_SUGGESTIONS;
export type CommonCropType = string;

/**
 * Supporting Documents
 *
 * 🟢 OMAG CONFIRMED: Common supporting document examples: "Land title" and "Valid ID".
 * 🟡 PROPOSED SYSTEM DESIGN: Additional document categories below are proposed administrative options.
 * The system accepts any document type string.
 */
export const PROPOSED_DOCUMENT_TYPES = [
  "Land Title",
  "Valid ID",
  "Tax Declaration",
  "Certificate of Land Ownership Award (CLOA)",
  "Barangay Certification",
  "Lease Contract",
  "Other",
] as const;

export const SUPPORTING_DOCUMENT_TYPES = PROPOSED_DOCUMENT_TYPES;
export type SupportingDocumentType = string;

/**
 * Farmer Sector / Category
 *
 * 🟢 OMAG CONFIRMED: Requirement to record "Farmer sector/category".
 * 🟡 PROPOSED SYSTEM DESIGN: Suggested options for user convenience.
 */
export const FARMER_SECTOR_CATEGORIES = [
  "Farmer / Agricultural Worker",
  "Rice Producer",
  "Corn Producer",
  "High-Value Crop Grower",
  "Smallholder Farmer",
  "Agrarian Reform Beneficiary",
  "Other",
] as const;

export type FarmerSectorCategory = string;

export interface FarmerListItem {
  id: number;
  rsbsaNumber: string | null;
  farmerCode: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  extensionName: string | null;
  contactNumber: string | null;
  barangay: string;
  municipality: string;
  province: string;
  status: string;
  isSenior: boolean;
  isPwd: boolean;
  is4ps: boolean;
  isIp: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  farmCount: number;
  parcelCount: number;
  totalHectares: number;
  activeCrops: string[];
}

export interface CropRecordDetail {
  id: number;
  parcelId: number;
  cropType: string;
  variety: string | null;
  category: string;
  plantedAreaHa: number;
  plantingDate: string | Date;
  expectedHarvestDate: string | Date | null;
  actualHarvestDate: string | Date | null;
  season: string;
  year: number;
  status: string;
  remarks: string | null;
}

export interface FarmParcelDetail {
  id: number;
  farmId: number;
  parcelNumber: string;
  parcelCode: string | null;
  latitude: number | null;
  longitude: number | null;
  areaHa: number;
  soilType: string | null;
  status: string;
  remarks: string | null;
  crops: CropRecordDetail[];
}

export interface FarmLandholdingDetail {
  id: number;
  farmerId: number;
  farmCode: string | null;
  farmName: string | null;
  barangay: string;
  municipality: string;
  province: string;
  sitioPurok: string | null;
  totalAreaHa: number;
  tenureType: string;
  soilType: string | null;
  waterSource: string;
  status: string;
  remarks: string | null;
  parcels: FarmParcelDetail[];
}

export interface SupportingDocumentDetail {
  id: string;
  farmerId: number;
  farmId: number | null;
  documentType: string;
  storageProvider: string;
  fileName: string;
  fileFormat: string;
  fileSizeBytes: number;
  verificationStatus: string;
  remarks: string | null;
  createdAt: string | Date;
  uploadedBy?: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface FarmerFullDetail {
  id: number;
  rsbsaNumber: string | null;
  farmerCode: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  extensionName: string | null;
  sex: string;
  dateOfBirth: string | Date;
  contactNumber: string | null;
  email: string | null;
  barangay: string;
  municipality: string;
  province: string;
  civilStatus: string | null;
  isSenior: boolean;
  isPwd: boolean;
  is4ps: boolean;
  isIp: boolean;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  farms: FarmLandholdingDetail[];
  documents: SupportingDocumentDetail[];
}

export interface RSBSASummaryStats {
  totalFarmers: number;
  totalParcels: number;
  totalHectares: number;
  totalCropsRecorded: number;
  barangayCounts: Record<string, number>;
}
