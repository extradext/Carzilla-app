/**
 * /src/engine/diagnosticEngine.ts
 * ORCHESTRATION — NO LOGIC (per file contracts)
 *
 * Orchestrates:
 *  - Safety
 *  - Observations
 *  - Clarifiers
 *  - Scoring
 *  - Confidence
 *
 * ❌ No logic of its own.
 */

import { evaluateSafety } from "../core/safety";
import { scoreHypotheses } from "../core/scoring";
import { calculateConfidence } from "../core/confidence";

// TODO: Import types from /models once finalized

export type DiagnosticEngineInput = {
  // TODO
};

export type DiagnosticEngineOutput = {
  // TODO
};

export function runDiagnosticEngine(input: DiagnosticEngineInput): DiagnosticEngineOutput {
  // NOTE: This function should only orchestrate calls; no logic here.
  // TODO: wire together evaluateSafety -> scoreHypotheses -> calculateConfidence per contracts.
  // TODO: incorporate clarifiers (max 3) without overriding measurements.

  // Placeholder to satisfy scaffolding; replace with proper orchestration later.
  void evaluateSafety;
  void scoreHypotheses;
  void calculateConfidence;

  throw new Error("TODO: runDiagnosticEngine not implemented");
}
