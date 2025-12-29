/**
 * /src/diagnostics/rules.ts
 * DOMAIN DEFINITIONS — STATIC
 *
 * Rules:
 * - Declarative mappings only.
 * - Map observationId → primary family + optional secondary families.
 * - No logic, no scoring math, no safety rules, no measurements.
 * - Use only observation IDs defined in /src/core/observations.ts.
 * - Use only family IDs defined in /src/diagnostics/hypothesisFamilies.ts.
 * - Secondary families must be explicit (for cross-family multiplier use).
 * - Do NOT invent new observations or families.
 * - If an observation truly spans domains, list secondaries conservatively.
 *
 * Deliverable:
 * - Export a single canonical mapping consumed by scoring.ts: `DIAGNOSTIC_RULES.observationFamilies`
 */

import type { ObservationId } from "../core/observations";
import { OBSERVATION_IDS } from "../core/observations";
import type { HypothesisFamilyId } from "./hypothesisFamilies";
import { HYPOTHESIS_FAMILIES } from "./hypothesisFamilies";

export type ObservationFamilyRule = {
  primary: HypothesisFamilyId;
  secondary?: HypothesisFamilyId[];
};

/**
 * Canonical mapping: observation → family routing.
 *
 * NOTE:
 * - This is intentionally conservative and symptom-based.
 * - Observations not listed here will simply have no scoring impact.
 * - Safety-critical observations may be omitted if no appropriate family exists.
 */
export const observationFamilies: Partial<Record<ObservationId, ObservationFamilyRule>> = {
  // ---------------------------------------------------------------------------
  // SAFETY-CRITICAL (conservative)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.BRAKE_FAILURE_WARNING]: {
    primary: HYPOTHESIS_FAMILIES.BRAKES_HEAT_DRAG,
  },
  [OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN]: {
    primary: HYPOTHESIS_FAMILIES.EXHAUST,
    secondary: [HYPOTHESIS_FAMILIES.HVAC],
  },
  // NOTE: OIL_PRESSURE_WARNING and OVERHEATING_WARNING are intentionally unmapped
  // because there is no dedicated canonical family for those domains yet.

  // ---------------------------------------------------------------------------
  // BATTERY / STARTING
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY]: {
    primary: HYPOTHESIS_FAMILIES.BATTERY,
    secondary: [HYPOTHESIS_FAMILIES.GROUNDS],
  },
  [OBSERVATION_IDS.RAPID_CLICKING_ON_START]: {
    primary: HYPOTHESIS_FAMILIES.BATTERY,
    secondary: [HYPOTHESIS_FAMILIES.GROUNDS],
  },
  [OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK]: {
    primary: HYPOTHESIS_FAMILIES.BATTERY,
    secondary: [HYPOTHESIS_FAMILIES.GROUNDS],
  },
  [OBSERVATION_IDS.NO_CLICK_NO_CRANK]: {
    primary: HYPOTHESIS_FAMILIES.BATTERY,
    secondary: [HYPOTHESIS_FAMILIES.GROUNDS],
  },
  [OBSERVATION_IDS.JUMP_START_HELPS]: {
    primary: HYPOTHESIS_FAMILIES.BATTERY,
    secondary: [HYPOTHESIS_FAMILIES.GROUNDS],
  },
  [OBSERVATION_IDS.BATTERY_LIGHT_ON]: {
    primary: HYPOTHESIS_FAMILIES.ALTERNATOR,
    secondary: [HYPOTHESIS_FAMILIES.BATTERY, HYPOTHESIS_FAMILIES.GROUNDS],
  },
  [OBSERVATION_IDS.TERMINALS_CORRODED]: {
    primary: HYPOTHESIS_FAMILIES.GROUNDS,
    secondary: [HYPOTHESIS_FAMILIES.BATTERY],
  },

  // ---------------------------------------------------------------------------
  // ELECTRICAL
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.HEADLIGHTS_DIM]: {
    primary: HYPOTHESIS_FAMILIES.BATTERY,
    secondary: [HYPOTHESIS_FAMILIES.ALTERNATOR],
  },
  [OBSERVATION_IDS.LIGHTS_FLICKER]: {
    primary: HYPOTHESIS_FAMILIES.GROUNDS,
    secondary: [HYPOTHESIS_FAMILIES.ALTERNATOR],
  },
  [OBSERVATION_IDS.DASH_RESETS_WHEN_CRANKING]: {
    primary: HYPOTHESIS_FAMILIES.BATTERY,
    secondary: [HYPOTHESIS_FAMILIES.GROUNDS],
  },
  [OBSERVATION_IDS.INTERMITTENT_NO_POWER]: {
    primary: HYPOTHESIS_FAMILIES.GROUNDS,
    secondary: [HYPOTHESIS_FAMILIES.BATTERY, HYPOTHESIS_FAMILIES.ALTERNATOR],
  },
  [OBSERVATION_IDS.RELAY_CLICKING_HEARD]: {
    primary: HYPOTHESIS_FAMILIES.GROUNDS,
    secondary: [HYPOTHESIS_FAMILIES.BATTERY],
  },
  [OBSERVATION_IDS.RADIO_RESETS]: {
    primary: HYPOTHESIS_FAMILIES.GROUNDS,
    secondary: [HYPOTHESIS_FAMILIES.BATTERY],
  },

  // ---------------------------------------------------------------------------
  // FUEL
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.LONG_CRANK_BEFORE_START]: {
    primary: HYPOTHESIS_FAMILIES.FUEL,
    secondary: [HYPOTHESIS_FAMILIES.IGNITION],
  },
  [OBSERVATION_IDS.STARTS_THEN_STALLS]: {
    primary: HYPOTHESIS_FAMILIES.FUEL,
    secondary: [HYPOTHESIS_FAMILIES.IGNITION],
  },
  [OBSERVATION_IDS.STALLS_ON_ACCELERATION]: {
    primary: HYPOTHESIS_FAMILIES.FUEL,
    secondary: [HYPOTHESIS_FAMILIES.IGNITION],
  },
  [OBSERVATION_IDS.LOSS_OF_POWER_UPHILL]: {
    primary: HYPOTHESIS_FAMILIES.FUEL,
    secondary: [HYPOTHESIS_FAMILIES.IGNITION],
  },
  [OBSERVATION_IDS.FUEL_PUMP_SOUND_NOT_HEARD]: {
    primary: HYPOTHESIS_FAMILIES.FUEL,
    secondary: [HYPOTHESIS_FAMILIES.GROUNDS],
  },
  [OBSERVATION_IDS.RAW_FUEL_SMELL_OUTSIDE]: {
    primary: HYPOTHESIS_FAMILIES.FUEL,
  },

  // ---------------------------------------------------------------------------
  // IGNITION
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.ENGINE_MISFIRES_AT_IDLE]: {
    primary: HYPOTHESIS_FAMILIES.IGNITION,
    secondary: [HYPOTHESIS_FAMILIES.FUEL],
  },
  [OBSERVATION_IDS.ENGINE_MISFIRES_UNDER_LOAD]: {
    primary: HYPOTHESIS_FAMILIES.IGNITION,
    secondary: [HYPOTHESIS_FAMILIES.FUEL],
  },
  [OBSERVATION_IDS.BACKFIRE_POP_NOISE]: {
    primary: HYPOTHESIS_FAMILIES.IGNITION,
    secondary: [HYPOTHESIS_FAMILIES.FUEL],
  },
  [OBSERVATION_IDS.ROUGH_IDLE]: {
    primary: HYPOTHESIS_FAMILIES.IGNITION,
    secondary: [HYPOTHESIS_FAMILIES.FUEL],
  },

  // ---------------------------------------------------------------------------
  // BRAKES / HEAT / DRAG
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.BRAKE_PEDAL_SOFT]: {
    primary: HYPOTHESIS_FAMILIES.BRAKES_HEAT_DRAG,
  },
  [OBSERVATION_IDS.BRAKE_PEDAL_PULSATION]: {
    primary: HYPOTHESIS_FAMILIES.BRAKES_HEAT_DRAG,
    secondary: [HYPOTHESIS_FAMILIES.TIRES_WHEELS],
  },
  [OBSERVATION_IDS.GRINDING_NOISE_WHEN_BRAKING]: {
    primary: HYPOTHESIS_FAMILIES.BRAKES_HEAT_DRAG,
  },
  [OBSERVATION_IDS.PULLS_WHEN_BRAKING]: {
    primary: HYPOTHESIS_FAMILIES.BRAKES_HEAT_DRAG,
    secondary: [HYPOTHESIS_FAMILIES.TIRES_WHEELS],
  },
  [OBSERVATION_IDS.WHEEL_HOTTER_THAN_OTHERS]: {
    primary: HYPOTHESIS_FAMILIES.BRAKES_HEAT_DRAG,
    secondary: [HYPOTHESIS_FAMILIES.TIRES_WHEELS],
  },
  [OBSERVATION_IDS.BURNING_SMELL_NEAR_WHEEL]: {
    primary: HYPOTHESIS_FAMILIES.BRAKES_HEAT_DRAG,
  },

  // ---------------------------------------------------------------------------
  // TIRES / WHEELS
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.VIBRATION_AT_SPEED]: {
    primary: HYPOTHESIS_FAMILIES.TIRES_WHEELS,
    secondary: [HYPOTHESIS_FAMILIES.SUSPENSION],
  },
  [OBSERVATION_IDS.HUMMING_GROWL_CHANGES_WITH_SPEED]: {
    primary: HYPOTHESIS_FAMILIES.TIRES_WHEELS,
  },
  [OBSERVATION_IDS.STEERING_WHEEL_SHAKE]: {
    primary: HYPOTHESIS_FAMILIES.TIRES_WHEELS,
    secondary: [HYPOTHESIS_FAMILIES.SUSPENSION],
  },
  [OBSERVATION_IDS.UNEVEN_TIRE_WEAR_VISIBLE]: {
    primary: HYPOTHESIS_FAMILIES.TIRES_WHEELS,
  },
  [OBSERVATION_IDS.TIRE_PRESSURE_LIGHT_ON]: {
    primary: HYPOTHESIS_FAMILIES.TIRES_WHEELS,
  },

  // ---------------------------------------------------------------------------
  // SUSPENSION
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.CLUNK_OVER_BUMPS]: {
    primary: HYPOTHESIS_FAMILIES.SUSPENSION,
  },
  [OBSERVATION_IDS.EXCESSIVE_BOUNCING]: {
    primary: HYPOTHESIS_FAMILIES.SUSPENSION,
  },
  [OBSERVATION_IDS.VEHICLE_SITS_LOW_ON_ONE_SIDE]: {
    primary: HYPOTHESIS_FAMILIES.SUSPENSION,
  },
  [OBSERVATION_IDS.RATTLE_OVER_ROUGH_ROAD]: {
    primary: HYPOTHESIS_FAMILIES.SUSPENSION,
  },

  // ---------------------------------------------------------------------------
  // STEERING (hydraulic vs EPS are kept conservative)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.STEERING_FEELS_HEAVY]: {
    primary: HYPOTHESIS_FAMILIES.STEERING_HYDRAULIC,
    secondary: [HYPOTHESIS_FAMILIES.STEERING_EPS],
  },
  [OBSERVATION_IDS.STEERING_WANDERS]: {
    primary: HYPOTHESIS_FAMILIES.STEERING_HYDRAULIC,
    secondary: [HYPOTHESIS_FAMILIES.TIRES_WHEELS, HYPOTHESIS_FAMILIES.SUSPENSION],
  },
  [OBSERVATION_IDS.PULLS_TO_ONE_SIDE]: {
    primary: HYPOTHESIS_FAMILIES.STEERING_HYDRAULIC,
    secondary: [HYPOTHESIS_FAMILIES.TIRES_WHEELS],
  },
  [OBSERVATION_IDS.WHINE_WHEN_TURNING]: {
    primary: HYPOTHESIS_FAMILIES.STEERING_HYDRAULIC,
  },
  [OBSERVATION_IDS.POWER_STEERING_WARNING_LIGHT]: {
    primary: HYPOTHESIS_FAMILIES.STEERING_EPS,
    secondary: [HYPOTHESIS_FAMILIES.STEERING_HYDRAULIC],
  },

  // ---------------------------------------------------------------------------
  // HVAC
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.NO_HEAT]: {
    primary: HYPOTHESIS_FAMILIES.HVAC,
  },
  [OBSERVATION_IDS.NO_AC]: {
    primary: HYPOTHESIS_FAMILIES.HVAC,
  },
  [OBSERVATION_IDS.BLOWER_NOT_WORKING]: {
    primary: HYPOTHESIS_FAMILIES.HVAC,
  },
  [OBSERVATION_IDS.AIRFLOW_WEAK]: {
    primary: HYPOTHESIS_FAMILIES.HVAC,
  },
  [OBSERVATION_IDS.MUSTY_SMELL_FROM_VENTS]: {
    primary: HYPOTHESIS_FAMILIES.HVAC,
  },

  // ---------------------------------------------------------------------------
  // SMELLS
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.SWEET_SMELL]: {
    primary: HYPOTHESIS_FAMILIES.HVAC,
  },
  [OBSERVATION_IDS.BURNING_OIL_SMELL]: {
    primary: HYPOTHESIS_FAMILIES.EXHAUST,
  },
  [OBSERVATION_IDS.BURNT_ELECTRICAL_SMELL]: {
    primary: HYPOTHESIS_FAMILIES.GROUNDS,
  },
  [OBSERVATION_IDS.ROTTEN_EGG_SMELL]: {
    primary: HYPOTHESIS_FAMILIES.EXHAUST,
  },
};

export const DIAGNOSTIC_RULES = {
  observationFamilies,
} as const;
