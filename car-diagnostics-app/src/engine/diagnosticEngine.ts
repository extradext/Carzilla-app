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
};

export type DiagnosticEngineOutput = {
  result: DiagnosticResult;
  /** Family score map returned by scoring.ts (omitted when safety override). */
  scores?: Record<string, number>;
};

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
    const result: DiagnosticResult = {
      // TODO: Provide a deterministic UUID from upstream; engine should not invent IDs.
      id: input.resultId ?? "TODO",
      vehicleId: input.vehicleId,
      timestamp,
      entryAnchor: input.entryAnchor,
      topHypothesis: "SAFETY_OVERRIDE",
      confidence: 0,
      supportingObservations: extractSupportingObservationIds(observations),
      safetyNotes: (safety as any)?.notes ?? ["Safety override triggered."],
    };

    return { result };
  }

  // 3) Clarifiers resolution happens upstream (already expressed as observations).

  // 4) Scoring
  const scores = scoreHypotheses(observations, input.measurements) as Record<string, number>;

  // 5) Confidence
  const conf = calculateConfidence(scores);

  // Engine does not implement ranking rules; however, DiagnosticResult requires a topHypothesis.
  // TODO: Define authoritative ranking rule for selecting the top family from score map.
  const topHypothesis = "TODO";

  const result: DiagnosticResult = {
    // TODO: Provide a deterministic UUID from upstream; engine should not invent IDs.
    id: input.resultId ?? "TODO",
    vehicleId: input.vehicleId,
    timestamp,
    entryAnchor: input.entryAnchor,
    topHypothesis,
    confidence: conf.confidence,
    supportingObservations: extractSupportingObservationIds(observations),
    safetyNotes: undefined,
  };

  return { result, scores };
}
