/**
 * /src/core/confidence.ts
 * LOGIC — IMMUTABLE (per file contracts)
 *
 * Exports:
 *  - calculateConfidence(scores)
 *
 * Rules:
 *  - Confidence = top ÷ sum(top 3)
 *  - ≥80% = Confident
 *  - 60–79% = Probable
 *  - <60% = UNSURE
 */

export type ConfidenceBand = "CONFIDENT" | "PROBABLE" | "UNSURE";

export function calculateConfidence(scores: unknown): { confidence: number; band: ConfidenceBand } {
  // TODO: Implement per contract.
  throw new Error("TODO: calculateConfidence not implemented");
}
