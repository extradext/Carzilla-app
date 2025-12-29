/**
 * /src/ui/Observations.tsx
 * PRESENTATION ONLY
 */

import React, { useState } from "react";

export function Observations() {
  const [text, setText] = useState("");

  return (
    <section className="card" data-testid="observations-panel">
      <h2 style={{ marginTop: 0 }} data-testid="observations-title">
        Observations (Placeholder)
      </h2>

      <p data-testid="observations-note">
        TODO: This will map user inputs to canonical observation IDs in <code>/src/core/observations.ts</code>.
        “Skip/Unsure” must always be allowed.
      </p>

      <div className="row" style={{ alignItems: "center" }}>
        <input
          className="button"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe what you observed..."
          style={{ minWidth: 320 }}
          data-testid="observations-text-input"
        />
        <button
          className="button"
          data-testid="observations-add-button"
          onClick={() => {
            // TODO: Add to local store.
            // eslint-disable-next-line no-console
            console.log("TODO: add observation", { text });
            setText("");
          }}
        >
          Add (TODO)
        </button>
        <button
          className="button"
          data-testid="observations-skip-button"
          onClick={() => {
            // Skip/Unsure placeholder.
            // eslint-disable-next-line no-console
            console.log("TODO: skip/unsure");
          }}
        >
          Skip / Unsure
        </button>
      </div>
    </section>
  );
}
