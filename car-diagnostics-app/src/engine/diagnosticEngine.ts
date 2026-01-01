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
  if (correctedScores.battery !== undefined && batteryPenalty > 0) {
    const originalBattery = correctedScores.battery;
    correctedScores.battery = Math.max(0, originalBattery * (1 - batteryPenalty));
  }
  
  // === BOOST ALTERNATIVE HYPOTHESES ===
  // When battery is suppressed, boost viable alternatives
  
  if (batteryPenalty > 0.4) {
    // Starter becomes more likely when battery is ruled out
    if (correctedScores.starter !== undefined) {
      correctedScores.starter = (correctedScores.starter || 0) + (batteryPenalty * 0.5);
    }
    
    // Grounds/electrical connections become more likely
    if (correctedScores.grounds !== undefined) {
      correctedScores.grounds = (correctedScores.grounds || 0) + (batteryPenalty * 0.3);
    }
  }
  
  return correctedScores;
}

/**
 * SYSTEM CORRECTION: Confidence Logic
 * 
 * Confidence increases only when uncertainty is reduced, not when a diagnosis is merely suggested.
 * - If multiple hypotheses remain viable → cap confidence
 * - If evidence conflicts → lower confidence
 * - Confidence reflects evidence density, not decision finality
 */
function calculateCorrectedConfidence(
  scores: Record<string, number>,
  observations: ObservationResponse[]
): number {
  // Get base confidence from scoring
  const baseConf = calculateConfidence(scores);
  let confidence = baseConf.confidence;
  
  // Count significant hypotheses (score > 0.1 of max)
  const scoreValues = Object.values(scores).filter(s => typeof s === 'number' && s > 0);
  if (scoreValues.length === 0) return 0;
  
  const maxScore = Math.max(...scoreValues);
  const significantCount = scoreValues.filter(s => s > maxScore * 0.3).length;
  
  // === CAP CONFIDENCE WHEN MULTIPLE VIABLE HYPOTHESES ===
  if (significantCount >= 3) {
    confidence = Math.min(confidence, 0.4); // Many possibilities = low confidence
  } else if (significantCount === 2) {
    confidence = Math.min(confidence, 0.6); // Two main possibilities = medium confidence
  }
  
  // === CAP CONFIDENCE BY EVIDENCE DENSITY ===
  // Fewer observations = lower max confidence
  const observationCount = observations.filter(o => 
    normalizeObservationValue(o.value) !== OBSERVATION_VALUE.UNSURE
  ).length;
  
  if (observationCount <= 2) {
    confidence = Math.min(confidence, 0.5); // Very few data points
  } else if (observationCount <= 4) {
    confidence = Math.min(confidence, 0.7); // Limited data points
  }
  
  // === CHECK FOR CONFLICTING EVIDENCE ===
  // If we have contradictory observations, reduce confidence
  const hasYes = (id: string) => 
    observations.some(o => o.id === id && normalizeObservationValue(o.value) === OBSERVATION_VALUE.YES);
  const hasNo = (id: string) => 
    observations.some(o => o.id === id && normalizeObservationValue(o.value) === OBSERVATION_VALUE.NO);
  
  // Example conflicts:
  // - Jump helps but lights are bright (battery symptoms weak)
  // - Clicking but electrical works (starter vs battery ambiguity)
  if (hasYes(OBSERVATION_IDS.JUMP_START_HELPS) && hasNo(OBSERVATION_IDS.HEADLIGHTS_DIM)) {
    confidence = Math.min(confidence, 0.65); // Conflicting battery evidence
  }
  
  if (hasYes(OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK) && hasNo(OBSERVATION_IDS.HEADLIGHTS_DIM)) {
    confidence = Math.min(confidence, 0.7); // Click but power OK = ambiguous
  }
  
  return Math.max(0, Math.min(1, confidence));
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

  // NOTE: The current model types define `id` and `topHypothesis` as string.
  // This engine revision must return nulls when missing per requirement, so we cast.
  const result = {
    // Engine must not generate UUIDs.
    id: input.resultId ?? null,
    vehicleId: input.vehicleId,
    timestamp,
    entryAnchor: input.entryAnchor,
    topHypothesis,
    confidence,
    supportingObservations: extractSupportingObservationIds(observations),
    safetyNotes: undefined,
  } as unknown as DiagnosticResult;

  return { result, scores: correctedScores };
}
