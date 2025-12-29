/**
 * /src/diagnostics/hypothesisFamilies.ts
 * DOMAIN DEFINITIONS — STATIC
 *
 * Rules:
 * - Define canonical hypothesis family IDs and labels only.
 * - No logic, no scoring, no measurement logic, no safety rules.
 * - Families must align with existing observation domains.
 *
 * Required families (minimum, authoritative):
 * - battery
 * - alternator
 * - grounds
 * - fuel
 * - ignition
 * - brakes_heat_drag
 * - tires_wheels
 * - suspension
 * - steering_hydraulic
 * - steering_eps
 * - hvac
 * - exhaust
 */

/**
 * Canonical family IDs.
 *
 * NOTE:
 * - Keep values stable; these may be persisted/exported.
 * - `HVAC_SECONDARY` is retained as a legacy alias used by earlier scaffolding.
 *   TODO: Migrate usage to `HVAC` when allowed to modify other files.
 */
export const HYPOTHESIS_FAMILIES = {
  BATTERY: "battery",
  ALTERNATOR: "alternator",
  GROUNDS: "grounds",
  FUEL: "fuel",
  IGNITION: "ignition",
  BRAKES_HEAT_DRAG: "brakes_heat_drag",
  TIRES_WHEELS: "tires_wheels",
  SUSPENSION: "suspension",
  STEERING_HYDRAULIC: "steering_hydraulic",
  STEERING_EPS: "steering_eps",
  HVAC: "hvac",
  EXHAUST: "exhaust",

  // Legacy alias (do not remove without updating imports/usages elsewhere).
  HVAC_SECONDARY: "hvac_secondary",
} as const;

export type HypothesisFamilyId = (typeof HYPOTHESIS_FAMILIES)[keyof typeof HYPOTHESIS_FAMILIES];

/**
 * Human-friendly labels.
 */
export const HYPOTHESIS_FAMILY_LABELS: Record<HypothesisFamilyId, string> = {
  [HYPOTHESIS_FAMILIES.BATTERY]: "Battery",
  [HYPOTHESIS_FAMILIES.ALTERNATOR]: "Alternator",
  [HYPOTHESIS_FAMILIES.GROUNDS]: "Grounds / connections",
  [HYPOTHESIS_FAMILIES.FUEL]: "Fuel delivery",
  [HYPOTHESIS_FAMILIES.IGNITION]: "Ignition",
  [HYPOTHESIS_FAMILIES.BRAKES_HEAT_DRAG]: "Brakes / heat / drag",
  [HYPOTHESIS_FAMILIES.TIRES_WHEELS]: "Tires / wheels",
  [HYPOTHESIS_FAMILIES.SUSPENSION]: "Suspension",
  [HYPOTHESIS_FAMILIES.STEERING_HYDRAULIC]: "Steering (hydraulic)",
  [HYPOTHESIS_FAMILIES.STEERING_EPS]: "Steering (EPS)",
  [HYPOTHESIS_FAMILIES.HVAC]: "HVAC",
  [HYPOTHESIS_FAMILIES.EXHAUST]: "Exhaust",

  // Legacy label.
  [HYPOTHESIS_FAMILIES.HVAC_SECONDARY]: "HVAC (legacy alias)",
};
