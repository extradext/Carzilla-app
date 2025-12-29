/**
 * /src/core/confidence.ts
 * NON-NEGOTIABLE LOGIC (per file contracts)
 *
 * Purpose:
 * - Convert family scores into a normalized confidence value and a confidence band.
 *
 * Rules (authoritative):
 * - Confidence = top_score ÷ sum_of_top_3_scores
 * - If fewer than 3 non-zero families exist, sum only what exists
 * - Classification:
 *   - ≥ 0.80  → "CONFIDENT"
 *   - 0.60–0.79 → "PROBABLE"
 *   - < 0.60 → "UNSURE"
 *
 * Constraints:
 * - Deterministic, pure functions only
 * - No scoring logic
 * - No safety logic
 * - No measurements logic
 */

export type ConfidenceBand = "CONFIDENT" | "PROBABLE" | "UNSURE";

export type ConfidenceResult = {
  confidence: number;
  band: ConfidenceBand;
};

function toNumericScores(scores: unknown): number[] {
  if (!scores || typeof scores !== "object") return [];
  const values = Object.values(scores as Record<string, unknown>)
    .map((v) => (typeof v === "number" && Number.isFinite(v) ? v : 0))
    // Confidence operates on magnitude of support; negative/contradictory families should not boost confidence.
    .map((v) => Math.max(0, v))
    .filter((v) => v > 0);
  return values;
}

export function getConfidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.8) return "CONFIDENT";
  if (confidence >= 0.6) return "PROBABLE";
  return "UNSURE";
}

export function calculateConfidence(scores: unknown): ConfidenceResult {
  const values = toNumericScores(scores);
  if (values.length === 0) {
    return { confidence: 0, band: "UNSURE" };
  }

  const sorted = [...values].sort((a, b) => b - a);
  const top = sorted[0] ?? 0;
  const denom = (sorted[0] ?? 0) + (sorted[1] ?? 0) + (sorted[2] ?? 0);

  // Contract: If fewer than 3 non-zero families exist, sum only what exists.
  // The above formula already does that by using 0 defaults.
  const confidence = denom > 0 ? top / denom : 0;

  return {
    confidence,
    band: getConfidenceBand(confidence),
  };
}
