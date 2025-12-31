/**
 * /src/ui/DiagnosticFlow.tsx
 * PRESENTATION ONLY
 *
 * Diagnostic Flow Wiring (REAL DATA)
 * - Uses real persisted observations
 * - Uses active vehicle profile id
 * - Engine invocation remains unchanged
 * - Includes safety reroute UX
 */

import React, { useState } from "react";
import { runDiagnosticEngine } from "../engine/diagnosticEngine";
import { evaluateSafety } from "../core/safety";
import type { DiagnosticResult } from "../models/diagnosticResult";
import type { ObservationResponse } from "../core/observations";
import type { Vehicle } from "../models/vehicle";
import type { SafetyEvaluation } from "../core/safety";
import type { HypothesisFamilyId } from "../diagnostics/hypothesisFamilies";
import { SafetyPanel } from "./SafetyPanel";
import { ProControls } from "./ProControls";
import { addDiagnosticResult } from "../storage/localStore";

type DiagnosticFlowProps = {
  vehicle: Vehicle | null;
  observations: ObservationResponse[];
  isPro: boolean;
  onResult: (result: DiagnosticResult, scores?: Record<string, number>) => void;
};

export function DiagnosticFlow({ vehicle, observations, isPro, onResult }: DiagnosticFlowProps) {
  const [entryAnchor, setEntryAnchor] = useState<string>("wont_start");
  const [safety, setSafety] = useState<SafetyEvaluation | null>(null);
  const [excludedFamilies, setExcludedFamilies] = useState<Set<HypothesisFamilyId>>(new Set());
  const [isRunning, setIsRunning] = useState(false);

  // Check if we can run diagnosis
  const canRun = vehicle !== null;

  const handleRunDiagnosis = () => {
    if (!vehicle) return;

    // Evaluate safety for advisory display (does NOT block)
    const safetyEval = evaluateSafety(observations);
    setSafety(safetyEval);

    // Run diagnosis immediately - safety is advisory only
    runDiagnosisEngine();
  };

  const runDiagnosisEngine = () => {
    if (!vehicle) return;

    setIsRunning(true);

    // Small delay for UX feedback
    setTimeout(() => {
      const output = runDiagnosticEngine({
        vehicleId: vehicle.id,
        entryAnchor: entryAnchor as any,
        observations: observations,
        resultId: crypto.randomUUID(),
      });

      // Save result to storage
      addDiagnosticResult(output.result);

      // Pass to parent
      onResult(output.result, output.scores);
      setIsRunning(false);
    }, 300);
  };

  const handleExcludedChange = (excluded: Set<HypothesisFamilyId>) => {
    setExcludedFamilies(excluded);
  };

  // No vehicle gate
  if (!vehicle) {
    return (
      <section className="card" data-testid="diagnostic-flow">
        <h2 style={{ marginTop: 0 }} data-testid="diagnostic-flow-title">
          Diagnostic Flow
        </h2>
        <div
          style={{
            padding: 24,
            textAlign: "center",
            background: "rgba(234,179,8,0.1)",
            borderRadius: 8,
            border: "1px dashed rgba(234,179,8,0.3)",
          }}
          data-testid="no-vehicle-gate"
        >
          <span style={{ fontSize: 32 }}>🚗</span>
          <h3 style={{ margin: "12px 0 8px" }}>No Vehicle Selected</h3>
          <p style={{ fontSize: 14, opacity: 0.8, margin: 0 }}>
            Please go to the <strong>Vehicles</strong> tab and create or select a vehicle profile before running diagnostics.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="card" data-testid="diagnostic-flow">
      <h2 style={{ marginTop: 0 }} data-testid="diagnostic-flow-title">
        Diagnostic Flow
      </h2>

      {/* Active vehicle display */}
      <div
        style={{
          padding: 12,
          background: "rgba(59,130,246,0.1)",
          borderRadius: 8,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        data-testid="active-vehicle-display"
      >
        <div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>Diagnosing:</div>
          <div style={{ fontWeight: 600 }}>
            {vehicle.name} — {vehicle.year ? `${vehicle.year} ` : ""}
            {vehicle.make} {vehicle.model}
          </div>
        </div>
        <div className="badge">
          {observations.length > 0 ? `${observations.length} observations` : "No observations"}
        </div>
      </div>

      {/* Safety Panel (advisory only - does not block) */}
      {safety && safety.safetyOverride && (
        <SafetyPanel safety={safety} />
      )}

      {/* Entry Anchor Selection */}
      <div className="row" style={{ alignItems: "center", marginBottom: 16 }}>
        <label htmlFor="entryAnchor" data-testid="entry-anchor-label" style={{ whiteSpace: "nowrap" }}>
          What's the main issue?
        </label>
        <select
          id="entryAnchor"
          className="button"
          value={entryAnchor}
          onChange={(e) => setEntryAnchor(e.target.value)}
          style={{ flex: 1, maxWidth: 300 }}
          data-testid="entry-anchor-select"
        >
          <option value="wont_start">Won't start</option>
          <option value="starts_then_dies">Starts then dies</option>
          <option value="noise">Strange noise</option>
          <option value="electrical">Electrical issues</option>
          <option value="braking_handling">Braking / handling problems</option>
          <option value="hvac_smells">HVAC / smells</option>
        </select>
      </div>

      {/* Observations Summary */}
      {observations.length === 0 ? (
        <div
          style={{
            padding: 16,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
          data-testid="observations-hint"
        >
          💡 <strong>Tip:</strong> Go to the <strong>Observations</strong> section below to select symptoms you've noticed. The more observations you provide, the better the diagnosis.
        </div>
      ) : (
        <div
          style={{
            padding: 12,
            background: "rgba(34,197,94,0.1)",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
          data-testid="observations-ready"
        >
          ✓ <strong>{observations.length} observations</strong> recorded for this vehicle. Ready to diagnose.
        </div>
      )}

      {/* Pro Controls */}
      <ProControls
        isPro={isPro}
        excludedFamilies={excludedFamilies}
        onExcludedChange={handleExcludedChange}
      />

      {/* Run Button */}
      <div style={{ marginTop: 20 }}>
        <button
          className="button"
          onClick={handleRunDiagnosis}
          disabled={!canRun || isRunning}
          style={{
            padding: "14px 28px",
            fontSize: 16,
            fontWeight: 600,
            background: canRun ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.05)",
            borderColor: canRun ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.1)",
            opacity: isRunning ? 0.7 : 1,
          }}
          data-testid="run-diagnosis-button"
        >
          {isRunning ? "Analyzing..." : "Run Diagnosis"}
        </button>
      </div>

      {/* Debug info */}
      <div style={{ marginTop: 12 }} data-testid="diagnostic-flow-debug">
        <div className="badge">Entry: {entryAnchor}</div>
        {excludedFamilies.size > 0 && (
          <div className="badge" style={{ marginLeft: 8, background: "rgba(139,92,246,0.2)" }}>
            {excludedFamilies.size} excluded
          </div>
        )}
      </div>
    </section>
  );
}
