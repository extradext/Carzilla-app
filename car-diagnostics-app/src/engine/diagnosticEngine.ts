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
import { normalizeObservationValue, OBSERVATION_VALUE } from "../core/observations";

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

function selectTopHypothesis(scores: Record<string, number>): string | null {
  // Choose the family with the highest absolute score.
  // Deterministic tie-break: iteration order (Object.entries order).
  let bestFamily: string | null = null;
  let bestAbs = 0;

  for (const [family, score] of Object.entries(scores)) {
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
  const scores = scoreHypotheses(observations, input.measurements) as Record<string, number>;

  // 5) Confidence
  const conf = calculateConfidence(scores);

  // 1) Top hypothesis selection (engine-level orchestration rule)
  // Choose the family with the highest absolute score.
  // Deterministic tie-break: iteration order.
  const topHypothesis = selectTopHypothesis(scores);

  // NOTE: The current model types define `id` and `topHypothesis` as string.
  // This engine revision must return nulls when missing per requirement, so we cast.
  const result = {
    // Engine must not generate UUIDs.
    id: input.resultId ?? null,
    vehicleId: input.vehicleId,
    timestamp,
    entryAnchor: input.entryAnchor,
    topHypothesis,
    confidence: conf.confidence,
    supportingObservations: extractSupportingObservationIds(observations),
    safetyNotes: undefined,
  } as unknown as DiagnosticResult;

  return { result, scores };
}
