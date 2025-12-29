/**
 * /src/core/clarifiers.ts
 * NON-NEGOTIABLE LOGIC (per file contracts)
 *
 * Purpose:
 * - Define the allowed clarifying questions that may be asked to reduce ambiguity
 *   between hypothesis families.
 *
 * Exports (contract):
 * - List of allowed clarifying questions
 * - Mapping → hypothesis families
 *
 * Rules (contract):
 * - Max 3 clarifiers per run
 * - Binary only (YES/NO) with UNSURE always allowed
 * - Never override measurements
 * - Never override observations
 * - Must SPLIT (differentiate) hypothesis families, not introduce new ones
 *
 * IMPORTANT:
 * - This file contains question definitions only. It does NOT implement selection logic.
 * - No scoring math.
 * - No diagnosis logic.
 * - No safety logic.
 */

import type { HypothesisFamilyId } from "../diagnostics/hypothesisFamilies";
import { HYPOTHESIS_FAMILIES } from "../diagnostics/hypothesisFamilies";
import type { ObservationId } from "./observations";
import { OBSERVATION_IDS } from "./observations";

export const MAX_CLARIFIERS_PER_RUN = 3 as const;

/**
 * Allowed clarifier answers.
 *
 * NOTE: "UNSURE" must always be allowed.
 */
export const CLARIFIER_VALUE = {
  YES: "YES",
  NO: "NO",
  UNSURE: "UNSURE",
} as const;

export type ClarifierValue = (typeof CLARIFIER_VALUE)[keyof typeof CLARIFIER_VALUE];

export type Clarifier = {
  /** Stable key for storage/export. */
  id: string;
  /** User-facing question text (symptom-based wording only; no inferred causes). */
  question: string;
  /**
   * The hypothesis families this clarifier is intended to differentiate.
   * Must include at least 2 families.
   */
  familyIds: HypothesisFamilyId[];
  /**
   * Optional: link to an existing observation ID when the clarifier is effectively
   * asking for the same user-reported input.
   *
   * This helps avoid inventing parallel identifiers.
   */
  observationId?: ObservationId;
  /** Notes for UI copy / implementation guidance. */
  notes?: string[];
};

/**
 * Clarifier catalog.
 *
 * Selection rules (max 3 per run) are handled by the engine.
 * These questions are designed to help both:
 * - No-tool users (pure observation-based)
 * - Tool users (still answerable without requiring measurements)
 */
export const CLARIFIERS: Clarifier[] = [
  {
    id: "battery-vs-alternator-lights-change-with-rpm",
    question: "With the engine running, do the headlights get noticeably brighter when you gently raise RPM?",
    familyIds: [HYPOTHESIS_FAMILIES.BATTERY, HYPOTHESIS_FAMILIES.ALTERNATOR, HYPOTHESIS_FAMILIES.GROUNDS],
    observationId: OBSERVATION_IDS.HEADLIGHTS_DIM,
    notes: [
      "Splits battery vs alternator vs grounds using a symptom-based brightness change.",
      "No measurement required; answer may be UNSURE if conditions are unclear.",
      "Dash lights are support-only unless safety-critical.",
    ],
  },
  {
    id: "battery-vs-grounds-intermittent-power",
    question: "Do you experience intermittent loss of electrical power (e.g., everything goes dead briefly) while driving or key-on?",
    familyIds: [HYPOTHESIS_FAMILIES.GROUNDS, HYPOTHESIS_FAMILIES.BATTERY, HYPOTHESIS_FAMILIES.ALTERNATOR],
    observationId: OBSERVATION_IDS.INTERMITTENT_NO_POWER,
    notes: [
      "Designed to separate connection/ground style symptoms from steady low-voltage symptoms.",
      "No measurement required; do not infer cause from answer.",
    ],
  },
  {
    id: "fuel-vs-ignition-misfire-only-under-load",
    question: "Does the rough running/misfire happen mainly under acceleration or uphill (more than at idle)?",
    familyIds: [HYPOTHESIS_FAMILIES.FUEL, HYPOTHESIS_FAMILIES.IGNITION],
    observationId: OBSERVATION_IDS.ENGINE_MISFIRES_UNDER_LOAD,
    notes: [
      "Splits fuel vs ignition based on load sensitivity.",
      "Symptom-based wording only; no inferred cause.",
    ],
  },
  {
    id: "wont-start-fuel-pump-sound",
    question: "When you turn the key to ON (before cranking), do you hear a brief humming sound from the rear/under the vehicle?",
    familyIds: [HYPOTHESIS_FAMILIES.FUEL, HYPOTHESIS_FAMILIES.GROUNDS, HYPOTHESIS_FAMILIES.IGNITION],
    observationId: OBSERVATION_IDS.FUEL_PUMP_SOUND_NOT_HEARD,
    notes: [
      "Hard-to-hear sound; users may answer UNSURE.",
      "Helps separate fuel-system symptom patterns from electrical/ignition symptom patterns without measurements.",
    ],
  },
  {
    id: "brakes-vs-tires-pull-only-when-braking",
    question: "Does the vehicle pull to one side mainly when braking (rather than during steady driving)?",
    familyIds: [HYPOTHESIS_FAMILIES.BRAKES_HEAT_DRAG, HYPOTHESIS_FAMILIES.TIRES_WHEELS, HYPOTHESIS_FAMILIES.STEERING_HYDRAULIC, HYPOTHESIS_FAMILIES.STEERING_EPS],
    observationId: OBSERVATION_IDS.PULLS_WHEN_BRAKING,
    notes: [
      "Aims to separate braking-related pull from alignment/tire/steering-related pull.",
      "No measurements required.",
    ],
  },
  {
    id: "brakes-vs-tires-wheel-hot",
    question: "After a normal drive, is one wheel noticeably hotter than the others?",
    familyIds: [HYPOTHESIS_FAMILIES.BRAKES_HEAT_DRAG, HYPOTHESIS_FAMILIES.TIRES_WHEELS],
    observationId: OBSERVATION_IDS.WHEEL_HOTTER_THAN_OTHERS,
    notes: [
      "Thermal/mechanical drag indicator; strong but still a soft confirmation.",
      "No measurements required; do not ask user to touch dangerously hot components.",
    ],
  },
  {
    id: "suspension-vs-tires-noise-changes-with-road-surface",
    question: "Does the noise/vibration change noticeably depending on road surface (smooth vs rough) more than it changes with speed?",
    familyIds: [HYPOTHESIS_FAMILIES.SUSPENSION, HYPOTHESIS_FAMILIES.TIRES_WHEELS],
    notes: [
      "Helps separate road-surface sensitivity (suspension/loose components) from speed sensitivity (tires/wheels).",
      "Symptom-based; no inferred cause.",
    ],
  },
  {
    id: "hvac-vs-exhaust-smell-only-when-fan-on",
    question: "Is the smell noticeable mainly when the HVAC blower fan is running (and less noticeable when the fan is off)?",
    familyIds: [HYPOTHESIS_FAMILIES.HVAC_SECONDARY, HYPOTHESIS_FAMILIES.FUEL],
    // Note: Exhaust smell in cabin is a safety-critical OBSERVATION, not a clarifier.
    notes: [
      "Helps differentiate HVAC-related smells from other smell sources.",
      "If the smell is explicitly exhaust in the cabin, record it as the safety-critical observation and apply safety override.",
    ],
  },
];

/**
 * Engine-only contract helpers (no selection/scoring logic here).
 */
export function isValidClarifierValue(value: unknown): value is ClarifierValue {
  return (
    value === CLARIFIER_VALUE.YES ||
    value === CLARIFIER_VALUE.NO ||
    value === CLARIFIER_VALUE.UNSURE
  );
}

export function getClarifierById(id: string): Clarifier | undefined {
  return CLARIFIERS.find((c) => c.id === id);
}
