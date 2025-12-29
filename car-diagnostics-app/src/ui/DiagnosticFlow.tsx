/**
 * /src/ui/DiagnosticFlow.tsx
 * PRESENTATION ONLY
 */

import React, { useState } from "react";

import { runDiagnosticEngine } from "../engine/diagnosticEngine";
import { OBSERVATION_VALUE } from "../core/observations";

// TODO: Replace with types from /diagnostics/entryAnchors when engine wiring is added.

export function DiagnosticFlow() {
  const [entryAnchor, setEntryAnchor] = useState<string>("wont_start");

  return (
    <section className="card" data-testid="diagnostic-flow">
      <h2 style={{ marginTop: 0 }} data-testid="diagnostic-flow-title">
        Diagnostic Flow (Placeholder)
      </h2>
      <p data-testid="diagnostic-flow-note">
        TODO: This UI will collect observations/clarifiers and then call the orchestration layer in <code>/src/engine</code>.
        No scoring/safety logic exists in the UI.
      </p>

      <div className="row" style={{ alignItems: "center" }}>
        <label htmlFor="entryAnchor" data-testid="entry-anchor-label">
          Entry Anchor
        </label>
        <select
          id="entryAnchor"
          className="button"
          value={entryAnchor}
          onChange={(e) => setEntryAnchor(e.target.value)}
          data-testid="entry-anchor-select"
        >
          <option value="wont_start">Won’t start</option>
          <option value="starts_then_dies">Starts then dies</option>
          <option value="noise">Noise</option>
          <option value="electrical">Electrical</option>
          <option value="braking_handling">Braking / handling</option>
          <option value="hvac_smells">HVAC / smells</option>
        </select>

        <button
  className="button"
  data-testid="run-diagnosis-button"
  onClick={() => {
    const result = runDiagnosticEngine({
      vehicleId: "test-vehicle",
      entryAnchor,
      observations: [
        {
          id: "battery_weak",
          value: OBSERVATION_VALUE.YES,
        },
      ],
    });

    console.log("Diagnostic result:", result);
  }}
>
  Run diagnosis (mock)
</button>
      </div>

      <div style={{ marginTop: 12 }} data-testid="diagnostic-flow-debug">
        <div className="badge">Selected: {entryAnchor}</div>
      </div>
    </section>
  );
}
