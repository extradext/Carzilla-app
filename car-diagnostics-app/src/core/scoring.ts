/**
 * /src/core/scoring.ts
 * LOGIC — IMMUTABLE (per file contracts)
 *
 * Exports:
 *  - scoreHypotheses(observations, measurements)
 *
 * Rules (do not change without authorization):
 *  - Weights: 6 / 13 / 26
 *  - Cross-family multiplier: 0.02
 *  - Medium-only caps
 *  - Conflict dampening
 *  - No-tools behavior is implicit (absence of measurements)
 */

export function scoreHypotheses(observations: unknown, measurements?: unknown): unknown {
  // TODO: Implement per contract. No invented weights/behavior.
  throw new Error("TODO: scoreHypotheses not implemented");
}
