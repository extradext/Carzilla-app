/**
 * /src/ui/App.tsx
 * PRESENTATION ONLY (per file contracts)
 *
 * Consumes engine outputs. Must not contain scoring/safety logic.
 * 
 * Panel Structure:
 * - Top: Vehicle selector
 * - Panels: Diagnose, Results, My Garage, Tips & Tricks, Settings
 */

import React, { useState, useEffect, useCallback } from "react";
import type { DiagnosticResult } from "../models/diagnosticResult";
import type { Vehicle } from "../models/vehicle";
import { DiagnosticFlow } from "./DiagnosticFlow";
import { Results } from "./Results";
import { VehicleSelector, VehicleProfiles } from "./VehicleProfiles";
import { MyGarage } from "./MyGarage";
import { TipsAndTricks } from "./TipsAndTricks";
import { Settings } from "./Settings";
import { isSafetyAcknowledged, setSafetyAcknowledged, getVehicles, getActiveVehicle } from "../storage/localStore";

type Tab = "diagnose" | "results" | "garage" | "tips" | "vehicles" | "settings";

export function App() {
  const [tab, setTab] = useState<Tab>("diagnose");
  const [lastResult, setLastResult] = useState<DiagnosticResult | null>(null);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [showSafetyDisclaimer, setShowSafetyDisclaimer] = useState(false);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>({});
  const [vehicleRefreshKey, setVehicleRefreshKey] = useState(0);

  // Check safety disclaimer on launch
  useEffect(() => {
    if (!isSafetyAcknowledged()) {
      setShowSafetyDisclaimer(true);
    }
    // Load initial active vehicle
    const active = getActiveVehicle();
    if (active) {
      setActiveVehicle(active);
    }
  }, []);

  const handleSafetyAcknowledge = () => {
    setSafetyAcknowledged();
    setShowSafetyDisclaimer(false);
  };

  const handleVehicleChange = useCallback((vehicle: Vehicle | null) => {
    setActiveVehicle(vehicle);
    // Clear result when switching vehicles
    setLastResult(null);
    setDiagnosticAnswers({});
  }, []);

  // Trigger refresh of vehicle selector when returning from Vehicles tab
  const handleTabChange = (newTab: Tab) => {
    if (tab === "vehicles" && newTab !== "vehicles") {
      // Coming back from vehicles tab, refresh the selector
      setVehicleRefreshKey((k) => k + 1);
      // Also refresh active vehicle from storage
      const active = getActiveVehicle();
      if (active) {
        setActiveVehicle(active);
      }
    }
    setTab(newTab);
  };

  const handleDiagnosticResult = (result: DiagnosticResult, answers: Record<string, string>) => {
    setLastResult(result);
    setDiagnosticAnswers(answers);
    setTab("results");
  };

  return (
    <div className="container" data-testid="app-shell">
      {/* Safety Disclaimer Modal - One time on app launch */}
      {showSafetyDisclaimer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          data-testid="safety-disclaimer"
        >
          <div className="card" style={{ maxWidth: 500, textAlign: "center" }}>
            <h2 style={{ marginTop: 0, color: "#ffd700" }}>⚠️ Safety Notice</h2>
            <p style={{ fontSize: 18, margin: "20px 0" }}>
              Use diagnostics only while the vehicle is stationary.
            </p>
            <p style={{ opacity: 0.8 }}>
              Never attempt to diagnose or inspect your vehicle while driving or with the engine
              running unless specifically instructed by a professional.
            </p>
            <button
              className="button"
              onClick={handleSafetyAcknowledge}
              style={{ marginTop: 20, padding: "12px 32px", fontSize: 16 }}
              data-testid="safety-acknowledge-btn"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      <header style={{ marginBottom: 20 }}>
        {/* Top: Vehicle Selector */}
        <div
          className="row"
          style={{ alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}
        >
          <div>
            <h1 style={{ margin: 0 }} data-testid="app-title">
              Car Diagnostics
            </h1>
          </div>
          <VehicleSelector onVehicleChange={handleVehicleChange} />
        </div>

        {/* Navigation Tabs */}
        <nav className="row" data-testid="app-nav">
          <button
            className="button"
            data-testid="nav-diagnose"
            onClick={() => setTab("diagnose")}
            style={tab === "diagnose" ? { background: "rgba(255,255,255,0.2)" } : {}}
          >
            Diagnose
          </button>
          <button
            className="button"
            data-testid="nav-results"
            onClick={() => setTab("results")}
            style={tab === "results" ? { background: "rgba(255,255,255,0.2)" } : {}}
          >
            Results
          </button>
          <button
            className="button"
            data-testid="nav-garage"
            onClick={() => setTab("garage")}
            style={tab === "garage" ? { background: "rgba(255,255,255,0.2)" } : {}}
          >
            My Garage
          </button>
          <button
            className="button"
            data-testid="nav-tips"
            onClick={() => setTab("tips")}
            style={tab === "tips" ? { background: "rgba(255,255,255,0.2)" } : {}}
          >
            Tips & Tricks
          </button>
          <button
            className="button"
            data-testid="nav-vehicles"
            onClick={() => setTab("vehicles")}
            style={tab === "vehicles" ? { background: "rgba(255,255,255,0.2)" } : {}}
          >
            Vehicles
          </button>
          <button
            className="button"
            data-testid="nav-settings"
            onClick={() => setTab("settings")}
            style={tab === "settings" ? { background: "rgba(255,255,255,0.2)" } : {}}
          >
            Settings
          </button>
        </nav>
      </header>

      <main data-testid="app-main">
        {tab === "diagnose" && (
          <DiagnosticFlow
            vehicleId={activeVehicle?.id ?? null}
            onResult={handleDiagnosticResult}
          />
        )}

        {tab === "results" && lastResult && (
          <Results
            result={lastResult}
            vehicleId={activeVehicle?.id ?? null}
            vehicle={activeVehicle}
            diagnosticAnswers={diagnosticAnswers}
            onBackToFlow={() => setTab("diagnose")}
          />
        )}
        {tab === "results" && !lastResult && (
          <div className="card" data-testid="results-empty">
            <h2 style={{ marginTop: 0 }}>Results</h2>
            <p>No diagnostic results yet. Run a diagnosis to see results here.</p>
            <button className="button" onClick={() => setTab("diagnose")}>
              Start Diagnosis
            </button>
          </div>
        )}

        {tab === "garage" && (
          <MyGarage vehicleId={activeVehicle?.id ?? null} vehicleName={activeVehicle?.nickname} />
        )}

        {tab === "tips" && <TipsAndTricks />}

        {tab === "vehicles" && <VehicleProfiles onVehicleChange={handleVehicleChange} />}

        {tab === "settings" && <Settings />}
      </main>
    </div>
  );
}
