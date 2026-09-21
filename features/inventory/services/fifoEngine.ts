// ==============================================================================
// Objective 4: Deterministic FIFO Prioritization Engine
// Strictly Algorithmic & Auditable — Zero AI / Machine Learning Dependencies
// Classification: 🟡 PROPOSED SYSTEM DESIGN
// ==============================================================================

import { FifoBatchAllocation, FifoCalculationResult } from "../types";

export interface BatchCandidate {
  id: string;
  batchNumber: string;
  remainingQuantity: number;
  dateReceived: Date | string;
  createdAt: Date | string;
  expiryDate?: Date | string | null;
  viabilityDate?: Date | string | null;
  status: string;
}

/**
 * Deterministically sorts batches according to the First-In, First-Out (FIFO) rule:
 * 1. Earliest dateReceived ascending
 * 2. Earliest createdAt ascending (deterministic tie-breaker)
 * 3. Batch ID alphabetical order (guaranteed deterministic consistency)
 */
export function sortBatchesFifo<T extends { dateReceived: Date | string; createdAt: Date | string; id: string }>(
  batches: T[]
): T[] {
  return [...batches].sort((a, b) => {
    const timeA = new Date(a.dateReceived).getTime();
    const timeB = new Date(b.dateReceived).getTime();

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    const createdA = new Date(a.createdAt).getTime();
    const createdB = new Date(b.createdAt).getTime();

    if (createdA !== createdB) {
      return createdA - createdB;
    }

    return a.id.localeCompare(b.id);
  });
}

/**
 * Evaluates FIFO stock allocation across available batches for a specified item.
 * Guarantees mathematical accuracy and prevents negative inventory.
 */
export function calculateFifoAllocation(
  itemId: number,
  itemName: string,
  batches: BatchCandidate[],
  requestedQuantity: number,
  reorderLevel: number = 10
): FifoCalculationResult {
  if (requestedQuantity <= 0) {
    throw new Error("Requested quantity must be strictly greater than zero");
  }

  // 1. Filter only active, available stock candidates
  const eligibleBatches = batches.filter(
    (b) =>
      b.remainingQuantity > 0 &&
      b.status !== "Depleted" &&
      b.status !== "Archived" &&
      b.status !== "Expired"
  );

  // 2. Sort candidates deterministically via FIFO
  const sortedBatches = sortBatchesFifo(eligibleBatches);

  // 3. Compute total available stock
  const totalAvailableStock = sortedBatches.reduce(
    (sum, b) => sum + Number(b.remainingQuantity),
    0
  );

  const isSufficient = totalAvailableStock >= requestedQuantity;
  const allocations: FifoBatchAllocation[] = [];
  let remainingToAllocate = requestedQuantity;
  let batchesDepletedCount = 0;

  for (const batch of sortedBatches) {
    if (remainingToAllocate <= 0) break;

    const availableBefore = Number(batch.remainingQuantity);
    const quantityAllocated = Math.min(availableBefore, remainingToAllocate);
    const remainingAfter = Math.round((availableBefore - quantityAllocated) * 10000) / 10000;

    let statusAfter = "Available";
    if (remainingAfter === 0) {
      statusAfter = "Depleted";
      batchesDepletedCount++;
    } else if (remainingAfter <= reorderLevel) {
      statusAfter = "Low Stock";
    }

    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      dateReceived: batch.dateReceived,
      expiryDate: batch.expiryDate,
      viabilityDate: batch.viabilityDate,
      availableBefore,
      quantityAllocated,
      remainingAfter,
      statusAfter,
    });

    remainingToAllocate = Math.round((remainingToAllocate - quantityAllocated) * 10000) / 10000;
  }

  const unfulfilledQuantity = Math.max(0, remainingToAllocate);

  return {
    itemId,
    itemName,
    requestedQuantity,
    totalAvailableStock,
    isSufficient,
    allocations,
    unfulfilledQuantity,
    batchesDepletedCount,
  };
}
