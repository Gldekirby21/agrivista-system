// ==============================================================================
// Objective 4 Domain Types: FIFO-Based Fertilizer and Seeds Inventory Management
// ==============================================================================

import { InventoryCategory } from "@prisma/client";

export type InventoryCategoryType = "SEEDS" | "FERTILIZER";

export type BatchStatusType = "Available" | "Low Stock" | "Depleted" | "Expired" | "Archived";

export interface InventoryItemDTO {
  id: number;
  itemCode: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  reorderLevel: number;
  description?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Computed aggregations
  totalReceived: number;
  totalRemaining: number;
  totalDistributed: number;
  activeBatchesCount: number;
  isLowStock: boolean;
}

export interface InventoryBatchDTO {
  id: string;
  itemId: number;
  batchNumber: string;
  receivedQuantity: number;
  remainingQuantity: number;
  dateReceived: Date | string;
  expiryDate?: Date | string | null;
  viabilityDate?: Date | string | null;
  supplierSource?: string | null;
  storageLocation?: string | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  item?: {
    id: number;
    itemCode: string;
    name: string;
    category: InventoryCategory;
    unit: string;
  };
  // Monitoring indicators (Proposed System Design)
  daysUntilExpiry?: number | null;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
}

export interface DistributionRecordDTO {
  id: string;
  batchId: string;
  farmerId?: number | null;
  barangay?: string | null;
  requestId?: string | null;
  quantityDistributed: number;
  unit: string;
  distributionDate: Date | string;
  releasedById: string;
  purpose?: string | null;
  remarks?: string | null;
  batch?: {
    id: string;
    batchNumber: string;
    item?: {
      id: number;
      itemCode: string;
      name: string;
      category: InventoryCategory;
      unit: string;
    };
  };
  farmer?: {
    id: number;
    firstName: string;
    lastName: string;
    rsbsaNumber?: string | null;
    barangay: string;
  } | null;
  releasedBy?: {
    id: string;
    fullName: string;
    username: string;
    role: string;
  };
}

export type DistributionRequestStatusType = "PENDING" | "APPROVED" | "REJECTED" | "DISTRIBUTED";

export interface DistributionRequestDTO {
  id: string;
  requestNumber: string;
  barangay: string;
  itemId: number;
  requestedQuantity: number;
  unit: string;
  resourceType?: string | null;
  remarks?: string | null;
  status: DistributionRequestStatusType;
  requestedById: string;
  requestedAt: Date | string;
  approvedById?: string | null;
  approvedAt?: Date | string | null;
  approvalRemarks?: string | null;
  distributedAt?: Date | string | null;
  distributedById?: string | null;
  item?: {
    id: number;
    itemCode: string;
    name: string;
    category: InventoryCategory;
    unit: string;
  };
  requestedBy?: {
    id: string;
    fullName: string;
    username: string;
    role: string;
  };
  approvedBy?: {
    id: string;
    fullName: string;
    username: string;
    role: string;
  } | null;
  distributedBy?: {
    id: string;
    fullName: string;
    username: string;
    role: string;
  } | null;
  distributions?: DistributionRecordDTO[];
}

// ------------------------------------------------------------------------------
// FIFO Engine Types (Strictly Deterministic Mathematics)
// ------------------------------------------------------------------------------

export interface FifoBatchAllocation {
  batchId: string;
  batchNumber: string;
  dateReceived: Date | string;
  expiryDate?: Date | string | null;
  viabilityDate?: Date | string | null;
  availableBefore: number;
  quantityAllocated: number;
  remainingAfter: number;
  statusAfter: string;
}

export interface FifoCalculationResult {
  itemId: number;
  itemName: string;
  requestedQuantity: number;
  totalAvailableStock: number;
  isSufficient: boolean;
  allocations: FifoBatchAllocation[];
  unfulfilledQuantity: number;
  batchesDepletedCount: number;
}
