/**
 * /src/core/observations.ts
 * LOGIC — IMMUTABLE (per file contracts)
 *
 * Exports:
 *  - Canonical observation IDs
 *  - Strength: Weak (6), Medium (13), Strong (26)
 *
 * Rules:
 *  - Dash lights = support only unless critical
 *  - Skip/Unsure must always be allowed
 */

// TODO: Define canonical observation IDs and strength constants per contract.
// NOTE: Intentionally unimplemented.

export const OBSERVATION_STRENGTH = {
  WEAK: 6,
  MEDIUM: 13,
  STRONG: 26,
} as const;

// TODO: Export canonical observation IDs.
export const OBSERVATION_IDS = {
  // e.g. OIL_PRESSURE_WARNING: "oil_pressure_warning",
} as const;

export type ObservationStrength = (typeof OBSERVATION_STRENGTH)[keyof typeof OBSERVATION_STRENGTH];
