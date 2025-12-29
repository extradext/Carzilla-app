/**
 * /src/core/observations.ts
 * NON-NEGOTIABLE LOGIC (per file contracts)
 *
 * This file is the canonical observation library.
 *
 * Requirements (authoritative):
 * - Declarative only: IDs, labels, reliability class (weak/medium/strong), notes
 * - NO scoring logic
 * - NO diagnosis logic
 * - NO safety logic
 * - Retain existing safety-critical observation IDs unchanged and authoritative
 * - “Skip / Unsure” must be supported everywhere
 * - Dash lights are support-only unless critical
 * - Strong observations are soft confirmations, never hard truth
 *
 * IMPORTANT (this revision):
 * - The non-safety observation catalog below is **DRAFT / PROVISIONAL**.
 *   Each non-safety observation includes an explicit DRAFT note.
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
 * Safety-critical IDs are authoritative and must not change.
 * All other IDs in this file are DRAFT/PROVISIONAL.
 */
export const OBSERVATION_IDS = {
  // ---------------------------------------------------------------------------
  // SAFETY-CRITICAL (AUTHORITATIVE)
  // ---------------------------------------------------------------------------
  OIL_PRESSURE_WARNING: "oil_pressure_warning",
  OVERHEATING_WARNING: "overheating_warning",
  FLASHING_CEL: "flashing_cel",
  EXHAUST_SMELL_IN_CABIN: "exhaust_smell_in_cabin",
  BRAKE_FAILURE_WARNING: "brake_failure_warning",

  // ---------------------------------------------------------------------------
  // BATTERY / STARTING (DRAFT)
  // ---------------------------------------------------------------------------
  ENGINE_CRANKS_SLOWLY: "engine_cranks_slowly",
  RAPID_CLICKING_ON_START: "rapid_clicking_on_start",
  SINGLE_CLICK_NO_CRANK: "single_click_no_crank",
  NO_CLICK_NO_CRANK: "no_click_no_crank",
  JUMP_START_HELPS: "jump_start_helps",
  BATTERY_LIGHT_ON: "battery_light_on",
  TERMINALS_CORRODED: "terminals_corroded",

  // ---------------------------------------------------------------------------
  // ELECTRICAL (DRAFT)
  // ---------------------------------------------------------------------------
  HEADLIGHTS_DIM: "headlights_dim",
  LIGHTS_FLICKER: "lights_flicker",
  DASH_RESETS_WHEN_CRANKING: "dash_resets_when_cranking",
  INTERMITTENT_NO_POWER: "intermittent_no_power",
  RELAY_CLICKING_HEARD: "relay_clicking_heard",
  RADIO_RESETS: "radio_resets",

  // ---------------------------------------------------------------------------
  // FUEL (DRAFT)
  // ---------------------------------------------------------------------------
  LONG_CRANK_BEFORE_START: "long_crank_before_start",
  STARTS_THEN_STALLS: "starts_then_stalls",
  STALLS_ON_ACCELERATION: "stalls_on_acceleration",
  LOSS_OF_POWER_UPHILL: "loss_of_power_uphill",
  FUEL_PUMP_SOUND_NOT_HEARD: "fuel_pump_sound_not_heard",
  RAW_FUEL_SMELL_OUTSIDE: "raw_fuel_smell_outside",

  // ---------------------------------------------------------------------------
  // IGNITION / MISFIRE SYMPTOMS (DRAFT)
  // ---------------------------------------------------------------------------
  ENGINE_MISFIRES_AT_IDLE: "engine_misfires_at_idle",
  ENGINE_MISFIRES_UNDER_LOAD: "engine_misfires_under_load",
  BACKFIRE_POP_NOISE: "backfire_pop_noise",
  ROUGH_IDLE: "rough_idle",

  // ---------------------------------------------------------------------------
  // BRAKES / HEAT / DRAG (DRAFT)
  // ---------------------------------------------------------------------------
  BRAKE_PEDAL_SOFT: "brake_pedal_soft",
  BRAKE_PEDAL_PULSATION: "brake_pedal_pulsation",
  GRINDING_NOISE_WHEN_BRAKING: "grinding_noise_when_braking",
  PULLS_WHEN_BRAKING: "pulls_when_braking",
  WHEEL_HOTTER_THAN_OTHERS: "wheel_hotter_than_others",
  BURNING_SMELL_NEAR_WHEEL: "burning_smell_near_wheel",

  // ---------------------------------------------------------------------------
  // TIRES / WHEELS (DRAFT)
  // ---------------------------------------------------------------------------
  VIBRATION_AT_SPEED: "vibration_at_speed",
  HUMMING_GROWL_CHANGES_WITH_SPEED: "humming_growl_changes_with_speed",
  STEERING_WHEEL_SHAKE: "steering_wheel_shake",
  UNEVEN_TIRE_WEAR_VISIBLE: "uneven_tire_wear_visible",
  TIRE_PRESSURE_LIGHT_ON: "tire_pressure_light_on",

  // ---------------------------------------------------------------------------
  // SUSPENSION (DRAFT)
  // ---------------------------------------------------------------------------
  CLUNK_OVER_BUMPS: "clunk_over_bumps",
  EXCESSIVE_BOUNCING: "excessive_bouncing",
  VEHICLE_SITS_LOW_ON_ONE_SIDE: "vehicle_sits_low_on_one_side",
  RATTLE_OVER_ROUGH_ROAD: "rattle_over_rough_road",

  // ---------------------------------------------------------------------------
  // STEERING (HYDRAULIC + EPS) (DRAFT)
  // ---------------------------------------------------------------------------
  STEERING_FEELS_HEAVY: "steering_feels_heavy",
  STEERING_WANDERS: "steering_wanders",
  PULLS_TO_ONE_SIDE: "pulls_to_one_side",
  WHINE_WHEN_TURNING: "whine_when_turning",
  POWER_STEERING_WARNING_LIGHT: "power_steering_warning_light",

  // ---------------------------------------------------------------------------
  // HVAC (DRAFT)
  // ---------------------------------------------------------------------------
  NO_HEAT: "no_heat",
  NO_AC: "no_ac",
  BLOWER_NOT_WORKING: "blower_not_working",
  AIRFLOW_WEAK: "airflow_weak",
  MUSTY_SMELL_FROM_VENTS: "musty_smell_from_vents",

  // ---------------------------------------------------------------------------
  // SMELLS (GENERAL) (DRAFT)
  // ---------------------------------------------------------------------------
  SWEET_SMELL: "sweet_smell",
  BURNING_OIL_SMELL: "burning_oil_smell",
  BURNT_ELECTRICAL_SMELL: "burnt_electrical_smell",
  ROTTEN_EGG_SMELL: "rotten_egg_smell",
} as const;

export type ObservationId = (typeof OBSERVATION_IDS)[keyof typeof OBSERVATION_IDS];

export type ObservationDomain =
  | "SAFETY"
  | "BATTERY"
  | "ELECTRICAL"
  | "FUEL"
  | "IGNITION"
  | "BRAKES_HEAT_DRAG"
  | "TIRES_WHEELS"
  | "SUSPENSION"
  | "STEERING"
  | "HVAC"
  | "SMELLS";

/**
 * Observation definition.
 *
 * IMPORTANT:
 * - Dash lights are support-only unless safety-critical.
 * - Strong is a reliability signal only; it must never be treated as "hard truth".
 */
export type ObservationDefinition = {
  id: ObservationId;
  label: string;
  domain: ObservationDomain;
  notes: string[];
  /**
   * Default strength is a reliability classification for the observation itself.
   * It does not perform any scoring.
   */
  defaultStrength: ObservationStrength;
  isDashLight: boolean;
  isSafetyCritical: boolean;
};

const DRAFT_NOTE = "DRAFT/PROVISIONAL: canonical ID/label/notes may change when the authoritative catalog is provided.";

const STRONG_SOFT_NOTE = "Strong reliability signal only; still a soft confirmation (never hard truth).";
const DASH_LIGHT_SUPPORT_NOTE = "Dash light is support-only unless it is a safety-critical trigger.";

export const OBSERVATION_DEFINITIONS: Record<ObservationId, ObservationDefinition> = {
  // ---------------------------------------------------------------------------
  // SAFETY-CRITICAL (AUTHORITATIVE)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.OIL_PRESSURE_WARNING]: {
    id: OBSERVATION_IDS.OIL_PRESSURE_WARNING,
    label: "Oil pressure warning",
    domain: "SAFETY",
    notes: [
      "Safety-critical.",
      "If present, safety override applies (diagnosis may continue informationally only).",
      DASH_LIGHT_SUPPORT_NOTE,
      STRONG_SOFT_NOTE,
    ],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: true,
    isSafetyCritical: true,
  },
  [OBSERVATION_IDS.OVERHEATING_WARNING]: {
    id: OBSERVATION_IDS.OVERHEATING_WARNING,
    label: "Overheating warning",
    domain: "SAFETY",
    notes: [
      "Safety-critical.",
      "If present, safety override applies (diagnosis may continue informationally only).",
      DASH_LIGHT_SUPPORT_NOTE,
      STRONG_SOFT_NOTE,
    ],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: true,
    isSafetyCritical: true,
  },
  [OBSERVATION_IDS.FLASHING_CEL]: {
    id: OBSERVATION_IDS.FLASHING_CEL,
    label: "Flashing check engine light (CEL)",
    domain: "SAFETY",
    notes: [
      "Safety-critical.",
      "A flashing CEL is a safety override trigger.",
      DASH_LIGHT_SUPPORT_NOTE,
      STRONG_SOFT_NOTE,
    ],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: true,
    isSafetyCritical: true,
  },
  [OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN]: {
    id: OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN,
    label: "Exhaust smell in cabin",
    domain: "SAFETY",
    notes: [
      "Safety-critical.",
      "If present, safety override applies (diagnosis may continue informationally only).",
      STRONG_SOFT_NOTE,
    ],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: true,
  },
  [OBSERVATION_IDS.BRAKE_FAILURE_WARNING]: {
    id: OBSERVATION_IDS.BRAKE_FAILURE_WARNING,
    label: "Brake failure warning",
    domain: "SAFETY",
    notes: [
      "Safety-critical.",
      "If present, safety override applies (diagnosis may continue informationally only).",
      DASH_LIGHT_SUPPORT_NOTE,
      STRONG_SOFT_NOTE,
    ],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: true,
    isSafetyCritical: true,
  },

  // ---------------------------------------------------------------------------
  // BATTERY / STARTING (DRAFT)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY]: {
    id: OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY,
    label: "Engine cranks slowly",
    domain: "BATTERY",
    notes: [DRAFT_NOTE, STRONG_SOFT_NOTE],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.RAPID_CLICKING_ON_START]: {
    id: OBSERVATION_IDS.RAPID_CLICKING_ON_START,
    label: "Rapid clicking sound when trying to start",
    domain: "BATTERY",
    notes: [DRAFT_NOTE, "Sound perception varies; treat as weak-to-medium in practice."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK]: {
    id: OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK,
    label: "Single click when trying to start (no crank)",
    domain: "BATTERY",
    notes: [DRAFT_NOTE, "Sound perception varies; treat as medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.NO_CLICK_NO_CRANK]: {
    id: OBSERVATION_IDS.NO_CLICK_NO_CRANK,
    label: "No click and no crank when trying to start",
    domain: "BATTERY",
    notes: [DRAFT_NOTE, STRONG_SOFT_NOTE],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.JUMP_START_HELPS]: {
    id: OBSERVATION_IDS.JUMP_START_HELPS,
    label: "Jump start helps the vehicle start",
    domain: "BATTERY",
    notes: [DRAFT_NOTE, STRONG_SOFT_NOTE],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.BATTERY_LIGHT_ON]: {
    id: OBSERVATION_IDS.BATTERY_LIGHT_ON,
    label: "Battery/charging warning light is on (not flashing)",
    domain: "BATTERY",
    notes: [DRAFT_NOTE, DASH_LIGHT_SUPPORT_NOTE],
    defaultStrength: OBSERVATION_STRENGTH.WEAK,
    isDashLight: true,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.TERMINALS_CORRODED]: {
    id: OBSERVATION_IDS.TERMINALS_CORRODED,
    label: "Battery terminals look corroded",
    domain: "BATTERY",
    notes: [DRAFT_NOTE, "Visual observation; may be incomplete without cleaning/inspection."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },

  // ---------------------------------------------------------------------------
  // ELECTRICAL (DRAFT)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.HEADLIGHTS_DIM]: {
    id: OBSERVATION_IDS.HEADLIGHTS_DIM,
    label: "Headlights are dim",
    domain: "ELECTRICAL",
    notes: [
      DRAFT_NOTE,
      "Hard-to-perceive in daylight; treat as weak reliability.",
      "Compare to normal brightness if possible.",
    ],
    defaultStrength: OBSERVATION_STRENGTH.WEAK,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.LIGHTS_FLICKER]: {
    id: OBSERVATION_IDS.LIGHTS_FLICKER,
    label: "Lights flicker",
    domain: "ELECTRICAL",
    notes: [DRAFT_NOTE, "Intermittent and subjective; treat as weak reliability."],
    defaultStrength: OBSERVATION_STRENGTH.WEAK,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.DASH_RESETS_WHEN_CRANKING]: {
    id: OBSERVATION_IDS.DASH_RESETS_WHEN_CRANKING,
    label: "Dashboard/radio resets when trying to start",
    domain: "ELECTRICAL",
    notes: [DRAFT_NOTE, STRONG_SOFT_NOTE],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.INTERMITTENT_NO_POWER]: {
    id: OBSERVATION_IDS.INTERMITTENT_NO_POWER,
    label: "Intermittent loss of electrical power",
    domain: "ELECTRICAL",
    notes: [DRAFT_NOTE, "Intermittent symptoms can be hard to reproduce; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.RELAY_CLICKING_HEARD]: {
    id: OBSERVATION_IDS.RELAY_CLICKING_HEARD,
    label: "Clicking sound from relay/fuse area",
    domain: "ELECTRICAL",
    notes: [DRAFT_NOTE, "Hard-to-hear sound; treat as weak reliability."],
    defaultStrength: OBSERVATION_STRENGTH.WEAK,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.RADIO_RESETS]: {
    id: OBSERVATION_IDS.RADIO_RESETS,
    label: "Radio/infotainment resets unexpectedly",
    domain: "ELECTRICAL",
    notes: [DRAFT_NOTE, "Can be subtle and intermittent; treat as weak reliability."],
    defaultStrength: OBSERVATION_STRENGTH.WEAK,
    isDashLight: false,
    isSafetyCritical: false,
  },

  // ---------------------------------------------------------------------------
  // FUEL (DRAFT)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.LONG_CRANK_BEFORE_START]: {
    id: OBSERVATION_IDS.LONG_CRANK_BEFORE_START,
    label: "Long crank before starting",
    domain: "FUEL",
    notes: [DRAFT_NOTE, "Time perception varies; treat as medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.STARTS_THEN_STALLS]: {
    id: OBSERVATION_IDS.STARTS_THEN_STALLS,
    label: "Starts then stalls",
    domain: "FUEL",
    notes: [DRAFT_NOTE, "Symptom-based. No inferred cause."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.STALLS_ON_ACCELERATION]: {
    id: OBSERVATION_IDS.STALLS_ON_ACCELERATION,
    label: "Stalls when accelerating",
    domain: "FUEL",
    notes: [DRAFT_NOTE, "Symptom-based. No inferred cause."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.LOSS_OF_POWER_UPHILL]: {
    id: OBSERVATION_IDS.LOSS_OF_POWER_UPHILL,
    label: "Loss of power when going uphill",
    domain: "FUEL",
    notes: [DRAFT_NOTE, "Symptom-based. No inferred cause."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.FUEL_PUMP_SOUND_NOT_HEARD]: {
    id: OBSERVATION_IDS.FUEL_PUMP_SOUND_NOT_HEARD,
    label: "No fuel pump sound heard when key is turned on",
    domain: "FUEL",
    notes: [DRAFT_NOTE, "Hard-to-hear sound; treat as weak reliability."],
    defaultStrength: OBSERVATION_STRENGTH.WEAK,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.RAW_FUEL_SMELL_OUTSIDE]: {
    id: OBSERVATION_IDS.RAW_FUEL_SMELL_OUTSIDE,
    label: "Raw fuel smell outside the vehicle",
    domain: "FUEL",
    notes: [DRAFT_NOTE, "Smell-based observation; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },

  // ---------------------------------------------------------------------------
  // IGNITION / MISFIRE SYMPTOMS (DRAFT)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.ENGINE_MISFIRES_AT_IDLE]: {
    id: OBSERVATION_IDS.ENGINE_MISFIRES_AT_IDLE,
    label: "Engine misfires at idle",
    domain: "IGNITION",
    notes: [DRAFT_NOTE, "Symptom-based. No inferred cause."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.ENGINE_MISFIRES_UNDER_LOAD]: {
    id: OBSERVATION_IDS.ENGINE_MISFIRES_UNDER_LOAD,
    label: "Engine misfires under load",
    domain: "IGNITION",
    notes: [DRAFT_NOTE, "Symptom-based. No inferred cause."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.BACKFIRE_POP_NOISE]: {
    id: OBSERVATION_IDS.BACKFIRE_POP_NOISE,
    label: "Backfire/pop noise",
    domain: "IGNITION",
    notes: [DRAFT_NOTE, "Sound perception varies; treat as medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.ROUGH_IDLE]: {
    id: OBSERVATION_IDS.ROUGH_IDLE,
    label: "Rough idle",
    domain: "IGNITION",
    notes: [DRAFT_NOTE, "Subjective; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },

  // ---------------------------------------------------------------------------
  // BRAKES / HEAT / DRAG (DRAFT)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.BRAKE_PEDAL_SOFT]: {
    id: OBSERVATION_IDS.BRAKE_PEDAL_SOFT,
    label: "Brake pedal feels soft/spongy",
    domain: "BRAKES_HEAT_DRAG",
    notes: [DRAFT_NOTE, "Touch/feel observation; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.BRAKE_PEDAL_PULSATION]: {
    id: OBSERVATION_IDS.BRAKE_PEDAL_PULSATION,
    label: "Brake pedal pulsation while braking",
    domain: "BRAKES_HEAT_DRAG",
    notes: [DRAFT_NOTE, "Feel observation; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.GRINDING_NOISE_WHEN_BRAKING]: {
    id: OBSERVATION_IDS.GRINDING_NOISE_WHEN_BRAKING,
    label: "Grinding noise when braking",
    domain: "BRAKES_HEAT_DRAG",
    notes: [DRAFT_NOTE, "Sound-based; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.PULLS_WHEN_BRAKING]: {
    id: OBSERVATION_IDS.PULLS_WHEN_BRAKING,
    label: "Vehicle pulls to one side when braking",
    domain: "BRAKES_HEAT_DRAG",
    notes: [DRAFT_NOTE, STRONG_SOFT_NOTE, "Thermal/mechanical drag indicator."],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.WHEEL_HOTTER_THAN_OTHERS]: {
    id: OBSERVATION_IDS.WHEEL_HOTTER_THAN_OTHERS,
    label: "One wheel is much hotter than the others after driving",
    domain: "BRAKES_HEAT_DRAG",
    notes: [
      DRAFT_NOTE,
      STRONG_SOFT_NOTE,
      "Thermal/mechanical drag indicator.",
      "Touch-based; use caution when checking heat.",
    ],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.BURNING_SMELL_NEAR_WHEEL]: {
    id: OBSERVATION_IDS.BURNING_SMELL_NEAR_WHEEL,
    label: "Burning smell near a wheel",
    domain: "BRAKES_HEAT_DRAG",
    notes: [DRAFT_NOTE, "Smell-based observation; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },

  // ---------------------------------------------------------------------------
  // TIRES / WHEELS (DRAFT)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.VIBRATION_AT_SPEED]: {
    id: OBSERVATION_IDS.VIBRATION_AT_SPEED,
    label: "Vibration at speed",
    domain: "TIRES_WHEELS",
    notes: [DRAFT_NOTE, "Symptom-based. No inferred cause."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.HUMMING_GROWL_CHANGES_WITH_SPEED]: {
    id: OBSERVATION_IDS.HUMMING_GROWL_CHANGES_WITH_SPEED,
    label: "Humming/growling noise that changes with speed",
    domain: "TIRES_WHEELS",
    notes: [DRAFT_NOTE, "Sound-based and easily confused; treat as weak reliability."],
    defaultStrength: OBSERVATION_STRENGTH.WEAK,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.STEERING_WHEEL_SHAKE]: {
    id: OBSERVATION_IDS.STEERING_WHEEL_SHAKE,
    label: "Steering wheel shakes",
    domain: "TIRES_WHEELS",
    notes: [DRAFT_NOTE, "Symptom-based. No inferred cause."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.UNEVEN_TIRE_WEAR_VISIBLE]: {
    id: OBSERVATION_IDS.UNEVEN_TIRE_WEAR_VISIBLE,
    label: "Uneven tire wear is visible",
    domain: "TIRES_WHEELS",
    notes: [DRAFT_NOTE, "Visual observation; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.TIRE_PRESSURE_LIGHT_ON]: {
    id: OBSERVATION_IDS.TIRE_PRESSURE_LIGHT_ON,
    label: "Tire pressure warning light is on",
    domain: "TIRES_WHEELS",
    notes: [DRAFT_NOTE, DASH_LIGHT_SUPPORT_NOTE],
    defaultStrength: OBSERVATION_STRENGTH.WEAK,
    isDashLight: true,
    isSafetyCritical: false,
  },

  // ---------------------------------------------------------------------------
  // SUSPENSION (DRAFT)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.CLUNK_OVER_BUMPS]: {
    id: OBSERVATION_IDS.CLUNK_OVER_BUMPS,
    label: "Clunk sound over bumps",
    domain: "SUSPENSION",
    notes: [DRAFT_NOTE, "Sound-based; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.EXCESSIVE_BOUNCING]: {
    id: OBSERVATION_IDS.EXCESSIVE_BOUNCING,
    label: "Vehicle bounces excessively after bumps",
    domain: "SUSPENSION",
    notes: [DRAFT_NOTE, STRONG_SOFT_NOTE],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.VEHICLE_SITS_LOW_ON_ONE_SIDE]: {
    id: OBSERVATION_IDS.VEHICLE_SITS_LOW_ON_ONE_SIDE,
    label: "Vehicle sits low on one side",
    domain: "SUSPENSION",
    notes: [DRAFT_NOTE, "Visual observation; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.RATTLE_OVER_ROUGH_ROAD]: {
    id: OBSERVATION_IDS.RATTLE_OVER_ROUGH_ROAD,
    label: "Rattle noise over rough roads",
    domain: "SUSPENSION",
    notes: [DRAFT_NOTE, "Sound-based; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },

  // ---------------------------------------------------------------------------
  // STEERING (DRAFT)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.STEERING_FEELS_HEAVY]: {
    id: OBSERVATION_IDS.STEERING_FEELS_HEAVY,
    label: "Steering feels heavy",
    domain: "STEERING",
    notes: [DRAFT_NOTE, STRONG_SOFT_NOTE, "Feel-based observation."],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.STEERING_WANDERS]: {
    id: OBSERVATION_IDS.STEERING_WANDERS,
    label: "Steering wanders / requires constant correction",
    domain: "STEERING",
    notes: [DRAFT_NOTE, STRONG_SOFT_NOTE],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.PULLS_TO_ONE_SIDE]: {
    id: OBSERVATION_IDS.PULLS_TO_ONE_SIDE,
    label: "Vehicle pulls to one side while driving",
    domain: "STEERING",
    notes: [DRAFT_NOTE, STRONG_SOFT_NOTE, "Thermal/mechanical drag indicator (also overlaps tires/brakes)."],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.WHINE_WHEN_TURNING]: {
    id: OBSERVATION_IDS.WHINE_WHEN_TURNING,
    label: "Whining noise when turning",
    domain: "STEERING",
    notes: [DRAFT_NOTE, "Sound-based; weak reliability."],
    defaultStrength: OBSERVATION_STRENGTH.WEAK,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.POWER_STEERING_WARNING_LIGHT]: {
    id: OBSERVATION_IDS.POWER_STEERING_WARNING_LIGHT,
    label: "Power steering/EPS warning light is on",
    domain: "STEERING",
    notes: [DRAFT_NOTE, DASH_LIGHT_SUPPORT_NOTE],
    defaultStrength: OBSERVATION_STRENGTH.WEAK,
    isDashLight: true,
    isSafetyCritical: false,
  },

  // ---------------------------------------------------------------------------
  // HVAC (DRAFT)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.NO_HEAT]: {
    id: OBSERVATION_IDS.NO_HEAT,
    label: "No heat from vents",
    domain: "HVAC",
    notes: [DRAFT_NOTE, "Symptom-based. No inferred cause."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.NO_AC]: {
    id: OBSERVATION_IDS.NO_AC,
    label: "No cold air from vents",
    domain: "HVAC",
    notes: [DRAFT_NOTE, "Symptom-based. No inferred cause."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.BLOWER_NOT_WORKING]: {
    id: OBSERVATION_IDS.BLOWER_NOT_WORKING,
    label: "Blower fan not working",
    domain: "HVAC",
    notes: [DRAFT_NOTE, STRONG_SOFT_NOTE],
    defaultStrength: OBSERVATION_STRENGTH.STRONG,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.AIRFLOW_WEAK]: {
    id: OBSERVATION_IDS.AIRFLOW_WEAK,
    label: "Airflow is weak even on high fan setting",
    domain: "HVAC",
    notes: [DRAFT_NOTE, "Feel-based observation; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.MUSTY_SMELL_FROM_VENTS]: {
    id: OBSERVATION_IDS.MUSTY_SMELL_FROM_VENTS,
    label: "Musty smell from vents",
    domain: "HVAC",
    notes: [DRAFT_NOTE, "Smell-based observation; medium reliability."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },

  // ---------------------------------------------------------------------------
  // SMELLS (GENERAL) (DRAFT)
  // ---------------------------------------------------------------------------
  [OBSERVATION_IDS.SWEET_SMELL]: {
    id: OBSERVATION_IDS.SWEET_SMELL,
    label: "Sweet smell",
    domain: "SMELLS",
    notes: [DRAFT_NOTE, "Smell-based observation; medium reliability.", "Avoid inferring source/cause."] ,
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.BURNING_OIL_SMELL]: {
    id: OBSERVATION_IDS.BURNING_OIL_SMELL,
    label: "Burning oil smell",
    domain: "SMELLS",
    notes: [DRAFT_NOTE, "Smell-based observation; medium reliability.", "Avoid inferring source/cause."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.BURNT_ELECTRICAL_SMELL]: {
    id: OBSERVATION_IDS.BURNT_ELECTRICAL_SMELL,
    label: "Burnt electrical smell",
    domain: "SMELLS",
    notes: [DRAFT_NOTE, "Smell-based observation; medium reliability.", "Avoid inferring source/cause."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
  [OBSERVATION_IDS.ROTTEN_EGG_SMELL]: {
    id: OBSERVATION_IDS.ROTTEN_EGG_SMELL,
    label: "Rotten egg smell",
    domain: "SMELLS",
    notes: [DRAFT_NOTE, "Smell-based observation; medium reliability.", "Avoid inferring source/cause."],
    defaultStrength: OBSERVATION_STRENGTH.MEDIUM,
    isDashLight: false,
    isSafetyCritical: false,
  },
};

/**
 * Data contract for an observation response.
 *
 * NOTE: This is a schema only; no scoring or diagnosis is performed here.
 */
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
  /** Optional freeform note captured by UI. */
  note?: string;
};

/**
 * Minimal normalization helper used by other core modules.
 *
 * This helper is NOT scoring/diagnosis/safety logic; it only normalizes allowed input encodings
 * into the canonical ObservationValue set.
 */
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
  return OBSERVATION_VALUE.SKIP;
}
