/**
 * /src/engine/diagnosticEngine.ts
 * ORCHESTRATION — GLUE ONLY (per file contracts)
 *
 * Rules:
 * - Orchestration only. No diagnostic logic.
 * - Call order must be:
 *   1) safety.evaluateSafety
 *   2) observations normalization
 *   3) clarifiers resolution (already expressed as observations)
 *   4) scoring.scoreHypotheses
 *   5) confidence.calculateConfidence
 *   6) POST-SCORING CORRECTIONS (battery bias, state contamination)
 * - Return a structured DiagnosticResult object.
 * - If safetyOverride is true, bypass scoring and return safety result.
 * - Do not invent rules.
 */

import { evaluateSafety } from "../core/safety";
import { scoreHypotheses } from "../core/scoring";
import { calculateConfidence } from "../core/confidence";
import type { DiagnosticResult } from "../models/diagnosticResult";
import type { EntryAnchor } from "../diagnostics/entryAnchors";
import type { ObservationResponse } from "../core/observations";
import { normalizeObservationValue, OBSERVATION_VALUE, OBSERVATION_IDS } from "../core/observations";

export type DiagnosticEngineInput = {
  vehicleId: string;
  entryAnchor: EntryAnchor;
  /** Observations already include any resolved clarifiers expressed upstream. */
  observations: ObservationResponse[];
  /** Measurements are handled elsewhere; accepted only for compatibility. */
  measurements?: unknown;
  /** Optional explicit timestamp (ISO). */
  timestamp?: string;
  /** Optional deterministic id (UUID). */
  resultId?: string;
  /** Pro feature: hypotheses to exclude from consideration */
  excludedHypotheses?: string[];
};

export type DiagnosticEngineOutput = {
  result: DiagnosticResult;
  /** Family score map returned by scoring.ts (omitted when safety override). */
  scores?: Record<string, number>;
};

/**
 * SYSTEM CORRECTION: Battery Bias Fix
 * 
 * This function applies post-scoring corrections to address battery over-selection.
 * It implements:
 * 1. Battery credibility decay when contradictory evidence exists
 * 2. Jump start reinterpretation (jump success ≠ battery failure)
 * 3. Battery suppression guardrail
 * 4. State contamination detection
 */
function applyBatteryBiasCorrection(
  scores: Record<string, number>,
  observations: ObservationResponse[]
): Record<string, number> {
  const correctedScores = { ...scores };
  
  // Helper to check if observation has YES value
  const hasYes = (id: string) => 
    observations.some(o => o.id === id && normalizeObservationValue(o.value) === OBSERVATION_VALUE.YES);
  
  // Helper to check if observation has NO value
  const hasNo = (id: string) => 
    observations.some(o => o.id === id && normalizeObservationValue(o.value) === OBSERVATION_VALUE.NO);

  // === BATTERY CREDIBILITY DECAY ===
  // Battery starts as plausible, not dominant.
  // Apply negative weighting for contradictory evidence.
  
  let batteryPenalty = 0;
  
  // If headlights are NOT dim (bright at rest) → reduce battery confidence
  if (hasNo(OBSERVATION_IDS.HEADLIGHTS_DIM)) {
    batteryPenalty += 0.3;
  }
  
  // If lights don't flicker → battery likely fine
  if (hasNo(OBSERVATION_IDS.LIGHTS_FLICKER)) {
    batteryPenalty += 0.2;
  }
  
  // If dash doesn't reset when cranking → battery can sustain load
  if (hasNo(OBSERVATION_IDS.DASH_RESETS_WHEN_CRANKING)) {
    batteryPenalty += 0.25;
  }
  
  // If no intermittent power loss → electrical system stable
  if (hasNo(OBSERVATION_IDS.INTERMITTENT_NO_POWER)) {
    batteryPenalty += 0.15;
  }
  
  // === JUMP START REINTERPRETATION ===
  // Jump success confirms temporary power availability, NOT battery failure.
  // Jump success alone cannot increase battery confidence.
  // Jump = state restoration, not diagnosis.
  
  if (hasYes(OBSERVATION_IDS.JUMP_START_HELPS)) {
    // Don't boost battery for jump success - it may mask original failure
    // If other strong battery indicators are missing, penalize further
    if (batteryPenalty > 0.3) {
      batteryPenalty += 0.2; // Jump after repeated attempts with healthy electrical = not battery
    }
  }
  
  // === INITIAL FAILURE TYPE ===
  // If first failure involved clicking or silence, don't assume battery
  
  if (hasYes(OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK)) {
    // Single click could be starter solenoid, not just battery
    batteryPenalty += 0.2;
  }
  
  if (hasYes(OBSERVATION_IDS.NO_CLICK_NO_CRANK) && !hasYes(OBSERVATION_IDS.INTERMITTENT_NO_POWER)) {
    // Complete silence but electrical works = likely not battery
    batteryPenalty += 0.15;
  }
  
  // === BATTERY SUPPRESSION GUARDRAIL ===
  // Battery cannot reach high confidence if ALL are true:
  // - Lights are bright at rest (HEADLIGHTS_DIM = NO)
  // - Lights do not significantly dim during crank (DASH_RESETS_WHEN_CRANKING = NO)
  // - Initial failure involved clicking or silence
  
  const lightsBrightAtRest = hasNo(OBSERVATION_IDS.HEADLIGHTS_DIM);
  const lightsDontDimDuringCrank = hasNo(OBSERVATION_IDS.DASH_RESETS_WHEN_CRANKING) && 
                                    hasNo(OBSERVATION_IDS.LIGHTS_FLICKER);
  const clickingOrSilence = hasYes(OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK) || 
                            hasYes(OBSERVATION_IDS.NO_CLICK_NO_CRANK);
  
  if (lightsBrightAtRest && lightsDontDimDuringCrank && clickingOrSilence) {
    // Strong guardrail: Battery should NOT be primary diagnosis
    batteryPenalty += 0.5;
  }
  
  // Apply the accumulated penalty to battery score
  // Penalty > 1.0 means battery should be completely eliminated
  if (correctedScores.battery !== undefined && batteryPenalty > 0) {
    const originalBattery = correctedScores.battery;
    // When penalty >= 1.0, battery score goes to 0 or negative
    correctedScores.battery = Math.max(0, originalBattery * (1 - Math.min(batteryPenalty, 1.5)));
  }
  
  // === BOOST ALTERNATIVE HYPOTHESES ===
  // When battery is suppressed, boost viable alternatives
  // This is critical because there is no "starter" family in the current system,
  // so we boost "grounds" as the closest proxy for electrical/connection issues
  
  if (batteryPenalty > 0.4) {
    // Grounds/electrical connections become more likely when battery is ruled out
    const groundsBoost = batteryPenalty * 0.6;
    if (correctedScores.grounds !== undefined) {
      correctedScores.grounds = Math.max(correctedScores.grounds || 0, groundsBoost * 10);
    } else {
      correctedScores.grounds = groundsBoost * 10;
    }
    
    // If there was a single click, it's even more likely to be a connection/solenoid issue
    if (clickingOrSilence) {
      correctedScores.grounds = (correctedScores.grounds || 0) + 5;
    }
  }
  
  return correctedScores;
}

/**
 * SYSTEM CORRECTION: Confidence Logic
 * 
 * PRINCIPLE: Confidence is capped by remaining uncertainty, NOT boosted by hypothesis strength.
 * 
 * - Confidence reflects how much uncertainty has been eliminated
 * - More questions answered + more decisive answers = higher confidence
 * - Having a "strong" hypothesis doesn't boost confidence if uncertainty remains high
 * - Conflicting evidence must reduce confidence
 */
function calculateCorrectedConfidence(
  scores: Record<string, number>,
  observations: ObservationResponse[]
): number {
  // Count definitive observations (YES or NO, not UNSURE or SKIP)
  const definitiveObs = observations.filter(o => {
    const v = normalizeObservationValue(o.value);
    return v === OBSERVATION_VALUE.YES || v === OBSERVATION_VALUE.NO;
  });
  const observationCount = definitiveObs.length;
  
  // Base confidence starts from evidence density, not hypothesis score
  // More evidence = more uncertainty reduced = higher base confidence
  let confidence: number;
  if (observationCount <= 2) {
    confidence = 0.35; // Very little evidence
  } else if (observationCount <= 4) {
    confidence = 0.50; // Some evidence
  } else if (observationCount <= 6) {
    confidence = 0.65; // Moderate evidence
  } else {
    confidence = 0.75; // Good amount of evidence
  }
  
  // === COUNT VIABLE HYPOTHESES (remaining uncertainty) ===
  const scoreValues = Object.values(scores).filter(s => typeof s === 'number' && s > 0);
  if (scoreValues.length === 0) return 0;
  
  const maxScore = Math.max(...scoreValues);
  const significantCount = scoreValues.filter(s => s > maxScore * 0.25).length;
  
  // More viable hypotheses = more uncertainty = LOWER confidence
  if (significantCount >= 4) {
    confidence = Math.min(confidence, 0.30); // Very ambiguous
  } else if (significantCount >= 3) {
    confidence = Math.min(confidence, 0.45); // Multiple possibilities
  } else if (significantCount === 2) {
    confidence = Math.min(confidence, 0.60); // Two main candidates
  }
  // Only if 1 significant hypothesis, confidence is allowed to be higher
  
  // === CHECK FOR CONFLICTING EVIDENCE ===
  const hasYes = (id: string) => 
    observations.some(o => o.id === id && normalizeObservationValue(o.value) === OBSERVATION_VALUE.YES);
  const hasNo = (id: string) => 
    observations.some(o => o.id === id && normalizeObservationValue(o.value) === OBSERVATION_VALUE.NO);
  
  // Conflicting evidence patterns reduce confidence
  // Click but lights are bright = ambiguity between starter/battery
  if (hasYes(OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK) && hasNo(OBSERVATION_IDS.HEADLIGHTS_DIM)) {
    confidence = Math.min(confidence, 0.65);
  }
  
  // Jump helps but lights are bright = conflicting battery signals
  if (hasYes(OBSERVATION_IDS.JUMP_START_HELPS) && hasNo(OBSERVATION_IDS.HEADLIGHTS_DIM)) {
    confidence = Math.min(confidence, 0.55);
  }
  
  // If top hypothesis was heavily penalized (like battery), 
  // the diagnosis is more certain because we eliminated a common false positive
  if (maxScore > 0 && scoreValues.length > 1) {
    const secondMax = scoreValues.filter(s => s !== maxScore).sort((a, b) => b - a)[0] || 0;
    const separation = maxScore / (maxScore + secondMax);
    // Good separation (one clear winner) can slightly boost confidence
    if (separation > 0.7) {
      confidence = Math.min(confidence + 0.1, 0.80);
    }
  }
  
  return Math.max(0.10, Math.min(0.85, confidence)); // Never below 10% or above 85%
}

function selectTopHypothesis(scores: Record<string, number>, excludedHypotheses: string[] = []): string | null {
  // Choose the family with the highest absolute score.
  // Deterministic tie-break: iteration order (Object.entries order).
  // Pro feature: Skip excluded hypotheses
  let bestFamily: string | null = null;
  let bestAbs = 0;

  const excludedLower = excludedHypotheses.map(h => h.toLowerCase());

  for (const [family, score] of Object.entries(scores)) {
    // Skip excluded hypotheses (case-insensitive comparison)
    if (excludedLower.includes(family.toLowerCase())) {
      continue;
    }
    
    const abs = Math.abs(typeof score === "number" ? score : 0);
    if (abs > bestAbs) {
      bestAbs = abs;
      bestFamily = family;
    }
  }

  if (bestAbs === 0) return null;
  return bestFamily;
}

/**
 * COMPONENT-LEVEL REFINEMENT
 * 
 * When observations clearly point to a specific component rather than
 * just a system, we should name the component directly.
 * 
 * This provides more actionable diagnoses for the user.
 */
type ComponentRefinement = {
  component: string;
  requiredObs: string[];  // All must be YES
  excludeObs?: string[];  // All must be NO or absent
};

const COMPONENT_REFINEMENTS: Record<string, ComponentRefinement[]> = {
  // BATTERY system refinements
  battery: [
    {
      component: "battery_terminals",
      requiredObs: [OBSERVATION_IDS.TERMINALS_CORRODED],
      excludeObs: [],
    },
    {
      component: "battery_dead_cell",
      requiredObs: [OBSERVATION_IDS.JUMP_START_HELPS, OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY],
      excludeObs: [OBSERVATION_IDS.BATTERY_LIGHT_ON],
    },
  ],
  
  // ALTERNATOR system refinements
  alternator: [
    {
      component: "alternator_not_charging",
      requiredObs: [OBSERVATION_IDS.BATTERY_LIGHT_ON],
      excludeObs: [],
    },
  ],
  
  // GROUNDS system refinements  
  grounds: [
    {
      component: "starter_motor",
      requiredObs: [OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK],
      excludeObs: [OBSERVATION_IDS.HEADLIGHTS_DIM, OBSERVATION_IDS.LIGHTS_FLICKER],
    },
    {
      component: "starter_solenoid",
      requiredObs: [OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK],
      excludeObs: [OBSERVATION_IDS.HEADLIGHTS_DIM],
    },
    {
      component: "battery_cables",
      requiredObs: [OBSERVATION_IDS.INTERMITTENT_NO_POWER],
      excludeObs: [],
    },
    {
      component: "ground_strap",
      requiredObs: [OBSERVATION_IDS.LIGHTS_FLICKER],
      excludeObs: [],
    },
  ],
  
  // FUEL system refinements
  fuel: [
    {
      component: "fuel_pump",
      requiredObs: [OBSERVATION_IDS.FUEL_PUMP_SOUND_NOT_HEARD],
      excludeObs: [],
    },
    {
      component: "fuel_injectors",
      requiredObs: [OBSERVATION_IDS.RAW_FUEL_SMELL_OUTSIDE, OBSERVATION_IDS.LONG_CRANK_BEFORE_START],
      excludeObs: [],
    },
    {
      component: "fuel_filter",
      requiredObs: [OBSERVATION_IDS.LOSS_OF_POWER_UPHILL, OBSERVATION_IDS.STALLS_ON_ACCELERATION],
      excludeObs: [OBSERVATION_IDS.FUEL_PUMP_SOUND_NOT_HEARD],
    },
  ],
  
  // IGNITION system refinements
  ignition: [
    {
      component: "spark_plugs",
      requiredObs: [OBSERVATION_IDS.ENGINE_MISFIRES_AT_IDLE, OBSERVATION_IDS.ROUGH_IDLE],
      excludeObs: [],
    },
    {
      component: "ignition_coil",
      requiredObs: [OBSERVATION_IDS.ENGINE_MISFIRES_UNDER_LOAD],
      excludeObs: [],
    },
  ],
  
  // BRAKES system refinements
  brakes_heat_drag: [
    {
      component: "brake_pads",
      requiredObs: [OBSERVATION_IDS.GRINDING_NOISE_WHEN_BRAKING],
      excludeObs: [],
    },
    {
      component: "brake_rotors",
      requiredObs: [OBSERVATION_IDS.BRAKE_PEDAL_PULSATION],
      excludeObs: [],
    },
    {
      component: "brake_caliper",
      requiredObs: [OBSERVATION_IDS.WHEEL_HOTTER_THAN_OTHERS],
      excludeObs: [],
    },
    {
      component: "brake_caliper",
      requiredObs: [OBSERVATION_IDS.PULLS_WHEN_BRAKING],
      excludeObs: [],
    },
    {
      component: "brake_fluid",
      requiredObs: [OBSERVATION_IDS.BRAKE_PEDAL_SOFT],
      excludeObs: [],
    },
  ],
  
  // TIRES/WHEELS system refinements
  tires_wheels: [
    // Most specific diagnoses first (order matters - first match wins)
    {
      component: "valve_stem",
      requiredObs: [OBSERVATION_IDS.VALVE_STEM_DAMAGE_OR_LEAK],
      excludeObs: [],
    },
    {
      component: "tire_slow_leak",
      requiredObs: [OBSERVATION_IDS.TIRE_SLOW_LEAK_HISTORY],
      excludeObs: [OBSERVATION_IDS.VALVE_STEM_DAMAGE_OR_LEAK],
    },
    {
      component: "tire_curb_damage",
      requiredObs: [OBSERVATION_IDS.RECENT_CURB_IMPACT],
      excludeObs: [],
    },
    // General tire pressure issues
    {
      component: "tire_pressure_low",
      requiredObs: [OBSERVATION_IDS.TIRE_VISIBLY_LOW],
      excludeObs: [OBSERVATION_IDS.VALVE_STEM_DAMAGE_OR_LEAK, OBSERVATION_IDS.RECENT_CURB_IMPACT],
    },
    {
      component: "tire_pressure_uneven",
      requiredObs: [OBSERVATION_IDS.TIRE_PRESSURE_UNEVEN],
      excludeObs: [OBSERVATION_IDS.VALVE_STEM_DAMAGE_OR_LEAK, OBSERVATION_IDS.TIRE_SLOW_LEAK_HISTORY, OBSERVATION_IDS.RECENT_CURB_IMPACT],
    },
    {
      component: "tire_pressure_uneven",
      requiredObs: [OBSERVATION_IDS.PULLS_TO_ONE_SIDE, OBSERVATION_IDS.TIRE_PRESSURE_LIGHT_ON],
      excludeObs: [],
    },
    // Wheel alignment - if pulling but pressures are OK
    {
      component: "wheel_alignment",
      requiredObs: [OBSERVATION_IDS.PULLS_TO_ONE_SIDE, OBSERVATION_IDS.PULL_CHANGES_WITH_SPEED],
      excludeObs: [OBSERVATION_IDS.TIRE_PRESSURE_UNEVEN, OBSERVATION_IDS.TIRE_VISIBLY_LOW],
    },
    {
      component: "wheel_alignment",
      requiredObs: [OBSERVATION_IDS.PULLS_TO_ONE_SIDE],
      excludeObs: [OBSERVATION_IDS.TIRE_PRESSURE_UNEVEN, OBSERVATION_IDS.TIRE_VISIBLY_LOW, OBSERVATION_IDS.TIRE_PRESSURE_LIGHT_ON],
    },
    // Other wheel/tire issues
    {
      component: "wheel_bearing",
      requiredObs: [OBSERVATION_IDS.HUMMING_GROWL_CHANGES_WITH_SPEED],
      excludeObs: [],
    },
    {
      component: "wheel_balance",
      requiredObs: [OBSERVATION_IDS.VIBRATION_AT_SPEED, OBSERVATION_IDS.STEERING_WHEEL_SHAKE],
      excludeObs: [OBSERVATION_IDS.HUMMING_GROWL_CHANGES_WITH_SPEED],
    },
    {
      component: "tires",
      requiredObs: [OBSERVATION_IDS.UNEVEN_TIRE_WEAR_VISIBLE],
      excludeObs: [],
    },
  ],
  
  // SUSPENSION system refinements
  suspension: [
    {
      component: "struts_shocks",
      requiredObs: [OBSERVATION_IDS.EXCESSIVE_BOUNCING],
      excludeObs: [],
    },
    {
      component: "control_arm_bushings",
      requiredObs: [OBSERVATION_IDS.CLUNK_OVER_BUMPS],
      excludeObs: [],
    },
    {
      component: "sway_bar_links",
      requiredObs: [OBSERVATION_IDS.RATTLE_OVER_ROUGH_ROAD],
      excludeObs: [],
    },
    {
      component: "spring",
      requiredObs: [OBSERVATION_IDS.VEHICLE_SITS_LOW_ON_ONE_SIDE],
      excludeObs: [],
    },
  ],
  
  // STEERING system refinements
  steering_hydraulic: [
    {
      component: "power_steering_pump",
      requiredObs: [OBSERVATION_IDS.WHINE_WHEN_TURNING],
      excludeObs: [],
    },
    {
      component: "steering_rack",
      requiredObs: [OBSERVATION_IDS.STEERING_WANDERS],
      excludeObs: [],
    },
    {
      component: "tie_rod_ends",
      requiredObs: [OBSERVATION_IDS.STEERING_WANDERS, OBSERVATION_IDS.UNEVEN_TIRE_WEAR_VISIBLE],
      excludeObs: [],
    },
  ],
  
  // HVAC system refinements
  hvac: [
    {
      component: "blower_motor",
      requiredObs: [OBSERVATION_IDS.BLOWER_NOT_WORKING],
      excludeObs: [],
    },
    {
      component: "cabin_air_filter",
      requiredObs: [OBSERVATION_IDS.AIRFLOW_WEAK],
      excludeObs: [OBSERVATION_IDS.BLOWER_NOT_WORKING],
    },
    // Heater core leak (sweet smell indicates internal leak)
    {
      component: "heater_core",
      requiredObs: [OBSERVATION_IDS.NO_HEAT, OBSERVATION_IDS.SWEET_SMELL],
      excludeObs: [],
    },
    // Low coolant - check first before thermostat (simpler fix)
    {
      component: "coolant_low",
      requiredObs: [OBSERVATION_IDS.NO_HEAT, OBSERVATION_IDS.COOLANT_LOW],
      excludeObs: [],
    },
    {
      component: "coolant_low",
      requiredObs: [OBSERVATION_IDS.COOLANT_LOW],
      excludeObs: [],
    },
    // Thermostat - only if coolant is OK
    {
      component: "thermostat",
      requiredObs: [OBSERVATION_IDS.NO_HEAT, OBSERVATION_IDS.ENGINE_NEVER_WARMS, OBSERVATION_IDS.COOLANT_LEVEL_OK],
      excludeObs: [OBSERVATION_IDS.SWEET_SMELL, OBSERVATION_IDS.COOLANT_LOW],
    },
    {
      component: "thermostat",
      requiredObs: [OBSERVATION_IDS.ENGINE_NEVER_WARMS, OBSERVATION_IDS.COOLANT_LEVEL_OK],
      excludeObs: [OBSERVATION_IDS.COOLANT_LOW],
    },
    {
      component: "thermostat",
      requiredObs: [OBSERVATION_IDS.NO_HEAT, OBSERVATION_IDS.ENGINE_NEVER_WARMS],
      excludeObs: [OBSERVATION_IDS.SWEET_SMELL, OBSERVATION_IDS.COOLANT_LOW],
    },
    // Blend door (engine warms, coolant OK, but no heat)
    {
      component: "blend_door",
      requiredObs: [OBSERVATION_IDS.NO_HEAT, OBSERVATION_IDS.COOLANT_LEVEL_OK],
      excludeObs: [OBSERVATION_IDS.ENGINE_NEVER_WARMS, OBSERVATION_IDS.SWEET_SMELL],
    },
    {
      component: "ac_refrigerant",
      requiredObs: [OBSERVATION_IDS.NO_AC],
      excludeObs: [],
    },
    {
      component: "evaporator",
      requiredObs: [OBSERVATION_IDS.MUSTY_SMELL_FROM_VENTS],
      excludeObs: [],
    },
  ],
  
  // EXHAUST system refinements
  exhaust: [
    {
      component: "catalytic_converter",
      requiredObs: [OBSERVATION_IDS.ROTTEN_EGG_SMELL],
      excludeObs: [],
    },
    {
      component: "exhaust_manifold",
      requiredObs: [OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN],
      excludeObs: [OBSERVATION_IDS.ROTTEN_EGG_SMELL],
    },
    {
      component: "oil_leak",
      requiredObs: [OBSERVATION_IDS.BURNING_OIL_SMELL],
      excludeObs: [],
    },
  ],
};

function refineToComponent(
  topHypothesis: string | null,
  observations: ObservationResponse[]
): string | undefined {
  if (!topHypothesis) return undefined;
  
  const refinements = COMPONENT_REFINEMENTS[topHypothesis];
  if (!refinements) return undefined;
  
  const hasYes = (id: string) => 
    observations.some(o => o.id === id && normalizeObservationValue(o.value) === OBSERVATION_VALUE.YES);
  const hasNo = (id: string) => 
    observations.some(o => o.id === id && normalizeObservationValue(o.value) === OBSERVATION_VALUE.NO);
  const isAbsent = (id: string) =>
    !observations.some(o => o.id === id);
  
  // Find the first matching refinement (order matters - more specific first)
  for (const ref of refinements) {
    const allRequiredMet = ref.requiredObs.every(id => hasYes(id));
    const noExcluded = !ref.excludeObs || ref.excludeObs.every(id => hasNo(id) || isAbsent(id));
    
    if (allRequiredMet && noExcluded) {
      return ref.component;
    }
  }
  
  return undefined;
}

function normalizeObservations(observations: ObservationResponse[]): ObservationResponse[] {
  // Normalization is limited to allowed values; no scoring/diagnosis here.
  return observations.map((o) => ({
    ...o,
    value: normalizeObservationValue(o.value),
  }));
}

function extractSupportingObservationIds(observations: ObservationResponse[]): string[] {
  // Engine does not decide which observations support which family.
  // For now, include all non-neutral observations as supporting inputs.
  return observations
    .filter((o) => {
      const v = normalizeObservationValue(o.value);
      return v === OBSERVATION_VALUE.YES || v === OBSERVATION_VALUE.NO;
    })
    .map((o) => o.id);
}

export function runDiagnosticEngine(input: DiagnosticEngineInput): DiagnosticEngineOutput {
  const timestamp = input.timestamp ?? new Date().toISOString();

  // 1) Safety
  // NOTE: We pass observations as-is; safety.ts performs its own value normalization.
  const safety = evaluateSafety(input.observations);

  // 2) Observations normalization
  const observations = normalizeObservations(input.observations);

  // If safety override, bypass scoring and return safety result.
  if ((safety as any)?.safetyOverride === true) {
    // NOTE: The current model types define `id` and `topHypothesis` as string.
    // This engine revision must return nulls when missing per requirement, so we cast.
    const result = {
      // Engine must not generate UUIDs.
      id: input.resultId ?? null,
      vehicleId: input.vehicleId,
      timestamp,
      entryAnchor: input.entryAnchor,
      topHypothesis: "SAFETY_OVERRIDE",
      confidence: 0,
      supportingObservations: extractSupportingObservationIds(observations),
      safetyNotes: (safety as any)?.notes ?? ["Safety override triggered."],
    } as unknown as DiagnosticResult;

    return { result };
  }

  // 3) Clarifiers resolution happens upstream (already expressed as observations).

  // 4) Scoring
  const rawScores = scoreHypotheses(observations, input.measurements) as Record<string, number>;

  // 5) SYSTEM CORRECTION: Apply battery bias correction
  const correctedScores = applyBatteryBiasCorrection(rawScores, observations);

  // 6) SYSTEM CORRECTION: Apply corrected confidence calculation
  const confidence = calculateCorrectedConfidence(correctedScores, observations);

  // 7) Top hypothesis selection (engine-level orchestration rule)
  // Choose the family with the highest absolute score.
  // Deterministic tie-break: iteration order.
  // Pro feature: Exclude specified hypotheses
  const topHypothesis = selectTopHypothesis(correctedScores, input.excludedHypotheses);
  
  // 8) COMPONENT REFINEMENT: Try to narrow to specific component
  const specificComponent = refineToComponent(topHypothesis, observations);

  // NOTE: The current model types define `id` and `topHypothesis` as string.
  // This engine revision must return nulls when missing per requirement, so we cast.
  const result = {
    // Engine must not generate UUIDs.
    id: input.resultId ?? null,
    vehicleId: input.vehicleId,
    timestamp,
    entryAnchor: input.entryAnchor,
    topHypothesis,
    specificComponent,
    confidence,
    supportingObservations: extractSupportingObservationIds(observations),
    safetyNotes: undefined,
  } as unknown as DiagnosticResult;

  return { result, scores: correctedScores };
}
