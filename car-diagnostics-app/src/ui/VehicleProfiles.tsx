/**
 * /src/ui/VehicleProfiles.tsx
 * PRESENTATION ONLY
 */

import React from "react";

export function VehicleProfiles() {
  return (
    <section className="card" data-testid="vehicle-profiles">
      <h2 style={{ marginTop: 0 }} data-testid="vehicle-profiles-title">
        Vehicle Profiles (Placeholder)
      </h2>
      <p data-testid="vehicle-profiles-note">
        TODO: Wire local-first persistence via <code>/src/storage/localStore.ts</code>.
      </p>
    </section>
  );
}
