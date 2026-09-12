import { z } from "zod";

export const PredictYieldInputSchema = z.object({
  cropId: z.number().int().positive(),
  reportId: z.number().int().positive().optional().nullable(),
  cropType: z.string().min(1, "Crop type is required"),
  barangay: z.string().default("Poblacion"),
  season: z.string().default("Wet"),
  soilType: z.string().default("Volcanic Loam"),
  plantedAreaHa: z.number().positive("Planted area must be positive"),
  baselineYieldTonsHa: z.number().positive().optional().nullable(),
  calamityDamagePercent: z.number().min(0).max(100).optional().nullable(),
  cropUnitPricePhpKg: z.number().positive().optional().nullable(),
  calamityOccurrences: z.number().int().min(0).default(0),
  historicalYield: z.number().positive().optional().nullable(),
});

export const TrainModelInputSchema = z.object({
  modelVersion: z.string().min(1).default("v1.0.0"),
  useSyntheticFallback: z.boolean().default(true),
});

export const QueryPredictionSchema = z.object({
  search: z.string().optional(),
  cropType: z.string().optional(),
  barangay: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(15),
});

export type PredictYieldInput = z.infer<typeof PredictYieldInputSchema>;
export type TrainModelInput = z.infer<typeof TrainModelInputSchema>;
export type QueryPrediction = z.infer<typeof QueryPredictionSchema>;
