/**
 * /src/core/safety.ts
 * NON-NEGOTIABLE LOGIC (per file contracts)
 *
 * Purpose:
 * - Evaluate safety triggers from observations.
 * - Outputs hard-stop / warning flags only.
 *
 * Exports (contract):
 * - evaluateSafety(observations)
 *
 * Rules (contract; do not change without authorization):
 * - Oil pressure warning
 * - Overheating warning
 * - Flashing CEL
 * - Exhaust smell in cabin
 * - Brake failure warnings
 * - Any trigger = safety override (diagnosis continues informationally only)
 */

import {
  normalizeObservationValue,
  OBSERVATION_IDS,
  OBSERVATION_VALUE,
  type ObservationResponse,
} from "./observations";

export type SafetyTriggerId =
  | typeof OBSERVATION_IDS.OIL_PRESSURE_WARNING
  | typeof OBSERVATION_IDS.OVERHEATING_WARNING
  | typeof OBSERVATION_IDS.FLASHING_CEL
  | typeof OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN
  | typeof OBSERVATION_IDS.BRAKE_FAILURE_WARNING;

export type SafetyEvaluation = {
  /** True if any safety trigger is present. */
  safetyOverride: boolean;
  /** True if the situation is a hard-stop (stop driving / immediate attention). */
  hardStop: boolean;
  /** Warning flags (non-blocking, but safetyOverride may still be true). */
  warnings: SafetyTriggerId[];
  /** Human-readable notes for UI to display. */
  notes: string[];
};

function coerceObservationResponses(input: unknown): ObservationResponse[] {
  // Accept either an array of ObservationResponse, or a map keyed by id.
  if (Array.isArray(input)) return input as ObservationResponse[];
  if (input && typeof input === "object") {
    const maybeMap = input as Record<string, unknown>;
    return Object.entries(maybeMap).map(([id, v]) => ({ id: id as any, value: v as any }));
  }
  return [];
}

function hasYes(observations: ObservationResponse[], id: string): boolean {
  const found = observations.find((o) => o.id === id);
  if (!found) return false;
  return normalizeObservationValue(found.value) === OBSERVATION_VALUE.YES;
}

/**
 * Evaluate safety triggers.
 *
 * IMPORTANT:
 * - This function does not score or rank hypotheses.
 * - Dash lights are generally support-only, but the critical triggers in this file override.
 * - Strong observations are never treated as hard truth; safety triggers depend on presence (YES) only.
 */
export function evaluateSafety(observations: unknown): SafetyEvaluation {
  const obs = coerceObservationResponses(observations);

  const warnings: SafetyTriggerId[] = [];
  const notes: string[] = [];

  if (hasYes(obs, OBSERVATION_IDS.OIL_PRESSURE_WARNING)) {
    warnings.push(OBSERVATION_IDS.OIL_PRESSURE_WARNING);
    notes.push("Oil pressure warning detected. Stop driving and investigate immediately.");
  }

  if (hasYes(obs, OBSERVATION_IDS.OVERHEATING_WARNING)) {
    warnings.push(OBSERVATION_IDS.OVERHEATING_WARNING);
    notes.push("Overheating warning detected. Stop and allow engine to cool; investigate cooling system.");
  }

  if (hasYes(obs, OBSERVATION_IDS.FLASHING_CEL)) {
    warnings.push(OBSERVATION_IDS.FLASHING_CEL);
    notes.push("Flashing check engine light detected. Avoid driving; risk of severe engine damage.");
  }

  if (hasYes(obs, OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN)) {
    warnings.push(OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN);
    notes.push("Exhaust smell in cabin detected. Ventilate and stop driving; potential carbon monoxide risk.");
  }

  if (hasYes(obs, OBSERVATION_IDS.BRAKE_FAILURE_WARNING)) {
    warnings.push(OBSERVATION_IDS.BRAKE_FAILURE_WARNING);
    notes.push("Brake failure warning detected. Do not drive; tow for inspection.");
  }

  const safetyOverride = warnings.length > 0;

  // Contract says: any trigger = safety override. It does not distinguish severity.
  // We treat all contract triggers as hard-stop because they are safety-critical.
  // TODO: If the spec introduces separate "warning-only" triggers, update this mapping (without adding new triggers).
  const hardStop = safetyOverride;

  return {
    safetyOverride,
    hardStop,
    warnings,
    notes,
  };
}
