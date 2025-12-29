/**
 * /src/diagnostics/hypothesisFamilies.ts
 * DOMAIN DEFINITIONS — STATIC (per file contracts)
 *
 * Canonical families:
 *  - Battery
 *  - Alternator
 *  - Grounds
 *  - Fuel
 *  - Ignition
 *  - Brakes / heat / drag
 *  - Tires / wheels
 *  - Suspension
 *  - Steering (hydraulic vs EPS)
 *  - HVAC (secondary only)
 */

// TODO: Define canonical family IDs and metadata. Keep static.

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
  HVAC_SECONDARY: "hvac_secondary",
} as const;

export type HypothesisFamilyId = (typeof HYPOTHESIS_FAMILIES)[keyof typeof HYPOTHESIS_FAMILIES];
