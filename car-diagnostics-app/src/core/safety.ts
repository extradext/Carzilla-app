/**
 * /src/core/safety.ts
 * LOGIC — IMMUTABLE (per file contracts)
 *
 * Exports:
 *  - evaluateSafety(observations)
 *
 * Rules (do not change without authorization):
 *  - Oil pressure warning
 *  - Overheating warning
 *  - Flashing CEL
 *  - Exhaust smell in cabin
 *  - Brake failure warnings
 *  - Any trigger = safety override (diagnosis continues informationally only)
 */

// TODO: Define Observation type import once models/contracts are finalized.

export function evaluateSafety(observations: unknown): unknown {
  // TODO: Implement per contract. Do not add/alter triggers.
  throw new Error("TODO: evaluateSafety not implemented");
}
