/**
 * /src/core/measurementRules.ts
 * NON-NEGOTIABLE LOGIC (per file contracts)
 *
 * Purpose:
 * - Define charging-system measurement evaluation helpers.
 *
 * Rules (authoritative):
 * - Return HIGH when measured charging voltage is ≥ 14.8 V.
 * - Return OK when ≥ 13.2 V and < 14.8 V.
 * - Return LOW when < 13.2 V.
 * - Return UNKNOWN when measurement is missing or invalid.
 *
 * Under-load definition (required for evaluation):
 * - Headlights ON
 * - Blower ON
 * - Rear defroster ON
 *
 * Measurement exception (authoritative):
 * - One-hop only
 * - Applies to direct dependents only (e.g., charging → battery)
 * - Strength is NOT part of input yet; exception logic is a helper accepting `strength`.
 *
 * Constraints:
 * - No scoring logic
 * - No diagnosis logic
 * - No safety logic
 */

import { OBSERVATION_STRENGTH, type ObservationStrength } from "./observations";

export const CHARGING_VOLTAGE_OK_MIN = 13.2 as const;
export const CHARGING_VOLTAGE_HIGH_MIN = 14.8 as const;

export type NormalizedMeasurementResult = "OK" | "LOW" | "HIGH" | "UNKNOWN";

export type ChargingLoadContext = {
  headlightsOn: boolean;
  blowerOn: boolean;
  rearDefrosterOn: boolean;
};

export type ChargingVoltageMeasurement = {
  /** Measured charging voltage (V). */
  voltage: number;
  /** Context under which the measurement was taken. */
  load: ChargingLoadContext;
};

export function isUnderLoad(load: ChargingLoadContext): boolean {
  // Under-load definition is strict per contract.
  return Boolean(load.headlightsOn && load.blowerOn && load.rearDefrosterOn);
}

export function normalizeChargingVoltage(voltage: unknown): NormalizedMeasurementResult {
  if (typeof voltage !== "number" || !Number.isFinite(voltage)) return "UNKNOWN";
  if (voltage >= CHARGING_VOLTAGE_HIGH_MIN) return "HIGH";
  if (voltage >= CHARGING_VOLTAGE_OK_MIN) return "OK";
  return "LOW";
}

/**
 * Evaluate charging voltage measurement.
 *
 * NOTE:
 * - Only evaluates charging system.
 * - Requires under-load context to be true; otherwise returns UNKNOWN (per "required for evaluation").
 */
export function evaluateChargingVoltage(measurement: unknown): NormalizedMeasurementResult {
  const m = measurement as Partial<ChargingVoltageMeasurement> | null;
  if (!m || typeof m !== "object") return "UNKNOWN";

  const load = m.load as ChargingLoadContext | undefined;
  if (!load || !isUnderLoad(load)) return "UNKNOWN";

  return normalizeChargingVoltage(m.voltage);
}

/**
 * Measurement exception helper (authoritative):
 * - Strong only
 * - One-hop only
 * - Direct dependents only
 *
 * This does not apply scoring or diagnosis; it only states whether a measurement may be
 * used as a one-hop exception for a dependent family.
 */
export type MeasurementException = {
  eligible: boolean;
  /** The only allowed dependent targets (one-hop). */
  allowedDependents: string[];
  notes: string[];
};

export function getChargingMeasurementException(strength: unknown): MeasurementException {
  const s = strength as ObservationStrength;
  const isStrong = s === OBSERVATION_STRENGTH.STRONG;

  return {
    eligible: isStrong,
    // One-hop direct dependents only. For charging, the canonical dependent is battery.
    allowedDependents: isStrong ? ["battery"] : [],
    notes: [
      "One-hop only.",
      "Direct dependents only (charging → battery).",
      isStrong ? "Eligible (strong)." : "Not eligible (requires strong).",
    ],
  };
}

/**
 * Backwards-compatible placeholder exported name.
 *
 * NOTE: The project scaffold originally included validateMeasurements(). The authoritative
 * contract now focuses on charging evaluation only, so this function delegates.
 */
export function validateMeasurements(measurements: unknown): {
  charging: NormalizedMeasurementResult;
} {
  return {
    charging: evaluateChargingVoltage(measurements),
  };
}
