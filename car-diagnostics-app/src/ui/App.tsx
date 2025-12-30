/**
 * /src/ui/App.tsx
 * PRESENTATION ONLY (per file contracts)
 *
 * Consumes engine outputs. Must not contain scoring/safety logic.
 * Wires all components together with proper state management.
 */

import React, { useState, useEffect, useCallback } from "react";
import type { DiagnosticResult } from "../models/diagnosticResult";
import type { Vehicle } from "../models/vehicle";
import type { UserPreferences } from "../models/userPreferences";
import type { ObservationResponse } from "../core/observations";
import type { KnownIssue } from "../engine/contextEvaluator";
import { DiagnosticFlow } from "./DiagnosticFlow";
import { Results } from "./Results";
import { VehicleProfiles } from "./VehicleProfiles";
import { Maintenance } from "./Maintenance";
import { Settings } from "./Settings";
import { Observations } from "./Observations";
import {
  getActiveVehicle,
  getObservationsForVehicle,
  getUserPreferences,
  getNotesForVehicle,
} from "../storage/localStore";

type Tab = "diagnose" | "results" | "vehicles" | "maintenance" | "settings";

export function App() {
  // Core state
  const [tab, setTab] = useState<Tab>("diagnose");
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(getActiveVehicle);
  const [observations, setObservations] = useState<ObservationResponse[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences);
  
  // Diagnostic results
  const [lastResult, setLastResult] = useState<DiagnosticResult | null>(null);
  const [lastScores, setLastScores] = useState<Record<string, number> | undefined>(undefined);

  // Load observations when vehicle changes
  useEffect(() => {
    if (activeVehicle) {
      setObservations(getObservationsForVehicle(activeVehicle.id));
    } else {
      setObservations([]);
    }
  }, [activeVehicle?.id]);

  // Handle vehicle selection change
  const handleVehicleChange = useCallback((vehicle: Vehicle | null) => {
    setActiveVehicle(vehicle);
    // Clear previous results when switching vehicles
    setLastResult(null);
    setLastScores(undefined);
  }, []);

  // Handle observations change
  const handleObservationsChange = useCallback((newObservations: ObservationResponse[]) => {
    setObservations(newObservations);
  }, []);

  // Handle diagnostic result
  const handleResult = useCallback((result: DiagnosticResult, scores?: Record<string, number>) => {
    setLastResult(result);
    setLastScores(scores);
    setTab("results");
  }, []);

  // Handle vehicle update (e.g., from Maintenance)
  const handleVehicleUpdate = useCallback((vehicle: Vehicle) => {
    setActiveVehicle(vehicle);
  }, []);

  // Handle preferences change
  const handlePreferencesChange = useCallback((prefs: UserPreferences) => {
    setPreferences(prefs);
  }, []);

  // Get known issues from notes (for context panel)
  const knownIssues: KnownIssue[] = activeVehicle
    ? getNotesForVehicle(activeVehicle.id).map((note, i) => ({
        id: `note-${i}`,
        label: note,
      }))
    : [];

  // Check if vehicle profile exists (HARD GATE)
  const hasVehicle = activeVehicle !== null;

  return (
    <div className="container" data-testid="app-shell">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0 }} data-testid="app-title">
              🚗 Car Diagnostics
            </h1>
            {activeVehicle ? (
              <div className="badge" style={{ marginTop: 8 }} data-testid="app-subtitle">
                {activeVehicle.name} — {activeVehicle.year ? `${activeVehicle.year} ` : ""}{activeVehicle.make} {activeVehicle.model}
              </div>
            ) : (
              <div className="badge" style={{ marginTop: 8, background: "rgba(234,179,8,0.2)" }} data-testid="app-subtitle">
                No vehicle selected
              </div>
            )}
          </div>

          <nav className="row" data-testid="app-nav">
            <button
              className="button"
              onClick={() => setTab("diagnose")}
              style={{ background: tab === "diagnose" ? "rgba(59,130,246,0.3)" : undefined }}
              data-testid="nav-diagnose"
            >
              Diagnose
            </button>
            <button
              className="button"
              onClick={() => setTab("results")}
              style={{ background: tab === "results" ? "rgba(59,130,246,0.3)" : undefined }}
              data-testid="nav-results"
            >
              Results
              {lastResult && <span style={{ marginLeft: 6, opacity: 0.6 }}>•</span>}
            </button>
            <button
              className="button"
              onClick={() => setTab("vehicles")}
              style={{
                background: tab === "vehicles" ? "rgba(59,130,246,0.3)" : !hasVehicle ? "rgba(234,179,8,0.2)" : undefined,
              }}
              data-testid="nav-vehicles"
            >
              Vehicles
              {!hasVehicle && <span style={{ marginLeft: 6 }}>⚠️</span>}
            </button>
            <button
              className="button"
              onClick={() => setTab("maintenance")}
              style={{ background: tab === "maintenance" ? "rgba(59,130,246,0.3)" : undefined }}
              data-testid="nav-maintenance"
            >
              Maintenance
            </button>
            <button
              className="button"
              onClick={() => setTab("settings")}
              style={{ background: tab === "settings" ? "rgba(59,130,246,0.3)" : undefined }}
              data-testid="nav-settings"
            >
              Settings
            </button>
          </nav>
        </div>
      </header>

      <main data-testid="app-main">
        {/* Diagnose Tab */}
        {tab === "diagnose" && (
          <div style={{ display: "grid", gap: 20 }}>
            <DiagnosticFlow
              vehicle={activeVehicle}
              observations={observations}
              isPro={preferences.isPro}
              onResult={handleResult}
            />
            
            {/* Observations inline on diagnose tab */}
            <Observations
              vehicleId={activeVehicle?.id ?? null}
              observations={observations}
              onObservationsChange={handleObservationsChange}
            />
          </div>
        )}

        {/* Results Tab */}
        {tab === "results" && lastResult && (
          <Results
            result={lastResult}
            scores={lastScores}
            knownIssues={knownIssues}
          />
        )}
        {tab === "results" && !lastResult && (
          <div className="card" data-testid="results-empty">
            <div style={{ textAlign: "center", padding: 40 }}>
              <span style={{ fontSize: 48, opacity: 0.3 }}>📊</span>
              <h3 style={{ marginTop: 16 }}>No Results Yet</h3>
              <p style={{ opacity: 0.7 }}>
                Run a diagnosis from the <strong>Diagnose</strong> tab to see results here.
              </p>
            </div>
          </div>
        )}

        {/* Vehicles Tab */}
        {tab === "vehicles" && (
          <VehicleProfiles onVehicleChange={handleVehicleChange} />
        )}

        {/* Maintenance Tab */}
        {tab === "maintenance" && (
          <Maintenance
            vehicle={activeVehicle}
            onVehicleUpdate={handleVehicleUpdate}
          />
        )}

        {/* Settings Tab */}
        {tab === "settings" && (
          <Settings onPreferencesChange={handlePreferencesChange} />
        )}
      </main>

      <footer style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", opacity: 0.5, fontSize: 12 }} data-testid="app-footer">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Car Diagnostics App v0.1</span>
          <span>{preferences.isPro ? "⚡ Pro" : "Free"}</span>
        </div>
      </footer>
    </div>
  );
}
