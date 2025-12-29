/**
 * /src/ui/App.tsx
 * PRESENTATION ONLY (per file contracts)
 *
 * Consumes engine outputs. Must not contain scoring/safety logic.
 */

import React, { useMemo, useState } from "react";
import { DiagnosticFlow } from "./DiagnosticFlow";
import { Results } from "./Results";
import { VehicleProfiles } from "./VehicleProfiles";
import { Maintenance } from "./Maintenance";
import { Settings } from "./Settings";

type Tab = "diagnose" | "results" | "vehicles" | "maintenance" | "settings";

export function App() {
  const [tab, setTab] = useState<Tab>("diagnose");

  

const [result, setResult] = useState<DiagnosticResult | null>(null);

  return (
    <div className="container" data-testid="app-shell">
      <header className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }} data-testid="app-title">
            Car Diagnostics (Scaffold)
          </h1>
          <div className="badge" data-testid="app-subtitle">
            No diagnostic logic implemented
          </div>
        </div>

        <nav className="row" data-testid="app-nav">
          <button className="button" data-testid="nav-diagnose" onClick={() => setTab("diagnose")}>Diagnose</button>
          <button className="button" data-testid="nav-results" onClick={() => setTab("results")}>Results</button>
          <button className="button" data-testid="nav-vehicles" onClick={() => setTab("vehicles")}>Vehicles</button>
          <button className="button" data-testid="nav-maintenance" onClick={() => setTab("maintenance")}>Maintenance</button>
          <button className="button" data-testid="nav-settings" onClick={() => setTab("settings")}>Settings</button>
        </nav>
      </header>

      <main style={{ marginTop: 18 }} data-testid="app-main">
        {tab === "diagnose" && (
  <DiagnosticFlow onResult={setResult} />
)}
        {tab === "results" && (
          <Results
            // UI-only mock until engine is implemented.
            result={result}
          />
        )}
        {tab === "vehicles" && <VehicleProfiles />}
        {tab === "maintenance" && <Maintenance />}
        {tab === "settings" && <Settings />}
      </main>

      <footer style={{ marginTop: 20, opacity: 0.8 }} data-testid="app-footer">
        TODO: Wire /storage for persistence and /engine for orchestration.
      </footer>
    </div>
  );
}
