// ==============================================================================
// Objective 4: Barangay Resource Distribution Request & FIFO Execution Service
// 🟡 PROPOSED SYSTEM DESIGN: Multi-Tier Approval Gate for Priority-Driven Aid
// ==============================================================================

import { prisma } from "@/lib/database/prisma";
import { UserSession } from "@/types";
import {
  CreateDistributionRequestSchema,
  ReviewDistributionRequestSchema,
  QueryDistributionRequestSchema,
} from "../validation/schemas";
import { sortBatchesFifo } from "./fifoEngine";
import {
  DistributionRequestDTO,
  DistributionRecordDTO,
  DistributionRequestStatusType,
} from "../types";
import { z } from "zod";

/**
 * Creates a new Barangay Resource Distribution Request.
 * Saves in PENDING status.
 * DOES NOT deduct inventory. DOES NOT execute FIFO.
 */
export async function createDistributionRequest(
  payload: z.infer<typeof CreateDistributionRequestSchema>,
  session: UserSession
): Promise<DistributionRequestDTO> {
  const validated = CreateDistributionRequestSchema.parse(payload);

  // 1. Verify item exists and is active
  const item = await prisma.inventoryItem.findUnique({
    where: { id: validated.itemId },
  });

  if (!item || !item.isActive) {
    throw new Error("Selected inventory item does not exist or is inactive.");
  }

  // 2. Generate unique request identifier (e.g. BRD-2026-XXXX)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const requestNumber = `BRD-${dateStr}-${randomSuffix}`;

  // 3. Persist request in PENDING status
  const request = await prisma.distributionRequest.create({
    data: {
      requestNumber,
      barangay: validated.barangay,
      itemId: validated.itemId,
      requestedQuantity: validated.requestedQuantity,
      unit: validated.unit || item.unit,
      resourceType: validated.resourceType || item.category,
      remarks: validated.remarks || null,
      status: "PENDING",
      requestedById: session.id,
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
      requestedBy: {
        select: {
          id: true,
          fullName: true,
          username: true,
          role: true,
        },
      },
    },
  });

  // 4. Record municipal audit log
  await prisma.auditLog.create({
    data: {
      userId: session.id,
      roleSnapshot: session.role,
      action: "DISTRIBUTION_REQUEST_CREATE",
      module: "INVENTORY",
      recordId: request.id,
      newValues: {
        requestNumber: request.requestNumber,
        barangay: request.barangay,
        itemId: request.itemId,
        requestedQuantity: request.requestedQuantity,
        status: "PENDING",
      },
    },
  });

  return {
    id: request.id,
    requestNumber: request.requestNumber,
    barangay: request.barangay,
    itemId: request.itemId,
    requestedQuantity: Number(request.requestedQuantity),
    unit: request.unit,
    resourceType: request.resourceType,
    remarks: request.remarks,
    status: request.status as DistributionRequestStatusType,
    requestedById: request.requestedById,
    requestedAt: request.requestedAt,
    item: request.item,
    requestedBy: request.requestedBy as any,
  };
}

/**
 * Retrieves paginated distribution requests with optional filters.
 */
export async function getDistributionRequests(
  params: z.infer<typeof QueryDistributionRequestSchema>
): Promise<{
  requests: DistributionRequestDTO[];
  total: number;
  page: number;
  limit: number;
}> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  if (params.barangay && params.barangay !== "ALL") {
    where.barangay = params.barangay;
  }

  if (params.itemId) {
    where.itemId = params.itemId;
  }

  if (params.search) {
    where.OR = [
      { requestNumber: { contains: params.search, mode: "insensitive" } },
      { barangay: { contains: params.search, mode: "insensitive" } },
      { remarks: { contains: params.search, mode: "insensitive" } },
      { item: { name: { contains: params.search, mode: "insensitive" } } },
      { requestedBy: { fullName: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const [total, dbRequests] = await Promise.all([
    prisma.distributionRequest.count({ where }),
    prisma.distributionRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { requestedAt: "desc" },
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
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
          },
        },
        distributedBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
          },
        },
        distributions: {
          include: {
            batch: {
              select: {
                id: true,
                batchNumber: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const requests: DistributionRequestDTO[] = dbRequests.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    barangay: r.barangay,
    itemId: r.itemId,
    requestedQuantity: Number(r.requestedQuantity),
    unit: r.unit,
    resourceType: r.resourceType,
    remarks: r.remarks,
    status: r.status as DistributionRequestStatusType,
    requestedById: r.requestedById,
    requestedAt: r.requestedAt,
    approvedById: r.approvedById,
    approvedAt: r.approvedAt,
    approvalRemarks: r.approvalRemarks,
    distributedAt: r.distributedAt,
    distributedById: r.distributedById,
    item: r.item,
    requestedBy: r.requestedBy as any,
    approvedBy: r.approvedBy as any,
    distributedBy: r.distributedBy as any,
    distributions: r.distributions.map((d) => ({
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
    })),
  }));

  return { requests, total, page, limit };
}

/**
 * Retrieves a single distribution request by ID.
 */
export async function getDistributionRequestById(
  id: string
): Promise<DistributionRequestDTO | null> {
  const r = await prisma.distributionRequest.findUnique({
    where: { id },
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
      requestedBy: {
        select: {
          id: true,
          fullName: true,
          username: true,
          role: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          fullName: true,
          username: true,
          role: true,
        },
      },
      distributedBy: {
        select: {
          id: true,
          fullName: true,
          username: true,
          role: true,
        },
      },
      distributions: {
        include: {
          batch: {
            select: {
              id: true,
              batchNumber: true,
            },
          },
        },
      },
    },
  });

  if (!r) return null;

  return {
    id: r.id,
    requestNumber: r.requestNumber,
    barangay: r.barangay,
    itemId: r.itemId,
    requestedQuantity: Number(r.requestedQuantity),
    unit: r.unit,
    resourceType: r.resourceType,
    remarks: r.remarks,
    status: r.status as DistributionRequestStatusType,
    requestedById: r.requestedById,
    requestedAt: r.requestedAt,
    approvedById: r.approvedById,
    approvedAt: r.approvedAt,
    approvalRemarks: r.approvalRemarks,
    distributedAt: r.distributedAt,
    distributedById: r.distributedById,
    item: r.item,
    requestedBy: r.requestedBy as any,
    approvedBy: r.approvedBy as any,
    distributedBy: r.distributedBy as any,
    distributions: r.distributions.map((d) => ({
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
    })),
  };
}

/**
 * Reviews a pending distribution request (OMAG_HEAD only).
 * Sets status to APPROVED or REJECTED.
 * DOES NOT deduct inventory.
 */
export async function reviewDistributionRequest(
  requestId: string,
  payload: z.infer<typeof ReviewDistributionRequestSchema>,
  session: UserSession
): Promise<DistributionRequestDTO> {
  if (session.role !== "OMAG_HEAD") {
    throw new Error("Only Municipal Head (OMAG_HEAD) is authorized to review and approve distribution requests.");
  }

  const validated = ReviewDistributionRequestSchema.parse(payload);

  const existing = await prisma.distributionRequest.findUnique({
    where: { id: requestId },
  });

  if (!existing) {
    throw new Error(`Distribution request with ID ${requestId} not found.`);
  }

  if (existing.status !== "PENDING") {
    throw new Error(
      `Cannot review request #${existing.requestNumber}. Current status is ${existing.status} (must be PENDING).`
    );
  }

  const updated = await prisma.distributionRequest.update({
    where: { id: requestId },
    data: {
      status: validated.decision,
      approvedById: session.id,
      approvedAt: new Date(),
      approvalRemarks: validated.remarks || null,
    },
    include: {
      item: true,
      requestedBy: true,
      approvedBy: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.id,
      roleSnapshot: session.role,
      action: "DISTRIBUTION_REQUEST_REVIEW",
      module: "INVENTORY",
      recordId: updated.id,
      previousValues: { status: existing.status },
      newValues: {
        status: updated.status,
        decision: validated.decision,
        remarks: validated.remarks,
      },
    },
  });

  return {
    id: updated.id,
    requestNumber: updated.requestNumber,
    barangay: updated.barangay,
    itemId: updated.itemId,
    requestedQuantity: Number(updated.requestedQuantity),
    unit: updated.unit,
    resourceType: updated.resourceType,
    remarks: updated.remarks,
    status: updated.status as DistributionRequestStatusType,
    requestedById: updated.requestedById,
    requestedAt: updated.requestedAt,
    approvedById: updated.approvedById,
    approvedAt: updated.approvedAt,
    approvalRemarks: updated.approvalRemarks,
    item: updated.item,
    requestedBy: updated.requestedBy as any,
    approvedBy: updated.approvedBy as any,
  };
}

/**
 * Executes FIFO Distribution for an APPROVED Distribution Request.
 * Atomically deducts inventory across eligible batches and creates DistributionRecords.
 * Updates request status to DISTRIBUTED.
 * Strictly blocks if PENDING, REJECTED, or already DISTRIBUTED.
 */
export async function executeApprovedDistribution(
  requestId: string,
  session: UserSession
): Promise<{
  request: DistributionRequestDTO;
  createdRecords: DistributionRecordDTO[];
}> {
  // Pre-transaction validation
  const existing = await prisma.distributionRequest.findUnique({
    where: { id: requestId },
    include: { item: true },
  });

  if (!existing) {
    throw new Error(`Distribution request with ID ${requestId} not found.`);
  }

  if (existing.status !== "APPROVED") {
    throw new Error(
      `Distribution execution blocked: Request #${existing.requestNumber} has status "${existing.status}". Only "APPROVED" requests can be distributed.`
    );
  }

  const requestedQuantity = Number(existing.requestedQuantity);
  if (requestedQuantity <= 0) {
    throw new Error("Requested quantity must be strictly greater than zero.");
  }

  const createdRecords: DistributionRecordDTO[] = [];
  let updatedRequest: any;

  // Execute in atomic database transaction
  await prisma.$transaction(async (tx) => {
    // 1. Re-check request status under transaction to prevent race conditions
    const txRequest = await tx.distributionRequest.findUnique({
      where: { id: requestId },
    });

    if (!txRequest || txRequest.status !== "APPROVED") {
      throw new Error(
        `Distribution execution blocked: Request #${existing.requestNumber} is no longer in APPROVED status.`
      );
    }

    // 2. Fetch candidate batches for the item
    const now = new Date();
    const candidateBatches = await tx.inventoryBatch.findMany({
      where: {
        itemId: existing.itemId,
        remainingQuantity: { gt: 0 },
        status: { notIn: ["Depleted", "Archived", "Expired"] },
      },
    });

    // 3. Filter out expired or past-viability batches
    const eligibleBatches = candidateBatches.filter((b) => {
      if (b.expiryDate && new Date(b.expiryDate) <= now) return false;
      if (b.viabilityDate && new Date(b.viabilityDate) <= now) return false;
      return Number(b.remainingQuantity) > 0;
    });

    // 4. Sort eligible batches deterministically via FIFO
    const sortedBatches = sortBatchesFifo(eligibleBatches);

    // 5. Check total available eligible stock
    const totalEligibleStock = sortedBatches.reduce(
      (sum, b) => sum + Number(b.remainingQuantity),
      0
    );

    if (totalEligibleStock < requestedQuantity) {
      throw new Error(
        `Insufficient eligible inventory for this distribution request. Requested: ${requestedQuantity} ${existing.unit}, but only ${totalEligibleStock} ${existing.unit} available across eligible non-expired batches.`
      );
    }

    // 6. Allocate stock across FIFO batches
    let remainingToAllocate = requestedQuantity;
    const reorderLevel = existing.item?.reorderLevel ?? 10;

    for (const batch of sortedBatches) {
      if (remainingToAllocate <= 0) break;

      const availableBefore = Number(batch.remainingQuantity);
      const allocatedQty = Math.min(availableBefore, remainingToAllocate);
      const remainingAfter = Math.round((availableBefore - allocatedQty) * 10000) / 10000;

      let statusAfter = "Available";
      if (remainingAfter === 0) {
        statusAfter = "Depleted";
      } else if (remainingAfter <= reorderLevel) {
        statusAfter = "Low Stock";
      }

      // Deduct from batch
      await tx.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          remainingQuantity: remainingAfter,
          status: statusAfter,
        },
      });

      // Create traceable DistributionRecord
      const dist = await tx.distributionRecord.create({
        data: {
          batchId: batch.id,
          farmerId: null, // Pool distribution to barangay
          barangay: existing.barangay,
          requestId: existing.id,
          quantityDistributed: allocatedQty,
          unit: existing.unit,
          distributionDate: new Date(),
          releasedById: session.id,
          purpose: `Barangay Distribution — ${existing.barangay}`,
          remarks: existing.remarks || `Distribution executed for Request #${existing.requestNumber}`,
        },
      });

      createdRecords.push({
        id: dist.id,
        batchId: dist.batchId,
        farmerId: dist.farmerId,
        barangay: dist.barangay,
        requestId: dist.requestId,
        quantityDistributed: Number(dist.quantityDistributed),
        unit: dist.unit,
        distributionDate: dist.distributionDate,
        releasedById: dist.releasedById,
        purpose: dist.purpose,
        remarks: dist.remarks,
        batch: {
          id: batch.id,
          batchNumber: batch.batchNumber,
          item: existing.item as any,
        },
      });

      remainingToAllocate = Math.round((remainingToAllocate - allocatedQty) * 10000) / 10000;
    }

    // 7. Update DistributionRequest to DISTRIBUTED
    updatedRequest = await tx.distributionRequest.update({
      where: { id: requestId },
      data: {
        status: "DISTRIBUTED",
        distributedAt: new Date(),
        distributedById: session.id,
      },
      include: {
        item: true,
        requestedBy: true,
        approvedBy: true,
        distributedBy: true,
      },
    });

    // 8. Immutable Municipal Audit Log
    await tx.auditLog.create({
      data: {
        userId: session.id,
        roleSnapshot: session.role,
        action: "DISTRIBUTION_EXECUTE",
        module: "INVENTORY",
        recordId: existing.id,
        previousValues: {
          status: "APPROVED",
        },
        newValues: {
          status: "DISTRIBUTED",
          requestNumber: existing.requestNumber,
          barangay: existing.barangay,
          requestedQuantity,
          batchAllocationsCount: createdRecords.length,
          allocations: createdRecords.map((r) => ({
            batchId: r.batchId,
            batchNumber: r.batch?.batchNumber,
            quantity: r.quantityDistributed,
          })),
        },
      },
    });
  }, {
    maxWait: 15000,
    timeout: 30000,
  });

  return {
    request: {
      id: updatedRequest.id,
      requestNumber: updatedRequest.requestNumber,
      barangay: updatedRequest.barangay,
      itemId: updatedRequest.itemId,
      requestedQuantity: Number(updatedRequest.requestedQuantity),
      unit: updatedRequest.unit,
      resourceType: updatedRequest.resourceType,
      remarks: updatedRequest.remarks,
      status: updatedRequest.status as DistributionRequestStatusType,
      requestedById: updatedRequest.requestedById,
      requestedAt: updatedRequest.requestedAt,
      approvedById: updatedRequest.approvedById,
      approvedAt: updatedRequest.approvedAt,
      approvalRemarks: updatedRequest.approvalRemarks,
      distributedAt: updatedRequest.distributedAt,
      distributedById: updatedRequest.distributedById,
      item: updatedRequest.item,
      requestedBy: updatedRequest.requestedBy as any,
      approvedBy: updatedRequest.approvedBy as any,
      distributedBy: updatedRequest.distributedBy as any,
    },
    createdRecords,
  };
}
