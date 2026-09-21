import { z } from "zod";

export const CreateHistoricalDataSchema = z.object({
  barangay: z.string().trim().min(1, "Barangay is required"),
  year: z.number().int().min(2000, "Year must be 2000 or later").max(2100, "Year must be 2100 or earlier"),
  season: z.string().trim().min(1, "Season is required (e.g., 'Wet' or 'Dry')"),
  cropType: z.string().trim().min(1, "Crop type is required"),
  plantedAreaHa: z.number().positive("Planted area must be a positive number"),
  harvestedAreaHa: z.number().nonnegative("Harvested area cannot be negative"),
  productionTons: z.number().nonnegative("Production in tons cannot be negative"),
  averageYieldTonsHa: z.number().nonnegative("Average yield cannot be negative").optional(),
  seedUsageKg: z.number().nonnegative("Seed usage cannot be negative").nullable().optional(),
  fertilizerUsageBags: z.number().nonnegative("Fertilizer usage cannot be negative").nullable().optional(),
  soilType: z.string().trim().nullable().optional(),
  calamityOccurrences: z.number().int().nonnegative("Calamity occurrences cannot be negative").default(0),
});

export const UpdateHistoricalDataSchema = CreateHistoricalDataSchema.partial();

export const HistoricalQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  barangay: z.string().optional(),
  cropType: z.string().optional(),
  year: z.coerce.number().int().optional(),
  season: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "ALL"]).default("ACTIVE"),
  search: z.string().optional(),
});

export const GenerateForecastSchema = z.object({
  cropType: z.string().trim().min(1, "Crop type is required"),
  barangay: z.string().trim().min(1, "Barangay is required"),
  forecastYear: z.number().int().min(2000).max(2100),
  forecastSeason: z.string().trim().min(1, "Season is required"),
  projectedAreaHa: z.number().positive("Projected area must be greater than zero"),
  projectedFarmers: z.number().int().positive("Projected farmers must be at least 1").nullable().optional(),
  soilType: z.string().trim().nullable().optional(),
  calamityOccurrences: z.number().int().nonnegative().default(0),
  averageYieldTonsHa: z.number().positive().nullable().optional(),
});

export const TrainModelRequestSchema = z.object({
  modelVersion: z.string().trim().optional().default("v1.0.0"),
  useSyntheticFallback: z.boolean().default(true),
});

export type CreateHistoricalDataInput = z.infer<typeof CreateHistoricalDataSchema>;
export type UpdateHistoricalDataInput = z.infer<typeof UpdateHistoricalDataSchema>;
export type HistoricalQueryInput = z.infer<typeof HistoricalQuerySchema>;
export type GenerateForecastInput = z.infer<typeof GenerateForecastSchema>;
export type TrainModelRequestInput = z.infer<typeof TrainModelRequestSchema>;
