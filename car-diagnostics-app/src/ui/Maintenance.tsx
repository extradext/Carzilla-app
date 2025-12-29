/**
 * /src/ui/Maintenance.tsx
 * PRESENTATION ONLY
 */

import React from "react";

export function Maintenance() {
  return (
    <section className="card" data-testid="maintenance-panel">
      <h2 style={{ marginTop: 0 }} data-testid="maintenance-title">
        Maintenance (Placeholder)
      </h2>
      <p data-testid="maintenance-note">
        TODO: Log maintenance events to local-first storage; no diagnostic logic here.
      </p>
    </section>
  );
}
