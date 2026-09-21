// ==============================================================================
// Objective 4 Validation Schemas: FIFO Inventory Management
// ==============================================================================

import { z } from "zod";

export const CreateInventoryItemSchema = z.object({
  itemCode: z
    .string()
    .trim()
    .min(2, "Item code must be at least 2 characters")
    .max(50, "Item code cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Item code can only contain alphanumeric characters, hyphens, and underscores"),
  name: z
    .string()
    .trim()
    .min(2, "Item name must be at least 2 characters")
    .max(150, "Item name cannot exceed 150 characters"),
  category: z.enum(["SEEDS", "FERTILIZER"]),
  unit: z
    .string()
    .trim()
    .min(1, "Unit of measurement is required")
    .max(50, "Unit cannot exceed 50 characters"),
  reorderLevel: z
    .number()
    .min(0, "Reorder level cannot be negative")
    .default(10),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().nullable(),
});

export const UpdateInventoryItemSchema = CreateInventoryItemSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const CreateInventoryBatchSchema = z.object({
  itemId: z.number().int().positive("A valid inventory item must be selected"),
  batchNumber: z
    .string()
    .trim()
    .min(1, "Batch number or lot identifier is required")
    .max(80, "Batch number cannot exceed 80 characters"),
  receivedQuantity: z
    .number()
    .positive("Received quantity must be greater than zero"),
  dateReceived: z
    .string()
    .min(1, "Receipt date is required")
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid receipt date" }),
  expiryDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid expiration date" }),
  viabilityDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid viability date" }),
  supplierSource: z.string().trim().max(150).optional().nullable(),
  storageLocation: z.string().trim().max(100).optional().nullable(),
});

export const UpdateInventoryBatchSchema = z.object({
  supplierSource: z.string().trim().max(150).optional().nullable(),
  storageLocation: z.string().trim().max(100).optional().nullable(),
  status: z.enum(["Available", "Low Stock", "Depleted", "Expired", "Archived"]).optional(),
  expiryDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid expiration date" }),
  viabilityDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid viability date" }),
});

export const DistributeStockSchema = z.object({
  itemId: z.number().int().positive("A valid inventory item must be selected"),
  requestedQuantity: z
    .number()
    .positive("Requested quantity must be strictly greater than zero"),
  farmerId: z.number().int().positive("A valid registered RSBSA beneficiary must be selected"),
  purpose: z.string().trim().max(250).optional().nullable(),
  remarks: z.string().trim().max(500).optional().nullable(),
});

export const FifoPreviewSchema = z.object({
  itemId: z.number().int().positive("A valid inventory item must be selected"),
  requestedQuantity: z
    .number()
    .positive("Requested quantity must be strictly greater than zero"),
});

export const QueryInventorySchema = z.object({
  category: z.enum(["SEEDS", "FERTILIZER", "ALL"]).optional().default("ALL"),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const QueryBatchSchema = z.object({
  itemId: z.coerce.number().int().positive().optional(),
  category: z.enum(["SEEDS", "FERTILIZER", "ALL"]).optional().default("ALL"),
  status: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export const CreateDistributionRequestSchema = z.object({
  barangay: z.string().trim().min(1, "Barangay destination is required"),
  itemId: z.number().int().positive("A valid inventory item must be selected"),
  requestedQuantity: z.number().positive("Requested quantity must be strictly greater than zero"),
  unit: z.string().trim().min(1, "Unit of measurement is required"),
  resourceType: z.string().trim().optional().nullable(),
  remarks: z.string().trim().max(500, "Remarks cannot exceed 500 characters").optional().nullable(),
});

export const ReviewDistributionRequestSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  remarks: z.string().trim().max(500, "Approval remarks cannot exceed 500 characters").optional().nullable(),
});

export const QueryDistributionRequestSchema = z.object({
  barangay: z.string().trim().optional(),
  status: z.enum(["ALL", "PENDING", "APPROVED", "REJECTED", "DISTRIBUTED"]).optional().default("ALL"),
  itemId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
