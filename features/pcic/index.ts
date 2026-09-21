/**
 * Objective 6 Feature Module: Automated PCIC Claim Prioritization & Case Monitoring
 */

export * from "./types";
export * from "./validation/schemas";
export * from "./services/priorityEngine";
export * from "./services/pcicService";

export const PCIC_MODULE_INFO = {
  objective: 6,
  title: "PCIC Crop-Loss Claim Monitoring, Tracking & Prioritization",
  status: "active",
  algorithm: "Deterministic 70/30 Severity & Date Priority Engine",
  statutoryNotice:
    "Advisory municipal prioritization for OMAG case monitoring and adjuster coordination. Does NOT constitute official PCIC claim approval, denial, or indemnity settlement.",
};
