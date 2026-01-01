/**
 * /src/ui/Results.tsx
 * PRESENTATION ONLY
 * 
 * Results screen shows:
 * - Top hypothesis
 * - Confidence band
 * - Supporting engine signals
 * - Garage Integration (references notes/maintenance)
 * - Save to Garage / Export options
 * - "I think it's something else" button
 */

import React, { useState, useEffect } from "react";
import type { DiagnosticResult } from "../models/diagnosticResult";
import type { Vehicle } from "../models/vehicle";
import type { GarageNote } from "../models/garageNote";
import type { MaintenanceEvent } from "../models/maintenance";
import {
  saveDiagnosticResult,
  getGarageNotes,
  getMaintenanceEvents,
  getActiveVehicle,
} from "../storage/localStore";
import { exportDiagnosticPayload, createFeedbackPayload } from "../utils/export";

type ResultsProps = {
  result: DiagnosticResult;
  vehicleId: string | null;
  vehicle?: Vehicle | null;
  diagnosticAnswers?: Record<string, string>;
  onBackToFlow?: () => void;
};

export function Results({
  result,
  vehicleId,
  vehicle,
  diagnosticAnswers = {},
  onBackToFlow,
}: ResultsProps) {
  const [saved, setSaved] = useState(false);
  const [showFeedbackOptions, setShowFeedbackOptions] = useState(false);
  const [userNotes, setUserNotes] = useState("");
  const [relevantNotes, setRelevantNotes] = useState<GarageNote[]>([]);
  const [relevantMaintenance, setRelevantMaintenance] = useState<MaintenanceEvent[]>([]);

  // Load relevant garage data
  useEffect(() => {
    if (vehicleId) {
      const notes = getGarageNotes(vehicleId);
      const maintenance = getMaintenanceEvents(vehicleId);

      // Filter for recent/relevant items (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      setRelevantNotes(
        notes
          .filter((n) => !n.resolved)
          .slice(0, 5)
      );

      setRelevantMaintenance(
        maintenance
          .filter((m) => new Date(m.date) > sixMonthsAgo)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
      );
    }
  }, [vehicleId]);

  // Get confidence band label
  const getConfidenceBand = (confidence: number): { label: string; color: string } => {
    if (confidence >= 0.7) return { label: "High", color: "rgba(100,200,100,0.3)" };
    if (confidence >= 0.4) return { label: "Medium", color: "rgba(200,200,100,0.3)" };
    return { label: "Low", color: "rgba(200,100,100,0.3)" };
  };

  const confidenceBand = getConfidenceBand(result.confidence);

  // Handle save to garage
  const handleSave = () => {
    if (!vehicleId) return;

    saveDiagnosticResult({
      vehicleId,
      result,
      userNotes: userNotes || undefined,
    });
    setSaved(true);
  };

  // Handle export
  const handleExport = () => {
    const activeVehicle = vehicle || (vehicleId ? getActiveVehicle() : null);
    const payload = exportDiagnosticPayload(
      result,
      userNotes || undefined,
      activeVehicle || undefined,
      vehicleId ? relevantNotes : undefined,
      vehicleId ? relevantMaintenance : undefined,
      diagnosticAnswers
    );

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostic-${result.id?.slice(0, 8) || "result"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle feedback options
  const handleFeedback = (type: "rerun_excluding" | "submit_feedback") => {
    const activeVehicle = vehicle || (vehicleId ? getActiveVehicle() : null);
    const payload = createFeedbackPayload(
      result,
      type,
      userNotes || undefined,
      activeVehicle || undefined,
      diagnosticAnswers
    );

    if (type === "submit_feedback") {
      // For now, download the feedback payload
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-${result.id?.slice(0, 8) || "result"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setShowFeedbackOptions(false);
    } else {
      // Re-run excluding - TODO: implement in future
      alert(
        "Re-run excluding this hypothesis is a Pro feature coming soon.\n\nYour feedback has been noted."
      );
      setShowFeedbackOptions(false);
    }
  };

  return (
    <section className="card" data-testid="results-panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }} data-testid="results-title">
          Diagnostic Results
        </h2>
        {onBackToFlow && (
          <button
            className="button"
            onClick={onBackToFlow}
            data-testid="back-to-flow-button"
            style={{ padding: "8px 16px" }}
          >
            ← Back to Questions
          </button>
        )}
      </div>

      {/* Top Hypothesis */}
      <div
        className="card"
        style={{
          background: "rgba(100,150,255,0.15)",
          marginBottom: 16,
        }}
        data-testid="top-hypothesis-card"
      >
        <h3 style={{ margin: "0 0 8px" }}>Top Hypothesis</h3>
        <div style={{ fontSize: 24, fontWeight: "bold" }} data-testid="results-top-hypothesis">
          {result.topHypothesis || "Unable to determine"}
        </div>
      </div>

      {/* Confidence Band */}
      <div className="row" style={{ marginBottom: 16 }} data-testid="results-summary-row">
        <div
          className="badge"
          style={{ background: confidenceBand.color, padding: "8px 16px" }}
          data-testid="results-confidence"
        >
          Confidence: {confidenceBand.label} ({Math.round(result.confidence * 100)}%)
        </div>
        <div className="badge" style={{ padding: "8px 16px" }}>
          Entry: {result.entryAnchor.replace(/_/g, " ")}
        </div>
      </div>

      {/* Confidence explanation */}
      <p style={{ opacity: 0.8, fontSize: 14, marginBottom: 16 }}>
        {confidenceBand.label === "High" &&
          "The diagnosis has high confidence based on the symptoms you reported."}
        {confidenceBand.label === "Medium" &&
          "The diagnosis has moderate confidence. Consider verifying with additional checks."}
        {confidenceBand.label === "Low" &&
          "The diagnosis has low confidence. More information may be needed for a reliable diagnosis."}
      </p>

      {/* Safety Notes */}
      {Array.isArray(result.safetyNotes) && result.safetyNotes.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "rgba(255,100,100,0.15)",
            borderRadius: 8,
          }}
          data-testid="results-notes"
        >
          <h3 style={{ margin: "0 0 8px", color: "#ff6b6b" }} data-testid="results-safety-notes-title">
            ⚠️ Safety Notes
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20 }} data-testid="results-safety-notes-list">
            {result.safetyNotes.map((n, i) => (
              <li key={i} data-testid="results-safety-note-item">
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Garage Context - Relevant Notes */}
      {relevantNotes.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
          }}
          data-testid="relevant-notes"
        >
          <h3 style={{ margin: "0 0 8px" }}>Related Garage Notes</h3>
          <p style={{ opacity: 0.7, fontSize: 12, margin: "0 0 8px" }}>
            These notes from your garage may be relevant (informational only)
          </p>
          {relevantNotes.map((note) => (
            <div
              key={note.id}
              style={{
                padding: "8px",
                marginBottom: 4,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 4,
              }}
            >
              <span className="badge" style={{ textTransform: "capitalize", marginRight: 8 }}>
                {note.category}
              </span>
              {note.text}
            </div>
          ))}
        </div>
      )}

      {/* Garage Context - Recent Maintenance */}
      {relevantMaintenance.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
          }}
          data-testid="relevant-maintenance"
        >
          <h3 style={{ margin: "0 0 8px" }}>Recent Maintenance</h3>
          <p style={{ opacity: 0.7, fontSize: 12, margin: "0 0 8px" }}>
            Recent work done on this vehicle (informational only)
          </p>
          {relevantMaintenance.map((event) => (
            <div
              key={event.id}
              style={{
                padding: "8px",
                marginBottom: 4,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 4,
              }}
            >
              <strong>{event.type}</strong>
              <span style={{ opacity: 0.7, marginLeft: 8 }}>{event.date}</span>
              {event.mileage > 0 && (
                <span className="badge" style={{ marginLeft: 8 }}>
                  {event.mileage.toLocaleString()} mi
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* User Notes Input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Add notes (optional):
        </label>
        <textarea
          className="button"
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          placeholder="Add any additional notes about this diagnosis..."
          style={{ width: "100%", minHeight: 80, resize: "vertical" }}
          data-testid="user-notes-input"
        />
      </div>

      {/* Action Buttons */}
      <div className="row" style={{ marginBottom: 16 }} data-testid="result-actions">
        {vehicleId && !saved && (
          <button
            className="button"
            onClick={handleSave}
            style={{ padding: "12px 20px" }}
            data-testid="save-result-btn"
          >
            💾 Save to Garage
          </button>
        )}
        {saved && (
          <span
            className="badge"
            style={{ background: "rgba(100,200,100,0.3)", padding: "12px 20px" }}
          >
            ✓ Saved to Garage
          </span>
        )}
        <button
          className="button"
          onClick={handleExport}
          style={{ padding: "12px 20px" }}
          data-testid="export-result-btn"
        >
          📤 Export
        </button>
      </div>

      {/* Post-Result Actions */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: 16,
          marginTop: 16,
        }}
      >
        <button
          className="button"
          onClick={() => setShowFeedbackOptions(!showFeedbackOptions)}
          style={{ width: "100%", textAlign: "left", padding: "14px 16px" }}
          data-testid="feedback-toggle-btn"
        >
          🤔 I think it's something else
          <span style={{ float: "right" }}>{showFeedbackOptions ? "▲" : "▼"}</span>
        </button>

        {showFeedbackOptions && (
          <div
            className="card"
            style={{
              marginTop: 8,
              background: "rgba(255,255,255,0.04)",
            }}
            data-testid="feedback-options"
          >
            <p style={{ marginTop: 0, opacity: 0.8 }}>
              If you believe the diagnosis is incorrect, you can:
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              <button
                className="button"
                onClick={() => handleFeedback("rerun_excluding")}
                style={{ textAlign: "left", padding: "12px" }}
                data-testid="rerun-excluding-btn"
              >
                <strong>Re-run excluding this hypothesis</strong>
                <br />
                <span style={{ opacity: 0.7, fontSize: 13 }}>
                  Temporarily exclude "{result.topHypothesis}" and re-diagnose
                </span>
              </button>
              <button
                className="button"
                onClick={() => handleFeedback("submit_feedback")}
                style={{ textAlign: "left", padding: "12px" }}
                data-testid="submit-feedback-btn"
              >
                <strong>Submit feedback to developer</strong>
                <br />
                <span style={{ opacity: 0.7, fontSize: 13 }}>
                  Help us improve by sharing this diagnostic session
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
