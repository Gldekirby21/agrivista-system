// ==============================================================================
// Objective 4 Feature Barrel: FIFO Seed and Fertilizer Inventory Management
// ==============================================================================

export * from "./types";
export * from "./validation/schemas";
export * from "./services/fifoEngine";
export * from "./services/inventoryService";

export const INVENTORY_MODULE_INFO = {
  objective: 4,
  title: "FIFO-Based Fertilizer and Seeds Inventory Management",
  status: "ACTIVE",
  classification: "🟡 PROPOSED SYSTEM DESIGN",
};
