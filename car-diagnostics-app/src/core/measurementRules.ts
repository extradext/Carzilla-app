/**
 * /src/core/measurementRules.ts
 * LOGIC — IMMUTABLE (per file contracts)
 *
 * Exports:
 *  - Measurement validation helpers
 *
 * Rules:
 *  - Charging voltage ≥ 13.2 V = OK
 *  - Under-load = headlights + blower + defroster
 *
 * Measurement exception:
 *  - Strong only
 *  - One-hop to direct dependents only
 */

// TODO: Add measurement validation helpers per contract.

export const CHARGING_VOLTAGE_OK_MIN = 13.2 as const;

export function validateMeasurements(measurements: unknown): unknown {
  // TODO
  throw new Error("TODO: validateMeasurements not implemented");
}
