/**
 * /src/engine/contextEvaluator.ts
 * ORCHESTRATION/GLUE (per file contracts)
 *
 * Handles Known Issues panel:
 *  - / ± / – classification
 *  - No effect on ranking
 *  - Cosmetic confidence ±5% max
 */

export type KnownIssueClassification = "PLUS" | "NEUTRAL" | "MINUS";

export type ContextEvaluation = {
  // TODO
};

export function evaluateContext(input: unknown): ContextEvaluation {
  // TODO: Implement glue-only behavior; do not affect ranking.
  throw new Error("TODO: evaluateContext not implemented");
}
