import { VerificationStatusType, AiRecommendationType } from "../types";

export interface ConflictGuardResult {
  conflictDetected: boolean;
  conflictReason: string | null;
  finalSystemStatus: VerificationStatusType;
}

/**
 * Backend Conflict Validation Safeguard
 * 
 * Guarantees that AI advisory output NEVER overrides the authoritative
 * deterministic verification engine.
 * 
 * Rules:
 * 1. If deterministic status is REJECTED or NOT_ACCEPTED and AI recommends ACCEPT:
 *    => Final status remains deterministic REJECTED/NOT_ACCEPTED.
 *    => Conflict is flagged (aiConflict: true).
 * 2. If deterministic status is ACCEPTED and AI recommends REJECT:
 *    => Final status is switched to REVIEW to require municipal staff/head oversight.
 *    => Conflict is flagged (aiConflict: true).
 * 3. In all other cases:
 *    => Final status remains deterministic status.
 */
export function validateAiConflict(
  deterministicStatus: VerificationStatusType,
  aiRecommendation: AiRecommendationType
): ConflictGuardResult {
  // Case 1: Deterministic is REJECTED or NOT_ACCEPTED, but AI says ACCEPT
  if (
    (deterministicStatus === "REJECTED" || deterministicStatus === "NOT_ACCEPTED") &&
    aiRecommendation === "ACCEPT"
  ) {
    return {
      conflictDetected: true,
      conflictReason: `Conflict Detected: AI recommended 'ACCEPT', but authoritative deterministic engine yielded '${deterministicStatus}'. Deterministic result enforced.`,
      finalSystemStatus: deterministicStatus,
    };
  }

  // Case 2: Deterministic is ACCEPTED, but AI recommends REJECT
  if (deterministicStatus === "ACCEPTED" && aiRecommendation === "REJECT") {
    return {
      conflictDetected: true,
      conflictReason: `Conflict Detected: Deterministic engine calculated spatial match ('ACCEPTED'), but AI recommended 'REJECT'. System status escalated to 'REVIEW' for manual oversight.`,
      finalSystemStatus: "REVIEW",
    };
  }

  // Case 3: Concordant or complementary recommendation
  return {
    conflictDetected: false,
    conflictReason: null,
    finalSystemStatus: deterministicStatus,
  };
}
