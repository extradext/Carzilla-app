/**
 * /src/ui/Results.tsx
 * PRESENTATION ONLY
 */

import React from "react";

type ResultsProps = {
  // Engine output placeholder shape.
  result: {
    topHypothesis: string;
    confidence: number;
    band: string;
    safetyNotes?: string[];
  };
};

export function Results({ result }: ResultsProps) {
  return (
    <section className="card" data-testid="results-panel">
      <h2 style={{ marginTop: 0 }} data-testid="results-title">
        Results (Mock)
      </h2>

      <div className="row" data-testid="results-summary-row">
        <div className="badge" data-testid="results-top-hypothesis">
          Top hypothesis: {result.topHypothesis}
        </div>
        <div className="badge" data-testid="results-confidence">
          Confidence: {result.confidence}%
        </div>
        <div className="badge" data-testid="results-band">
          Band: {result.band}
        </div>
      </div>

      <div style={{ marginTop: 12 }} data-testid="results-notes">
        <h3 style={{ margin: "8px 0" }} data-testid="results-safety-notes-title">
          Safety notes
        </h3>
        <ul data-testid="results-safety-notes-list">
          {(result.safetyNotes ?? ["TODO: Safety notes will be produced by /src/core/safety"]).map((n) => (
            <li key={n} data-testid="results-safety-note-item">
              {n}
            </li>
          ))}
        </ul>
      </div>

      
    </section>
  );
}
