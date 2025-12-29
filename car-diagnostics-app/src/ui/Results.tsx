/**
 * /src/ui/Results.tsx
 * PRESENTATION ONLY
 */

import React from "react";
import type { DiagnosticResult } from "../models/diagnosticResult";

type ResultsProps = {
  result: DiagnosticResult;
};

export function Results({ result }: ResultsProps) {
  return (
    <section className="card" data-testid="results-panel">
      <h2 style={{ marginTop: 0 }} data-testid="results-title">
        Results
      </h2>

      <div className="row" data-testid="results-summary-row">
        <div className="badge" data-testid="results-top-hypothesis">
          Top hypothesis: {result.topHypothesis ?? ""}
        </div>
        <div className="badge" data-testid="results-confidence">
          Confidence: {result.confidence}
        </div>
      </div>

      {Array.isArray(result.safetyNotes) && result.safetyNotes.length > 0 && (
        <div style={{ marginTop: 12 }} data-testid="results-notes">
          <h3 style={{ margin: "8px 0" }} data-testid="results-safety-notes-title">
            Safety notes
          </h3>
          <ul data-testid="results-safety-notes-list">
            {result.safetyNotes.map((n) => (
              <li key={n} data-testid="results-safety-note-item">
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
