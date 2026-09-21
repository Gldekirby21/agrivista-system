/**
 * Deterministic PCIC Claim-Prioritization Engine
 * Objective 6: Automated PCIC Claim Prioritization
 * 
 * CRITICAL DIRECTIVES:
 * 1. STRICTLY DETERMINISTIC: Zero AI, Zero LLM (Gemini), Zero Machine Learning.
 * 2. EXPLAINABLE & REPRODUCIBLE: Every score and rank is fully transparent.
 * 3. OMAG-CONFIRMED FACTORS:
 *    - Factor 1: Higher damage severity
 *    - Factor 2: Earlier report date
 *    - Factor 3: Stable deterministic tie-breaker
 * 4. TRUTH CLASSIFICATION:
 *    - Exact formula weighting (70% severity, 30% date) is 🟡 PROPOSED SYSTEM DESIGN.
 *    - Using assessed damage when available is 🟡 PROPOSED SYSTEM DESIGN.
 *    - Categorization (HIGH, MEDIUM, LOW) is 🟡 PROPOSED SYSTEM DESIGN.
 */

import { PriorityLevel } from "@prisma/client";
import { FormulaBreakdown } from "../types";

export interface ClaimPrioritizationInput {
  claimId: string;
  claimNumber: string;
  incidentDate: Date | string;
  reportedDamagePercent: number;
  assessedDamagePercent?: number | null;
}

export interface ClaimPriorityResult {
  claimId: string;
  claimNumber: string;
  score: number;
  priorityLevel: PriorityLevel;
  rankPosition: number;
  formulaBreakdown: FormulaBreakdown;
}

// Configurable weights (🟡 Proposed System Design — pending official OMAG confirmation)
export const PRIORITY_WEIGHTS = {
  DAMAGE_SEVERITY: 0.70,
  DATE_RECENCY_AGING: 0.30,
  ALGORITHM_VERSION: "v1.0-deterministic",
} as const;

/**
 * Calculates deterministic priority metrics for a single claim.
 */
export function computeClaimScore(
  input: ClaimPrioritizationInput,
  referenceDate: Date = new Date()
): {
  score: number;
  priorityLevel: PriorityLevel;
  formulaBreakdown: FormulaBreakdown;
} {
  // 1. Determine applicable damage severity (🟡 Proposed System Design)
  const hasAssessment =
    input.assessedDamagePercent !== undefined &&
    input.assessedDamagePercent !== null &&
    !isNaN(Number(input.assessedDamagePercent));

  const damageBasis: "REPORTED" | "ASSESSED" = hasAssessment ? "ASSESSED" : "REPORTED";
  const rawDamage = hasAssessment ? Number(input.assessedDamagePercent) : Number(input.reportedDamagePercent);
  
  // Clamped damage percentage (0–100)
  const applicableDamagePercent = Math.min(100, Math.max(0, Number(rawDamage.toFixed(2))));
  const severityScore = applicableDamagePercent;

  // 2. Determine report date priority (earlier report date receives higher priority)
  const incidentDateObj = new Date(input.incidentDate);
  const diffMs = referenceDate.getTime() - incidentDateObj.getTime();
  const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  // Date aging score: 0 to 100 (2 points per day elapsed, capped at 100 for >= 50 days)
  const datePriorityScore = Math.min(100, Math.max(0, Number((daysElapsed * 2.0).toFixed(2))));

  // 3. Composite score calculation (🟡 Proposed System Design: 70% severity, 30% date)
  const compositeScore = Number(
    (
      severityScore * PRIORITY_WEIGHTS.DAMAGE_SEVERITY +
      datePriorityScore * PRIORITY_WEIGHTS.DATE_RECENCY_AGING
    ).toFixed(2)
  );

  // 4. Categorical Priority Level (🟡 Proposed System Design)
  let priorityLevel: PriorityLevel;
  if (compositeScore >= 70.0 || applicableDamagePercent >= 80.0) {
    priorityLevel = PriorityLevel.HIGH;
  } else if (compositeScore >= 40.0 || applicableDamagePercent >= 40.0) {
    priorityLevel = PriorityLevel.MEDIUM;
  } else {
    priorityLevel = PriorityLevel.LOW;
  }

  // 5. Deterministic explanation
  const basisLabel = damageBasis === "ASSESSED" ? "Field Assessment" : "Reported Damage";
  const incidentIso = incidentDateObj.toISOString().split("T")[0];
  const explanation = `Priority Score ${compositeScore.toFixed(1)}: ${basisLabel} severity is ${applicableDamagePercent.toFixed(1)}% (Severity Component: ${(severityScore * PRIORITY_WEIGHTS.DAMAGE_SEVERITY).toFixed(1)}). Reported on ${incidentIso} (${daysElapsed} days elapsed, Date Aging Component: ${(datePriorityScore * PRIORITY_WEIGHTS.DATE_RECENCY_AGING).toFixed(1)}). Higher damage and earlier report dates receive priority for OMAG monitoring and coordination.`;

  const formulaBreakdown: FormulaBreakdown = {
    damageBasis,
    applicableDamagePercent,
    reportedDamagePercent: Number(input.reportedDamagePercent),
    assessedDamagePercent: input.assessedDamagePercent ?? null,
    severityScore,
    severityWeight: PRIORITY_WEIGHTS.DAMAGE_SEVERITY,
    incidentDate: incidentIso,
    daysElapsed,
    datePriorityScore,
    dateWeight: PRIORITY_WEIGHTS.DATE_RECENCY_AGING,
    compositeScore,
    algorithmVersion: PRIORITY_WEIGHTS.ALGORITHM_VERSION,
    explanation,
    classificationNotice:
      "🟡 PROPOSED SYSTEM DESIGN — The 70/30 weighting and priority thresholds are analytical tools for OMAG monitoring and case coordination. They do NOT constitute official PCIC claim approval, payout calculation, or statutory adjudication.",
  };

  return {
    score: compositeScore,
    priorityLevel,
    formulaBreakdown,
  };
}

/**
 * Ranks an array of claims deterministically and assigns sequential rank positions (1, 2, 3...).
 * 
 * Tie-breaking rules:
 * 1. Higher compositeScore (DESC)
 * 2. Higher applicableDamagePercent (DESC)
 * 3. Earlier incidentDate (ASC)
 * 4. Stable tie-breaker: claimNumber (ASC)
 */
export function rankClaims(
  claims: ClaimPrioritizationInput[],
  referenceDate: Date = new Date()
): ClaimPriorityResult[] {
  // 1. Calculate individual scores
  const scored = claims.map((c) => {
    const calc = computeClaimScore(c, referenceDate);
    return {
      claimId: c.claimId,
      claimNumber: c.claimNumber,
      incidentDate: new Date(c.incidentDate).getTime(),
      applicableDamagePercent: calc.formulaBreakdown.applicableDamagePercent,
      score: calc.score,
      priorityLevel: calc.priorityLevel,
      formulaBreakdown: calc.formulaBreakdown,
    };
  });

  // 2. Deterministic multi-tier sort
  scored.sort((a, b) => {
    // Tier 1: Composite score DESC
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Tier 2: Applicable damage severity DESC
    if (b.applicableDamagePercent !== a.applicableDamagePercent) {
      return b.applicableDamagePercent - a.applicableDamagePercent;
    }
    // Tier 3: Earlier incident date ASC (earlier is prioritized)
    if (a.incidentDate !== b.incidentDate) {
      return a.incidentDate - b.incidentDate;
    }
    // Tier 4: Stable alphabetical tie-breaker
    return a.claimNumber.localeCompare(b.claimNumber);
  });

  // 3. Assign sequential 1-based rank positions
  return scored.map((item, index) => {
    const rankPosition = index + 1;
    // Prepend rank position to explanation
    const updatedExplanation = `Rank #${rankPosition}: ${item.formulaBreakdown.explanation}`;
    return {
      claimId: item.claimId,
      claimNumber: item.claimNumber,
      score: item.score,
      priorityLevel: item.priorityLevel,
      rankPosition,
      formulaBreakdown: {
        ...item.formulaBreakdown,
        explanation: updatedExplanation,
      },
    };
  });
}
