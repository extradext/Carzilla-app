/**
 * /src/core/observations.ts
 * NON-NEGOTIABLE LOGIC (per file contracts)
 *
 * Purpose:
 * - Canonical observation identifiers and their reliability classification.
 * - Shared allowed values for observation capture.
 *
 * Exports (contract):
 * - Canonical observation IDs
 * - Strength: Weak (6), Medium (13), Strong (26)
 * - Allowed values
 *
 * Rules (contract):
 * - Dash lights = support only unless critical
 * - “Skip / Unsure” allowed everywhere
 * - Strong observations are soft confirmations, never hard truth
 */

/**
 * Strength weights are authoritative inputs into scoring.ts later.
 * IMPORTANT: This file defines the constants only; no scoring math is implemented here.
 */
export const OBSERVATION_STRENGTH = {
  WEAK: 6,
  MEDIUM: 13,
  STRONG: 26,
} as const;

export type ObservationStrength = (typeof OBSERVATION_STRENGTH)[keyof typeof OBSERVATION_STRENGTH];
export type ObservationReliabilityClass = keyof typeof OBSERVATION_STRENGTH;

/**
 * Allowed values for observation capture.
 *
 * NOTE:
 * - UI may represent “Skip” as absence of value; core should accept it.
 * - “Unsure” must always be a valid explicit value.
 */
export const OBSERVATION_VALUE = {
  YES: "YES",
  NO: "NO",
  UNSURE: "UNSURE",
  SKIP: "SKIP",
} as const;

export type ObservationValue = (typeof OBSERVATION_VALUE)[keyof typeof OBSERVATION_VALUE];

/**
 * Canonical observation IDs.
 *
 * IMPORTANT:
 * This contract does not enumerate every possible observation in v1.
 * We define the safety-critical canonical IDs explicitly (used by safety.ts).
 * Add additional IDs only when they are authoritatively specified.
 */
export const OBSERVATION_IDS = {
  // Safety-critical / gating
  OIL_PRESSURE_WARNING: "oil_pressure_warning",
  OVERHEATING_WARNING: "overheating_warning",
  FLASHING_CEL: "flashing_cel",
  EXHAUST_SMELL_IN_CABIN: "exhaust_smell_in_cabin",
  BRAKE_FAILURE_WARNING: "brake_failure_warning",

  // TODO: Add additional canonical observation IDs once defined in the spec.
} as const;

export type ObservationId = (typeof OBSERVATION_IDS)[keyof typeof OBSERVATION_IDS];

/**
 * Metadata for observations.
 *
 * NOTE:
 * - Dash lights are support-only unless they are one of the safety-critical triggers.
 * - Strong is a reliability signal only; it must never be treated as "hard truth".
 */
export type ObservationDefinition = {
  id: ObservationId;
  label: string;
  notes: string[];
  defaultStrength: ObservationStrength;
  isDashLight: boolean;
  isSafetyCritical: boolean;
};

export const OBSERVATION_DEFINITIONS: Record<ObservationId, ObservationDefinition> = {
  [OBSERVATION_IDS.OIL_PRESSURE_WARNING]: {
    id: OBSERVATION_IDS.OIL_PRESSURE_WARNING,
    label: "Oil pressure warning",
    notes: [
      "Safety-critical.",
      "If present, safety override applies (diagnosis may continue informationally only).",
      "Dash light is support-only unless it is this critical warning.",
    ],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: true,
    isSafetyCritical: true,
  },
  [OBSERVATION_IDS.OVERHEATING_WARNING]: {
    id: OBSERVATION_IDS.OVERHEATING_WARNING,
    label: "Overheating warning",
    notes: [
      "Safety-critical.",
      "If present, safety override applies (diagnosis may continue informationally only).",
      "Dash light is support-only unless it is this critical warning.",
    ],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: true,
    isSafetyCritical: true,
  },
  [OBSERVATION_IDS.FLASHING_CEL]: {
    id: OBSERVATION_IDS.FLASHING_CEL,
    label: "Flashing check engine light (CEL)",
    notes: [
      "Safety-critical.",
      "A flashing CEL is treated as a safety override trigger.",
      "Dash light is support-only unless it is this critical warning.",
    ],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: true,
    isSafetyCritical: true,
  },
  [OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN]: {
    id: OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN,
    label: "Exhaust smell in cabin",
    notes: [
      "Safety-critical.",
      "If present, safety override applies (diagnosis may continue informationally only).",
    ],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: true,
  },
  [OBSERVATION_IDS.BRAKE_FAILURE_WARNING]: {
    id: OBSERVATION_IDS.BRAKE_FAILURE_WARNING,
    label: "Brake failure warning",
    notes: [
      "Safety-critical.",
      "If present, safety override applies (diagnosis may continue informationally only).",
      "Dash light is support-only unless it is this critical warning.",
    ],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: true,
    isSafetyCritical: true,
  },
};

export type ObservationResponse = {
  id: ObservationId;
  /**
   * Allowed values: YES/NO/UNSURE/SKIP.
   * UI may omit the value entirely to represent Skip.
   */
  value?: ObservationValue;
  /**
   * Reliability class captured at input time (e.g., Weak/Medium/Strong).
   * This must remain a soft signal (never treated as hard truth).
   */
  strength?: ObservationStrength;
  /** Optional freeform note captured by UI (no scoring behavior here). */
  note?: string;
};

export function normalizeObservationValue(value: unknown): ObservationValue {
  if (value === undefined || value === null) return OBSERVATION_VALUE.SKIP;
  if (value === true) return OBSERVATION_VALUE.YES;
  if (value === false) return OBSERVATION_VALUE.NO;
  if (typeof value === "string") {
    const v = value.toUpperCase();
    if (v === OBSERVATION_VALUE.YES) return OBSERVATION_VALUE.YES;
    if (v === OBSERVATION_VALUE.NO) return OBSERVATION_VALUE.NO;
    if (v === OBSERVATION_VALUE.UNSURE) return OBSERVATION_VALUE.UNSURE;
    if (v === OBSERVATION_VALUE.SKIP) return OBSERVATION_VALUE.SKIP;
  }
  // TODO: If additional value encodings are introduced, extend mapping here.
  return OBSERVATION_VALUE.SKIP;
}

export function isObservationId(id: unknown): id is ObservationId {
  return typeof id === "string" && (Object.values(OBSERVATION_IDS) as string[]).includes(id);
}
