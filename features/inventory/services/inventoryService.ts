// ==============================================================================
// Objective 4: Core Inventory & Distribution Management Service
// Handles Database CRUD, Transactional FIFO Allocation, and Audit Logging
// ==============================================================================

import { prisma } from "@/lib/database/prisma";
import { UserSession } from "@/types";
import {
  CreateInventoryItemSchema,
  UpdateInventoryItemSchema,
  CreateInventoryBatchSchema,
  UpdateInventoryBatchSchema,
  DistributeStockSchema,
  QueryInventorySchema,
  QueryBatchSchema,
} from "../validation/schemas";
import { calculateFifoAllocation } from "./fifoEngine";
import {
  InventoryItemDTO,
  InventoryBatchDTO,
  DistributionRecordDTO,
  FifoCalculationResult,
} from "../types";
import { InventoryCategory } from "@prisma/client";
import { z } from "zod";

// ------------------------------------------------------------------------------
// Inventory Items (Catalog)
// ------------------------------------------------------------------------------

export async function getInventoryItems(
  params: z.infer<typeof QueryInventorySchema>
): Promise<{ items: InventoryItemDTO[]; total: number; page: number; limit: number }> {
  const { category, search, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: any = { isActive: true };

  if (category && category !== "ALL") {
    where.category = category as InventoryCategory;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { itemCode: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, dbItems] = await Promise.all([
    prisma.inventoryItem.count({ where }),
    prisma.inventoryItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: {
        batches: {
          select: {
            id: true,
            receivedQuantity: true,
            remainingQuantity: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const items: InventoryItemDTO[] = dbItems.map((item) => {
    const totalReceived = item.batches.reduce((sum, b) => sum + Number(b.receivedQuantity), 0);
    const totalRemaining = item.batches.reduce((sum, b) => sum + Number(b.remainingQuantity), 0);
    const totalDistributed = Math.round((totalReceived - totalRemaining) * 10000) / 10000;
    const activeBatchesCount = item.batches.filter(
      (b) => Number(b.remainingQuantity) > 0 && b.status !== "Archived" && b.status !== "Expired"
    ).length;
    const isLowStock = totalRemaining <= item.reorderLevel;

    return {
      id: item.id,
      itemCode: item.itemCode,
      name: item.name,
      category: item.category,
      unit: item.unit,
      reorderLevel: item.reorderLevel,
      description: item.description,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      totalReceived,
      totalRemaining,
      totalDistributed,
      activeBatchesCount,
      isLowStock,
    };
  });

  return { items, total, page, limit };
}

export async function getInventoryItemById(id: number): Promise<InventoryItemDTO | null> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      batches: {
        orderBy: [{ dateReceived: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!item) return null;

  const totalReceived = item.batches.reduce((sum, b) => sum + Number(b.receivedQuantity), 0);
  const totalRemaining = item.batches.reduce((sum, b) => sum + Number(b.remainingQuantity), 0);
  const totalDistributed = Math.round((totalReceived - totalRemaining) * 10000) / 10000;
  const activeBatchesCount = item.batches.filter(
    (b) => Number(b.remainingQuantity) > 0 && b.status !== "Archived" && b.status !== "Expired"
  ).length;
  const isLowStock = totalRemaining <= item.reorderLevel;

  return {
    id: item.id,
    itemCode: item.itemCode,
    name: item.name,
    category: item.category,
    unit: item.unit,
    reorderLevel: item.reorderLevel,
    description: item.description,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    totalReceived,
    totalRemaining,
    totalDistributed,
    activeBatchesCount,
    isLowStock,
  };
}

export async function createInventoryItem(
  payload: z.infer<typeof CreateInventoryItemSchema>,
  session: UserSession
): Promise<InventoryItemDTO> {
  // Verify itemCode uniqueness
  const existing = await prisma.inventoryItem.findUnique({
    where: { itemCode: payload.itemCode },
  });

  if (existing) {
    throw new Error(`An inventory item with code '${payload.itemCode}' already exists.`);
  }

  const item = await prisma.inventoryItem.create({
    data: {
      itemCode: payload.itemCode,
      name: payload.name,
      category: payload.category as InventoryCategory,
      unit: payload.unit,
      reorderLevel: payload.reorderLevel,
      description: payload.description,
    },
  });

  // Municipal Audit Log
  await prisma.auditLog.create({
    data: {
      userId: session.id,
      roleSnapshot: session.role,
      action: "INVENTORY_CREATE",
      module: "INVENTORY",
      recordId: item.id.toString(),
      newValues: {
        itemCode: item.itemCode,
        name: item.name,
        category: item.category,
        unit: item.unit,
      },
    },
  });

  return {
    ...item,
    totalReceived: 0,
    totalRemaining: 0,
    totalDistributed: 0,
    activeBatchesCount: 0,
    isLowStock: true,
  };
}

export async function updateInventoryItem(
  id: number,
  payload: z.infer<typeof UpdateInventoryItemSchema>,
  session: UserSession
): Promise<InventoryItemDTO> {
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Inventory item with ID ${id} not found.`);
  }

  if (payload.itemCode && payload.itemCode !== existing.itemCode) {
    const duplicate = await prisma.inventoryItem.findUnique({
      where: { itemCode: payload.itemCode },
    });
    if (duplicate) {
      throw new Error(`An inventory item with code '${payload.itemCode}' already exists.`);
    }
  }

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(payload.itemCode && { itemCode: payload.itemCode }),
      ...(payload.name && { name: payload.name }),
      ...(payload.category && { category: payload.category as InventoryCategory }),
      ...(payload.unit && { unit: payload.unit }),
      ...(payload.reorderLevel !== undefined && { reorderLevel: payload.reorderLevel }),
      ...(payload.description !== undefined && { description: payload.description }),
      ...(payload.isActive !== undefined && { isActive: payload.isActive }),
    },
    include: {
      batches: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      roleSnapshot: session.role,
      action: "INVENTORY_UPDATE",
      module: "INVENTORY",
      recordId: id.toString(),
      previousValues: {
        itemCode: existing.itemCode,
        name: existing.name,
        reorderLevel: existing.reorderLevel,
      },
      newValues: payload,
    },
  });

  const totalReceived = updated.batches.reduce((sum, b) => sum + Number(b.receivedQuantity), 0);
  const totalRemaining = updated.batches.reduce((sum, b) => sum + Number(b.remainingQuantity), 0);
  const totalDistributed = Math.round((totalReceived - totalRemaining) * 10000) / 10000;
  const activeBatchesCount = updated.batches.filter(
    (b) => Number(b.remainingQuantity) > 0 && b.status !== "Archived" && b.status !== "Expired"
  ).length;

  return {
    id: updated.id,
    itemCode: updated.itemCode,
    name: updated.name,
    category: updated.category,
    unit: updated.unit,
    reorderLevel: updated.reorderLevel,
    description: updated.description,
    isActive: updated.isActive,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    totalReceived,
    totalRemaining,
    totalDistributed,
    activeBatchesCount,
    isLowStock: totalRemaining <= updated.reorderLevel,
  };
}

export async function archiveInventoryItem(id: number, session: UserSession): Promise<void> {
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Inventory item with ID ${id} not found.`);
  }

  await prisma.inventoryItem.update({
    where: { id },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      roleSnapshot: session.role,
      action: "INVENTORY_ARCHIVE",
      module: "INVENTORY",
      recordId: id.toString(),
      previousValues: { isActive: true },
      newValues: { isActive: false },
    },
  });
}

// ------------------------------------------------------------------------------
// Inventory Batches
// ------------------------------------------------------------------------------

export async function getInventoryBatches(
  params: z.infer<typeof QueryBatchSchema>
): Promise<{ batches: InventoryBatchDTO[]; total: number; page: number; limit: number }> {
  const { itemId, category, status, search, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (itemId) {
    where.itemId = itemId;
  }

  if (category && category !== "ALL") {
    where.item = { category: category as InventoryCategory };
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { batchNumber: { contains: search, mode: "insensitive" } },
      { supplierSource: { contains: search, mode: "insensitive" } },
      { storageLocation: { contains: search, mode: "insensitive" } },
      { item: { name: { contains: search, mode: "insensitive" } } },
      { item: { itemCode: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, dbBatches] = await Promise.all([
    prisma.inventoryBatch.count({ where }),
    prisma.inventoryBatch.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ dateReceived: "asc" }, { createdAt: "asc" }],
      include: {
        item: {
          select: {
            id: true,
            itemCode: true,
            name: true,
            category: true,
            unit: true,
          },
        },
      },
    }),
  ]);

  const now = new Date();
  const batches: InventoryBatchDTO[] = dbBatches.map((b) => {
    let daysUntilExpiry: number | null = null;
    let isExpired = false;
    let isExpiringSoon = false;

    if (b.expiryDate) {
      const diffMs = new Date(b.expiryDate).getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      isExpired = daysUntilExpiry <= 0;
      isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }

    return {
      id: b.id,
      itemId: b.itemId,
      batchNumber: b.batchNumber,
      receivedQuantity: Number(b.receivedQuantity),
      remainingQuantity: Number(b.remainingQuantity),
      dateReceived: b.dateReceived,
      expiryDate: b.expiryDate,
      viabilityDate: b.viabilityDate,
      supplierSource: b.supplierSource,
      storageLocation: b.storageLocation,
      status: b.status,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      item: b.item,
      daysUntilExpiry,
      isExpired,
      isExpiringSoon,
    };
  });

  return { batches, total, page, limit };
}

export async function createInventoryBatch(
  payload: z.infer<typeof CreateInventoryBatchSchema>,
  session: UserSession
): Promise<InventoryBatchDTO> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: payload.itemId },
  });

  if (!item || !item.isActive) {
    throw new Error("Cannot receive batch for a non-existent or inactive catalog item.");
  }

  const batch = await prisma.inventoryBatch.create({
    data: {
      itemId: payload.itemId,
      batchNumber: payload.batchNumber,
      receivedQuantity: payload.receivedQuantity,
      remainingQuantity: payload.receivedQuantity,
      dateReceived: new Date(payload.dateReceived),
      expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null,
      viabilityDate: payload.viabilityDate ? new Date(payload.viabilityDate) : null,
      supplierSource: payload.supplierSource || null,
      storageLocation: payload.storageLocation || null,
      status: "Available",
    },
    include: {
      item: {
        select: {
          id: true,
          itemCode: true,
          name: true,
          category: true,
          unit: true,
        },
      },
    },
  });

  // Municipal Audit Log
  await prisma.auditLog.create({
    data: {
      userId: session.id,
      roleSnapshot: session.role,
      action: "BATCH_CREATE",
      module: "INVENTORY",
      recordId: batch.id,
      newValues: {
        itemId: batch.itemId,
        batchNumber: batch.batchNumber,
        receivedQuantity: batch.receivedQuantity,
        dateReceived: batch.dateReceived,
      },
    },
  });

  return {
    id: batch.id,
    itemId: batch.itemId,
    batchNumber: batch.batchNumber,
    receivedQuantity: Number(batch.receivedQuantity),
    remainingQuantity: Number(batch.remainingQuantity),
    dateReceived: batch.dateReceived,
    expiryDate: batch.expiryDate,
    viabilityDate: batch.viabilityDate,
    supplierSource: batch.supplierSource,
    storageLocation: batch.storageLocation,
    status: batch.status,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
    item: batch.item,
  };
}

export async function updateInventoryBatch(
  id: string,
  payload: z.infer<typeof UpdateInventoryBatchSchema>,
  session: UserSession
): Promise<InventoryBatchDTO> {
  const existing = await prisma.inventoryBatch.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Inventory batch with ID ${id} not found.`);
  }

  const updated = await prisma.inventoryBatch.update({
    where: { id },
    data: {
      ...(payload.supplierSource !== undefined && { supplierSource: payload.supplierSource }),
      ...(payload.storageLocation !== undefined && { storageLocation: payload.storageLocation }),
      ...(payload.status !== undefined && { status: payload.status }),
      ...(payload.expiryDate !== undefined && {
        expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null,
      }),
      ...(payload.viabilityDate !== undefined && {
        viabilityDate: payload.viabilityDate ? new Date(payload.viabilityDate) : null,
      }),
    },
    include: {
      item: {
        select: {
          id: true,
          itemCode: true,
          name: true,
          category: true,
          unit: true,
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      roleSnapshot: session.role,
      action: "BATCH_UPDATE",
      module: "INVENTORY",
      recordId: id,
      previousValues: {
        supplierSource: existing.supplierSource,
        storageLocation: existing.storageLocation,
        status: existing.status,
      },
      newValues: payload,
    },
  });

  return {
    id: updated.id,
    itemId: updated.itemId,
    batchNumber: updated.batchNumber,
    receivedQuantity: Number(updated.receivedQuantity),
    remainingQuantity: Number(updated.remainingQuantity),
    dateReceived: updated.dateReceived,
    expiryDate: updated.expiryDate,
    viabilityDate: updated.viabilityDate,
    supplierSource: updated.supplierSource,
    storageLocation: updated.storageLocation,
    status: updated.status,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    item: updated.item,
  };
}

export async function archiveInventoryBatch(id: string, session: UserSession): Promise<void> {
  const existing = await prisma.inventoryBatch.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Inventory batch with ID ${id} not found.`);
  }

  await prisma.inventoryBatch.update({
    where: { id },
    data: { status: "Archived" },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      roleSnapshot: session.role,
      action: "BATCH_ARCHIVE",
      module: "INVENTORY",
      recordId: id,
      previousValues: { status: existing.status },
      newValues: { status: "Archived" },
    },
  });
}

// ------------------------------------------------------------------------------
// FIFO Simulation & Transactional Distribution
// ------------------------------------------------------------------------------

/**
 * Previews FIFO stock allocation without modifying any records in the database.
 */
export async function previewFifoAllocation(
  itemId: number,
  requestedQuantity: number
): Promise<FifoCalculationResult> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: {
      batches: {
        where: {
          remainingQuantity: { gt: 0 },
          status: { notIn: ["Depleted", "Archived", "Expired"] },
        },
      },
    },
  });

  if (!item) {
    throw new Error(`Inventory item with ID ${itemId} not found.`);
  }

  const batchCandidates = item.batches.map((b) => ({
    id: b.id,
    batchNumber: b.batchNumber,
    remainingQuantity: Number(b.remainingQuantity),
    dateReceived: b.dateReceived,
    createdAt: b.createdAt,
    expiryDate: b.expiryDate,
    viabilityDate: b.viabilityDate,
    status: b.status,
  }));

  return calculateFifoAllocation(
    item.id,
    item.name,
    batchCandidates,
    requestedQuantity,
    item.reorderLevel
  );
}

/**
 * Atomically executes a multi-batch FIFO stock distribution in a database transaction.
 */
export async function executeDistribution(
  payload: z.infer<typeof DistributeStockSchema>,
  session: UserSession
): Promise<{
  distributionResult: FifoCalculationResult;
  createdRecords: DistributionRecordDTO[];
}> {
  const { itemId, requestedQuantity, farmerId, purpose, remarks } = payload;

  // 1. Verify farmer beneficiary exists
  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: { id: true, firstName: true, lastName: true, rsbsaNumber: true, barangay: true },
  });

  if (!farmer) {
    throw new Error(`Registered RSBSA beneficiary with ID ${farmerId} does not exist.`);
  }

  // 2. Fetch item and candidate batches
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: {
      batches: {
        where: {
          remainingQuantity: { gt: 0 },
          status: { notIn: ["Depleted", "Archived", "Expired"] },
        },
      },
    },
  });

  if (!item || !item.isActive) {
    throw new Error("Selected inventory item is inactive or does not exist.");
  }

  const batchCandidates = item.batches.map((b) => ({
    id: b.id,
    batchNumber: b.batchNumber,
    remainingQuantity: Number(b.remainingQuantity),
    dateReceived: b.dateReceived,
    createdAt: b.createdAt,
    expiryDate: b.expiryDate,
    viabilityDate: b.viabilityDate,
    status: b.status,
  }));

  // 3. Compute deterministic FIFO breakdown
  const fifoResult = calculateFifoAllocation(
    item.id,
    item.name,
    batchCandidates,
    requestedQuantity,
    item.reorderLevel
  );

  if (!fifoResult.isSufficient) {
    throw new Error(
      `Insufficient available stock. Requested: ${requestedQuantity} ${item.unit}, but only ${fifoResult.totalAvailableStock} ${item.unit} available.`
    );
  }

  // 4. Atomic Execution inside Prisma $transaction
  const createdRecords: DistributionRecordDTO[] = [];

  await prisma.$transaction(
    async (tx) => {
      for (const alloc of fifoResult.allocations) {
        // Decrement remainingQuantity and update batch status
        await tx.inventoryBatch.update({
          where: { id: alloc.batchId },
          data: {
            remainingQuantity: alloc.remainingAfter,
            status: alloc.statusAfter,
          },
        });

        // Create distribution ledger record
        const dist = await tx.distributionRecord.create({
          data: {
            batchId: alloc.batchId,
            farmerId,
            quantityDistributed: alloc.quantityAllocated,
            unit: item.unit,
            distributionDate: new Date(),
            releasedById: session.id,
            purpose: purpose || null,
            remarks: remarks || null,
          },
        });

        createdRecords.push({
          id: dist.id,
          batchId: dist.batchId,
          farmerId: dist.farmerId,
          quantityDistributed: Number(dist.quantityDistributed),
          unit: dist.unit,
          distributionDate: dist.distributionDate,
          releasedById: dist.releasedById,
          purpose: dist.purpose,
          remarks: dist.remarks,
          batch: {
            id: alloc.batchId,
            batchNumber: alloc.batchNumber,
            item: {
              id: item.id,
              itemCode: item.itemCode,
              name: item.name,
              category: item.category,
              unit: item.unit,
            },
          },
          farmer: {
            id: farmer.id,
            firstName: farmer.firstName,
            lastName: farmer.lastName,
            rsbsaNumber: farmer.rsbsaNumber,
            barangay: farmer.barangay,
          },
          releasedBy: {
            id: session.id,
            fullName: session.fullName,
            username: session.username,
            role: session.role,
          },
        });
      }

      // Record unified Municipal AuditLog for the distribution event
      await tx.auditLog.create({
        data: {
          userId: session.id,
          roleSnapshot: session.role,
          action: "DISTRIBUTION_CREATE",
          module: "INVENTORY",
          recordId: itemId.toString(),
          previousValues: {
            totalAvailableStock: fifoResult.totalAvailableStock,
          },
          newValues: {
            requestedQuantity,
            farmerId,
            allocationsCount: fifoResult.allocations.length,
            allocations: fifoResult.allocations.map((a) => ({
              batchId: a.batchId,
              batchNumber: a.batchNumber,
              quantity: a.quantityAllocated,
              remainingAfter: a.remainingAfter,
            })),
          },
        },
      });
    },
    { maxWait: 15000, timeout: 30000 }
  );

  return {
    distributionResult: fifoResult,
    createdRecords,
  };
}

// ------------------------------------------------------------------------------
// Distribution Ledger Queries
// ------------------------------------------------------------------------------

export async function getDistributions(params: {
  itemId?: number;
  farmerId?: number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ distributions: DistributionRecordDTO[]; total: number; page: number; limit: number }> {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.itemId) {
    where.batch = { itemId: params.itemId };
  }

  if (params.farmerId) {
    where.farmerId = params.farmerId;
  }

  if (params.search) {
    where.OR = [
      { purpose: { contains: params.search, mode: "insensitive" } },
      { remarks: { contains: params.search, mode: "insensitive" } },
      { batch: { batchNumber: { contains: params.search, mode: "insensitive" } } },
      { batch: { item: { name: { contains: params.search, mode: "insensitive" } } } },
      { farmer: { firstName: { contains: params.search, mode: "insensitive" } } },
      { farmer: { lastName: { contains: params.search, mode: "insensitive" } } },
      { farmer: { rsbsaNumber: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const [total, dbDists] = await Promise.all([
    prisma.distributionRecord.count({ where }),
    prisma.distributionRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { distributionDate: "desc" },
      include: {
        batch: {
          select: {
            id: true,
            batchNumber: true,
            item: {
              select: {
                id: true,
                itemCode: true,
                name: true,
                category: true,
                unit: true,
              },
            },
          },
        },
        farmer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rsbsaNumber: true,
            barangay: true,
          },
        },
        releasedBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
          },
        },
      },
    }),
  ]);

  const distributions: DistributionRecordDTO[] = dbDists.map((d) => ({
    id: d.id,
    batchId: d.batchId,
    farmerId: d.farmerId,
    barangay: d.barangay,
    requestId: d.requestId,
    quantityDistributed: Number(d.quantityDistributed),
    unit: d.unit,
    distributionDate: d.distributionDate,
    releasedById: d.releasedById,
    purpose: d.purpose,
    remarks: d.remarks,
    batch: d.batch as any,
    farmer: d.farmer as any,
    releasedBy: d.releasedBy as any,
  }));

  return { distributions, total, page, limit };
}
