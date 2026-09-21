import { DeterministicEvidence, AiAssessmentResult, AiAssessmentType, AiRecommendationType } from "../types";
import { GeminiOutputSchema, GeminiOutput } from "../validation/schemas";

export interface GeminiInputFacts {
  evidence: DeterministicEvidence;
  deviceMake?: string | null;
  deviceModel?: string | null;
  fileName?: string | null;
}

/**
 * AI Advisory Interpretation Service (Gemini 2.5 Flash)
 * 
 * Provides an evidence-based advisory explanation and recommendation based
 * STRICTLY on pre-computed deterministic verification facts.
 * 
 * CRITICAL SAFETY BOUNDARY:
 * 1. Zero GPS calculation or alteration performed by AI.
 * 2. Zero PII transmitted.
 * 3. Output is strictly advisory.
 * 4. API failures degrade gracefully without affecting deterministic facts.
 */
export async function generateAiAdvisoryAssessment(
  input: GeminiInputFacts
): Promise<AiAssessmentResult> {
  const { evidence, deviceMake, deviceModel, fileName } = input;
  const modelUsed = "gemini-2.5-flash";
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // Prepare sanitized, non-PII deterministic evidence payload for Gemini
  const sanitizedFacts = {
    gpsAvailable: evidence.gpsAvailable,
    timestampAvailable: evidence.timestampAvailable,
    photoLatitude: evidence.photoLatitude,
    photoLongitude: evidence.photoLongitude,
    registeredLatitude: evidence.registeredLatitude,
    registeredLongitude: evidence.registeredLongitude,
    calculatedDistanceMeters: evidence.calculatedDistanceMeters,
    configuredThresholdMeters: evidence.thresholdMeters,
    gpsComparisonStatus: evidence.gpsStatus,
    timestampStatus: evidence.timestampStatus,
    deterministicVerificationStatus: evidence.deterministicStatus,
    failureReasonCode: evidence.failureReasonCode,
    deviceInformation: {
      make: deviceMake || "Not specified",
      model: deviceModel || "Not specified",
    },
    fileName: fileName ? fileName.replace(/[^\w.-]/g, "_") : "submitted_photo.jpg",
  };

  const systemInstruction = `
You are an AI advisory assistant for the OMAG Polomolok municipal agricultural verification system.
Your role is to provide a concise, evidence-based interpretation of the pre-computed deterministic photo verification results.

STRICT OPERATIONAL RULES:
1. You MUST NOT calculate or recalculate GPS distance. The backend calculation is authoritative.
2. You MUST NOT alter coordinates, timestamps, or distances.
3. You MUST NOT invent or assume missing EXIF metadata.
4. Your recommendation is strictly ADVISORY for municipal oversight officers (OMAG_STAFF and OMAG_HEAD).
5. You MUST NOT claim official PCIC insurance approval or statutory policy decisions.
6. If the deterministic status is REJECTED or NOT_ACCEPTED, you MUST NOT recommend ACCEPT.
7. Return ONLY a valid JSON object matching the requested schema.
`.trim();

  const prompt = `
Deterministic Verification Evidence:
${JSON.stringify(sanitizedFacts, null, 2)}

Provide your structured advisory assessment in JSON format:
{
  "assessment": "CONSISTENT" | "INCONSISTENT" | "INSUFFICIENT_EVIDENCE",
  "recommendation": "ACCEPT" | "REVIEW" | "REJECT",
  "reviewRequired": boolean,
  "explanation": "Concise factual summary explaining the verification outcome.",
  "auditNote": "Brief note for the municipal immutable audit trail.",
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
`.trim();

  // Candidate models supported by Google Generative AI in priority order
  const candidateModels = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-2.5-flash-lite", "gemini-2.5-flash"];

  // If Gemini API Key is available, invoke Gemini via REST API
  if (apiKey) {
    for (const modelUsed of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelUsed}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(3000),
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemInstruction}\n\n${prompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate) {
            try {
              const rawJson = JSON.parse(candidate);
              const validated = GeminiOutputSchema.parse(rawJson);

              return {
                assessment: validated.assessment as AiAssessmentType,
                recommendation: validated.recommendation as AiRecommendationType,
                reviewRequired: validated.reviewRequired,
                explanation: validated.explanation,
                auditNote: validated.auditNote,
                confidence: validated.confidence || "HIGH",
                modelUsed,
                assessedAt: new Date(),
                rawResponse: rawJson,
                conflictDetected: false,
                finalSystemStatus: evidence.deterministicStatus,
              };
            } catch (parseErr) {
              console.warn(`Gemini (${modelUsed}) output validation failed:`, parseErr);
            }
          }
        } else if (response.status === 400 || response.status === 401 || response.status === 403) {
          // Fast-fail if API key is invalid or rejected; do not retry other models with the same broken key
          console.warn(`Gemini API key rejected (${response.status}): falling back to rule-based advisory.`);
          break;
        }
      } catch (networkErr) {
        console.warn(`Gemini (${modelUsed}) network error or timeout:`, networkErr);
      }
    }
  }

  // Safe Deterministic Rule-Based Advisory Fallback
  // (Ensures zero service disruption when Gemini API key is not configured or during offline testing)
  return createDeterministicFallbackAssessment(evidence, deviceMake, deviceModel);
}

/**
 * Creates a deterministic, rule-based advisory interpretation when external AI is unavailable.
 */
export function createDeterministicFallbackAssessment(
  evidence: DeterministicEvidence,
  deviceMake?: string | null,
  deviceModel?: string | null
): AiAssessmentResult {
  let assessment: AiAssessmentType = "CONSISTENT";
  let recommendation: AiRecommendationType = "ACCEPT";
  let reviewRequired = false;
  let explanation = "";
  let auditNote = "";

  const deviceStr = deviceMake || deviceModel ? ` captured via ${[deviceMake, deviceModel].filter(Boolean).join(" ")}` : "";

  if (evidence.deterministicStatus === "ACCEPTED") {
    assessment = "CONSISTENT";
    recommendation = "ACCEPT";
    reviewRequired = false;
    explanation = `Photo EXIF coordinates are within configured parcel tolerance (${evidence.calculatedDistanceMeters?.toFixed(1)}m <= ${evidence.thresholdMeters}m)${deviceStr}. Timestamp verified.`;
    auditNote = `AI Advisory: Consistent photo metadata verified within ${evidence.thresholdMeters}m tolerance.`;
  } else if (evidence.deterministicStatus === "REVIEW") {
    assessment = "INCONSISTENT";
    recommendation = "REVIEW";
    reviewRequired = true;
    explanation = `Photo GPS location is verified within tolerance, but EXIF metadata contains anomalies (e.g. missing timestamp). Manual inspection recommended.`;
    auditNote = `AI Advisory: Review required due to metadata warnings (${evidence.failureReasonCode || "TIMESTAMP_MISSING"}).`;
  } else if (evidence.gpsStatus === "GPS_MISSING" || evidence.gpsStatus === "PARCEL_GPS_MISSING") {
    assessment = "INSUFFICIENT_EVIDENCE";
    recommendation = "REJECT";
    reviewRequired = true;
    explanation = `Insufficient geospatial metadata: ${evidence.verificationNotes}`;
    auditNote = `AI Advisory: Geolocation verification not accepted due to missing reference coordinates.`;
  } else {
    // OUTSIDE_THRESHOLD / REJECTED
    assessment = "INCONSISTENT";
    recommendation = "REJECT";
    reviewRequired = true;
    explanation = `Photo GPS location (${evidence.calculatedDistanceMeters?.toFixed(1)}m) exceeds allowable system tolerance (${evidence.thresholdMeters}m) from registered parcel centroid.`;
    auditNote = `AI Advisory: Spatial mismatch detected (${evidence.calculatedDistanceMeters?.toFixed(1)}m from parcel).`;
  }

  return {
    assessment,
    recommendation,
    reviewRequired,
    explanation,
    auditNote,
    confidence: "ADVISORY_FALLBACK",
    modelUsed: "gemini-2.5-flash-advisory-engine",
    assessedAt: new Date(),
    rawResponse: {
      generatedBy: "Deterministic Advisory Engine (Safety Fallback)",
      sourceStatus: evidence.deterministicStatus,
    },
    conflictDetected: false,
    finalSystemStatus: evidence.deterministicStatus,
  };
}
