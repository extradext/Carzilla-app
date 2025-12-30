/**
 * /src/ui/Results.tsx
 * PRESENTATION ONLY
 *
 * Results + Context Panel
 * - Top hypothesis
 * - Confidence band
 * - Supporting observations
 * - Context Panel (uses contextEvaluator)
 */

import React, { useMemo } from "react";
import type { DiagnosticResult } from "../models/diagnosticResult";
import { HYPOTHESIS_FAMILY_LABELS, type HypothesisFamilyId } from "../diagnostics/hypothesisFamilies";
import { OBSERVATION_DEFINITIONS, type ObservationId } from "../core/observations";
import { evaluateContext, type KnownIssue } from "../engine/contextEvaluator";
import { ContextPanel } from "./ContextPanel";

type ResultsProps = {
  result: DiagnosticResult;
  scores?: Record<string, number>;
  knownIssues?: KnownIssue[];
};

function getConfidenceBand(confidence: number): { label: string; color: string; bg: string } {
  if (confidence >= 0.8) return { label: "High", color: "#22c55e", bg: "rgba(34,197,94,0.2)" };
  if (confidence >= 0.5) return { label: "Medium", color: "#eab308", bg: "rgba(234,179,8,0.2)" };
  if (confidence >= 0.3) return { label: "Low", color: "#f97316", bg: "rgba(249,115,22,0.2)" };
  return { label: "Very Low", color: "#ef4444", bg: "rgba(239,68,68,0.2)" };
}

function getObservationLabel(id: string): string {
  const def = OBSERVATION_DEFINITIONS[id as ObservationId];
  return def?.label ?? id;
}

function getHypothesisLabel(id: string | null): string {
  if (!id) return "No hypothesis";
  if (id === "SAFETY_OVERRIDE") return "Safety Override Active";
  return HYPOTHESIS_FAMILY_LABELS[id as HypothesisFamilyId] ?? id;
}

export function Results({ result, scores, knownIssues = [] }: ResultsProps) {
  const isSafetyOverride = result.topHypothesis === "SAFETY_OVERRIDE";
  const confidenceBand = getConfidenceBand(result.confidence);

  // Evaluate context
  const contextEvaluation = useMemo(() => {
    if (knownIssues.length === 0) return null;
    return evaluateContext({ result, knownIssues });
  }, [result, knownIssues]);

  // Sort scores for display
  const sortedScores = useMemo(() => {
    if (!scores) return [];
    return Object.entries(scores)
      .filter(([_, score]) => Math.abs(score) > 0)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 5);
  }, [scores]);

  return (
    <section className="card" data-testid="results-panel">
      <h2 style={{ marginTop: 0 }} data-testid="results-title">
        Diagnosis Results
      </h2>

      {/* Safety Override Warning */}
      {isSafetyOverride && (
        <div
          style={{
            padding: 16,
            background: "rgba(239,68,68,0.15)",
            border: "2px solid rgba(239,68,68,0.4)",
            borderRadius: 8,
            marginBottom: 16,
          }}
          data-testid="safety-override-result"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <span style={{ fontWeight: 600, fontSize: 16, color: "#fca5a5" }}>Safety Override Active</span>
          </div>
          <p style={{ fontSize: 14, margin: 0, opacity: 0.9 }}>
            One or more safety-critical conditions were detected. Please address the safety concerns listed below before proceeding with regular diagnostics.
          </p>
        </div>
      )}

      {/* Main Result */}
      {!isSafetyOverride && (
        <div
          style={{
            padding: 20,
            background: "rgba(59,130,246,0.1)",
            borderRadius: 8,
            marginBottom: 16,
          }}
          data-testid="main-result"
        >
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Most Likely Cause</div>
          <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }} data-testid="results-top-hypothesis">
            {getHypothesisLabel(result.topHypothesis)}
          </div>

          {/* Confidence */}
          <div className="row" style={{ alignItems: "center", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Confidence</div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 12px",
                  background: confidenceBand.bg,
                  borderRadius: 6,
                  marginTop: 4,
                }}
                data-testid="results-confidence"
              >
                <span style={{ color: confidenceBand.color, fontWeight: 600 }}>{confidenceBand.label}</span>
                <span style={{ marginLeft: 8, opacity: 0.7 }}>({Math.round(result.confidence * 100)}%)</span>
              </div>
            </div>

            {/* Timestamp */}
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Analyzed</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Possibilities (scores) */}
      {!isSafetyOverride && sortedScores.length > 1 && (
        <div style={{ marginBottom: 16 }} data-testid="other-possibilities">
          <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Other Possibilities</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {sortedScores.slice(1).map(([family, score]) => (
              <div
                key={family}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 6,
                }}
              >
                <span style={{ fontSize: 13 }}>{getHypothesisLabel(family)}</span>
                <span className="badge" style={{ fontSize: 11 }}>
                  Score: {score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supporting Observations */}
      {result.supportingObservations && result.supportingObservations.length > 0 && (
        <div style={{ marginBottom: 16 }} data-testid="supporting-observations">
          <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Supporting Observations</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {result.supportingObservations.map((obsId) => (
              <span key={obsId} className="badge" style={{ fontSize: 12 }}>
                {getObservationLabel(obsId)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Safety Notes */}
      {Array.isArray(result.safetyNotes) && result.safetyNotes.length > 0 && (
        <div
          style={{
            padding: 16,
            background: "rgba(239,68,68,0.1)",
            borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.2)",
          }}
          data-testid="results-safety-notes"
        >
          <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#fca5a5" }}>
            ⚠️ Safety Notes
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }} data-testid="results-safety-notes-list">
            {result.safetyNotes.map((note, i) => (
              <li key={i} style={{ marginBottom: 4 }} data-testid="results-safety-note-item">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Context Panel */}
      <ContextPanel context={contextEvaluation} />

      {/* Result ID for reference */}
      <div style={{ marginTop: 16, fontSize: 11, opacity: 0.4 }} data-testid="result-id">
        Result ID: {result.id || "N/A"}
      </div>
    </section>
  );
}
