/**
 * /src/ui/DiagnosticFlow.tsx
 * PRESENTATION ONLY
 */

import React, { useState } from "react";
import { runDiagnosticEngine } from "../engine/diagnosticEngine";
import type { DiagnosticResult } from "../models/diagnosticResult";

type DiagnosticFlowProps = {
  onResult: (result: DiagnosticResult) => void;
};

export function DiagnosticFlow({ onResult }: DiagnosticFlowProps) {
  const [entryAnchor, setEntryAnchor] = useState<string>("wont_start");

  return (
    <section className="card" data-testid="diagnostic-flow">
      <h2 style={{ marginTop: 0 }} data-testid="diagnostic-flow-title">
        Diagnostic Flow
      </h2>

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
            const output = runDiagnosticEngine({
              vehicleId: "TODO",
              entryAnchor: entryAnchor as any,
              observations: [],
            });
            onResult(output.result);
          }}
        >
          Run diagnosis (TODO)
        </button>
      </div>

      <div style={{ marginTop: 12 }} data-testid="diagnostic-flow-debug">
        <div className="badge">Selected: {entryAnchor}</div>
      </div>
    </section>
  );
}
