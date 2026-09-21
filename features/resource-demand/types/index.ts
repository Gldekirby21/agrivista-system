/**
 * Objective 5: Historical Crop Yield & Resource-Demand Modeling Types
 * OMAG Polomolok Agricultural Resource Distribution and Production Analytics System
 */

// Source of Truth Classification Constants
export const SOURCE_CLASSIFICATIONS = {
  OMAG_CONFIRMED: "🟢 CONFIRMED OMAG REQUIREMENT",
  OFFICIAL_EXTERNAL: "🔵 OFFICIAL EXTERNAL REFERENCE",
  PROPOSED_DESIGN: "🟡 PROPOSED SYSTEM DESIGN",
  PENDING_CONFIRMATION: "🔴 PENDING OMAG CONFIRMATION",
  SYNTHETIC_DEMO: "⚫ SYNTHETIC DEMONSTRATION DATA",
} as const;

export const POLOMOLOK_BARANGAYS = [
  "Bentung", "Cannery Site", "Crossing Pangi", "Glamang", "Kinilis",
  "Klinan 6", "Koronadal Proper", "Lam-caliaf", "Lapu", "Lumakil",
  "Maligo", "Magsaysay", "Pagalungan", "Poblacion", "Polo",
  "Rubber", "Silway 7", "Silway 8", "Sulit", "Sumbakil", "Upper Klinan"
] as const;

export const SUPPORTED_CROPS = [
  "Corn", "Rice", "Cassava", "Banana", "Pineapple", "Coffee", "Cacao", "Vegetables"
] as const;

export const SEASONS = ["Wet", "Dry"] as const;

export const SOIL_TYPES = [
  "Volcanic Loam", "Clay Loam", "Sandy Loam", "Silt Loam", "Alluvial"
] as const;

export interface HistoricalAgriculturalDataDTO {
  id: number;
  barangay: string;
  year: number;
  season: string;
  cropType: string;
  plantedAreaHa: number;
  harvestedAreaHa: number;
  productionTons: number;
  averageYieldTonsHa: number;
  seedUsageKg: number | null;
  fertilizerUsageBags: number | null;
  soilType: string | null;
  calamityOccurrences: number;
  status: "ACTIVE" | "ARCHIVED" | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ResourceDemandForecastDTO {
  id: string;
  barangay: string;
  cropType: string;
  forecastYear: number;
  forecastSeason: string;
  projectedAreaHa: number;
  forecastSeedKg: number;
  forecastFertilizerBags: number;
  methodUsed: string;
  confidenceMetric: number | null;
  limitationsNotice: string;
  projectedFarmers: number | null;
  modelVersion: string | null;
  isSynthetic: boolean;
  createdById: string | null;
  generatedAt: Date | string;
}

export interface ModelMetricsDTO {
  modelName: string;
  modelVersion: string;
  targetVariable: string;
  algorithm: string;
  trainingPeriod: string;
  mae: number;
  rmse: number;
  r2Score: number;
  featuresUsed: string[];
  isActive?: boolean;
}

export interface DualResourceModelsDTO {
  seedModel: ModelMetricsDTO;
  fertilizerModel: ModelMetricsDTO;
  modelVersion: string;
  algorithm: string;
  isTimeAwareSplit?: boolean;
  splitMethod?: string;
  trainingPeriod?: string;
  classification: string;
  datasetClassification: string;
  disclaimer: string;
}

export interface ForecastInputDTO {
  cropType: string;
  barangay: string;
  forecastYear: number;
  forecastSeason: string;
  projectedAreaHa: number;
  projectedFarmers?: number | null;
  soilType?: string | null;
  calamityOccurrences?: number;
  averageYieldTonsHa?: number | null;
}

export interface ForecastResultDTO {
  success: boolean;
  forecastRecordId?: string;
  cropType: string;
  barangay: string;
  forecastYear: number;
  forecastSeason: string;
  projectedAreaHa: number;
  projectedFarmers?: number | null;
  mlPredictions: {
    forecastSeedKg: number;
    forecastFertilizerBags: number;
  };
  deterministicDerivedValues: {
    seedRateKgPerHa: number;
    fertilizerRateBagsPerHa: number;
    seedPerFarmerKg?: number | null;
    fertilizerPerFarmerBags?: number | null;
  };
  modelMetadata: {
    seedModelName: string;
    fertilizerModelName: string;
    modelVersion: string;
    algorithm: string;
    trainingPeriod?: string;
  };
  limitationsNotice: string;
  isSynthetic: boolean;
  generatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
