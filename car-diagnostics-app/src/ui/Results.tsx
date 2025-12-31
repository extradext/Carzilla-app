/**
 * /src/ui/Results.tsx
 * PRESENTATION ONLY
 *
 * Results + Context Panel
 * - Top hypothesis
 * - Confidence band
 * - Supporting observations
 * - Context Panel (uses contextEvaluator)
 * - Post-Result Actions
 */

import React, { useMemo, useState } from "react";
import type { DiagnosticResult } from "../models/diagnosticResult";
import type { ObservationResponse } from "../core/observations";
import type { Vehicle } from "../models/vehicle";
import { HYPOTHESIS_FAMILY_LABELS, type HypothesisFamilyId } from "../diagnostics/hypothesisFamilies";
import { OBSERVATION_DEFINITIONS, type ObservationId } from "../core/observations";
import { evaluateContext, type KnownIssue } from "../engine/contextEvaluator";
import { ContextPanel } from "./ContextPanel";
import {
  exportDiagnosticResult,
  exportDiagnosticResultJSON,
  downloadAsFile,
  copyToClipboard,
} from "../utils/export";

type ResultsProps = {
  result: DiagnosticResult;
  scores?: Record<string, number>;
  knownIssues?: KnownIssue[];
  vehicle?: Vehicle | null;
  observations?: ObservationResponse[];
  onRerunExcluding?: (excludeHypothesis: string) => void;
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

export function Results({ result, scores, knownIssues = [], vehicle, observations, onRerunExcluding }: ResultsProps) {
  const isSafetyOverride = result.topHypothesis === "SAFETY_OVERRIDE";
  const confidenceBand = getConfidenceBand(result.confidence);

  // Post-result actions state
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

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

  // Handle re-run excluding top hypothesis
  const handleRerunExcluding = () => {
    if (onRerunExcluding && result.topHypothesis) {
      onRerunExcluding(result.topHypothesis);
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = () => {
    const payload = exportDiagnosticResultJSON({
      result,
      vehicle,
      observations,
      userNotes: feedbackNotes,
      scores,
    });
    
    // For V1: Download feedback as JSON file
    // Forward-compatible with V2 API submission
    downloadAsFile(payload, `feedback-${result.id}.json`, "application/json");
    setFeedbackSubmitted(true);
    setShowFeedbackForm(false);
  };

  // Handle export
  const handleExport = (format: "text" | "json") => {
    const payload = { result, vehicle, observations, userNotes: feedbackNotes, scores };
    
    if (format === "text") {
      const content = exportDiagnosticResult(payload);
      downloadAsFile(content, `diagnosis-${result.id}.txt`, "text/plain");
      setExportMessage("Report downloaded!");
    } else {
      const content = exportDiagnosticResultJSON(payload);
      downloadAsFile(content, `diagnosis-${result.id}.json`, "application/json");
      setExportMessage("JSON exported!");
    }
    
    setTimeout(() => setExportMessage(null), 2000);
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    const content = exportDiagnosticResult({ result, vehicle, observations, scores });
    const success = await copyToClipboard(content);
    setExportMessage(success ? "Copied to clipboard!" : "Copy failed");
    setTimeout(() => setExportMessage(null), 2000);
  };

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

      {/* Post-Result Actions */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          background: "rgba(255,255,255,0.02)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        data-testid="post-result-actions"
      >
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Actions</h3>
        
        {/* Export Message */}
        {exportMessage && (
          <div
            style={{
              padding: 8,
              marginBottom: 12,
              background: "rgba(34,197,94,0.2)",
              borderRadius: 6,
              fontSize: 13,
              textAlign: "center",
            }}
            data-testid="export-message"
          >
            ✓ {exportMessage}
          </div>
        )}

        {/* Feedback Submitted Message */}
        {feedbackSubmitted && (
          <div
            style={{
              padding: 8,
              marginBottom: 12,
              background: "rgba(59,130,246,0.2)",
              borderRadius: 6,
              fontSize: 13,
              textAlign: "center",
            }}
            data-testid="feedback-submitted"
          >
            ✓ Feedback exported — Thank you!
          </div>
        )}

        {/* I think it's something else */}
        {!isSafetyOverride && !showFeedbackForm && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
              Not what you expected?
            </div>
            <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
              {onRerunExcluding && result.topHypothesis && (
                <button
                  className="button"
                  onClick={handleRerunExcluding}
                  style={{ padding: "8px 12px", fontSize: 12 }}
                  data-testid="btn-rerun-excluding"
                >
                  Re-run excluding "{getHypothesisLabel(result.topHypothesis)}"
                </button>
              )}
              <button
                className="button"
                onClick={() => setShowFeedbackForm(true)}
                style={{ padding: "8px 12px", fontSize: 12 }}
                data-testid="btn-submit-feedback"
              >
                Submit feedback to developer
              </button>
            </div>
          </div>
        )}

        {/* Feedback Form */}
        {showFeedbackForm && (
          <div
            style={{
              padding: 12,
              background: "rgba(0,0,0,0.2)",
              borderRadius: 8,
              marginBottom: 12,
            }}
            data-testid="feedback-form"
          >
            <h4 style={{ margin: "0 0 8px", fontSize: 13 }}>Submit Feedback</h4>
            <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
              Your feedback helps improve the diagnostic engine. Include what you think the actual issue is.
            </p>
            <textarea
              className="button"
              placeholder="e.g., I believe the issue is actually the fuel pump because..."
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              style={{
                width: "100%",
                minHeight: 80,
                resize: "vertical",
                boxSizing: "border-box",
                marginBottom: 8,
              }}
              data-testid="feedback-notes"
            />
            <div className="row" style={{ gap: 8 }}>
              <button
                className="button"
                onClick={handleSubmitFeedback}
                style={{ padding: "8px 12px", fontSize: 12 }}
                data-testid="btn-send-feedback"
              >
                Export Feedback
              </button>
              <button
                className="button"
                onClick={() => setShowFeedbackForm(false)}
                style={{ padding: "8px 12px", fontSize: 12, opacity: 0.7 }}
                data-testid="btn-cancel-feedback"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Save / Export */}
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
            Save this result:
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <button
              className="button"
              onClick={() => handleExport("text")}
              style={{ padding: "8px 12px", fontSize: 12 }}
              data-testid="btn-export-text"
            >
              📄 Download Report
            </button>
            <button
              className="button"
              onClick={() => handleExport("json")}
              style={{ padding: "8px 12px", fontSize: 12 }}
              data-testid="btn-export-json"
            >
              📋 Export JSON
            </button>
            <button
              className="button"
              onClick={handleCopyToClipboard}
              style={{ padding: "8px 12px", fontSize: 12 }}
              data-testid="btn-copy-clipboard"
            >
              📎 Copy to Clipboard
            </button>
          </div>
        </div>
      </div>

      {/* Result ID for reference */}
      <div style={{ marginTop: 16, fontSize: 11, opacity: 0.4 }} data-testid="result-id">
        Result ID: {result.id || "N/A"}
      </div>
    </section>
  );
}
