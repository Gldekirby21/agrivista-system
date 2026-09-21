/**
 * Types and DTOs for Objective 3: ML Crop Yield & Loss Prediction
 */

export interface ModelMetricsDTO {
  modelName: string;
  modelVersion: string;
  algorithm: string;
  targetVariable: string;
  trainingRecordsCount: number;
  trainSetCount: number;
  testSetCount: number;
  mae: number;
  rmse: number;
  r2Score: number;
  featuresUsed: string[];
  datasetClassification: string;
  modelClassification: string;
}

export interface YieldPredictionResult {
  success: boolean;
  cropType: string;
  plantedAreaHa: number;
  predictedYieldTonsHa: number;
  projectedTotalTons: number;
  modelVersion: string;
  algorithm: string;
  classification: string;
  disclaimer: string;
}

export interface LossPredictionResult {
  success: boolean;
  cropType: string;
  modelVersion: string;
  algorithm: string;
  projectedNormalYieldTonsHa: number;
  projectedNormalTotalTons: number;
  predictedRemainingYieldTonsHa: number;
  predictedRemainingTotalTons: number;
  yieldReductionTons: number;
  predictedYieldReductionPercent: number;
  estimatedEconomicLossPhp: number | null;
  economicLossStatus: "ESTIMATED" | "PRICE_DATA_UNAVAILABLE" | "UNAVAILABLE";
  unitPricePhpKgUsed: number | null;
  plantedAreaHa: number;
  disclaimer: string;
}

export interface PredictionRecordDTO {
  id: string;
  reportId: number | null;
  cropId: number;
  crop: {
    id: number;
    cropType: string;
    variety: string | null;
    season: string;
    year: number;
    plantedAreaHa: number;
    parcel: {
      id: number;
      parcelNumber: string;
      farm: {
        id: number;
        farmName: string | null;
        barangay: string;
        farmer: {
          id: number;
          firstName: string;
          lastName: string;
          rsbsaNumber: string | null;
        };
      };
    };
  };
  modelId: string | null;
  model: {
    id: string;
    modelName: string;
    modelVersion: string;
    algorithm: string;
    mae: number;
    rmse: number;
    r2Score: number;
  } | null;
  report?: {
    id: number;
    reportNumber: string;
    incidentDate: string | Date;
    calamityType: string;
    reportedDamagePercent: number;
    reportedAffectedAreaHa: number;
    narrativeDescription?: string | null;
    assessment?: {
      id: string;
      assessedDamagePercent: number;
      assessedAreaHa: number;
      cropStage: string;
      assessorNotes?: string | null;
    } | null;
  } | null;
  projectedNormalYieldTons: number;
  predictedRemainingYieldTons: number;
  predictedYieldReductionPercent: number;
  estimatedEconomicLossPhp: number | null;
  inputFeaturesSnapshot: any;
  predictionTimestamp: string;
}
