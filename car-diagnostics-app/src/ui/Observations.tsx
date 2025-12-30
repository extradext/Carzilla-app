/**
 * /src/ui/Observations.tsx
 * PRESENTATION ONLY
 *
 * Observations System (PERSISTENT PER VEHICLE)
 * - User-selectable diagnostic factors
 * - Persisted per vehicle profile
 * - Do NOT reset between diagnostic runs
 * - Manually toggled on/off by the user
 * - Categorized by domain
 * - UNSURE / SKIP supported implicitly (no weight)
 * - Users may add free-text notes
 */

import React, { useState, useMemo } from "react";
import {
  OBSERVATION_DEFINITIONS,
  OBSERVATION_VALUE,
  type ObservationId,
  type ObservationResponse,
  type ObservationDomain,
} from "../core/observations";
import {
  getObservationsForVehicle,
  saveObservationsForVehicle,
  getNotesForVehicle,
  addNoteForVehicle,
  deleteNoteForVehicle,
} from "../storage/localStore";

type ObservationsProps = {
  vehicleId: string | null;
  observations: ObservationResponse[];
  onObservationsChange: (observations: ObservationResponse[]) => void;
};

const DOMAIN_LABELS: Record<ObservationDomain, string> = {
  SAFETY: "Safety Critical",
  BATTERY: "Battery / Starting",
  ELECTRICAL: "Electrical",
  FUEL: "Fuel System",
  IGNITION: "Ignition / Misfire",
  BRAKES_HEAT_DRAG: "Brakes / Heat / Drag",
  TIRES_WHEELS: "Tires / Wheels",
  SUSPENSION: "Suspension",
  STEERING: "Steering",
  HVAC: "HVAC",
  SMELLS: "Smells",
};

const DOMAIN_ORDER: ObservationDomain[] = [
  "SAFETY",
  "BATTERY",
  "ELECTRICAL",
  "FUEL",
  "IGNITION",
  "BRAKES_HEAT_DRAG",
  "TIRES_WHEELS",
  "SUSPENSION",
  "STEERING",
  "HVAC",
  "SMELLS",
];

export function Observations({ vehicleId, observations, onObservationsChange }: ObservationsProps) {
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<string[]>(vehicleId ? getNotesForVehicle(vehicleId) : []);
  const [expandedDomains, setExpandedDomains] = useState<Set<ObservationDomain>>(new Set(["SAFETY"]));

  // Group observations by domain
  const observationsByDomain = useMemo(() => {
    const grouped: Record<ObservationDomain, Array<{ id: ObservationId; label: string; isSafetyCritical: boolean }>> = {
      SAFETY: [],
      BATTERY: [],
      ELECTRICAL: [],
      FUEL: [],
      IGNITION: [],
      BRAKES_HEAT_DRAG: [],
      TIRES_WHEELS: [],
      SUSPENSION: [],
      STEERING: [],
      HVAC: [],
      SMELLS: [],
    };

    Object.values(OBSERVATION_DEFINITIONS).forEach((def) => {
      grouped[def.domain].push({
        id: def.id,
        label: def.label,
        isSafetyCritical: def.isSafetyCritical,
      });
    });

    return grouped;
  }, []);

  // Get current value for an observation
  const getValue = (id: ObservationId): "YES" | "NO" | null => {
    const obs = observations.find((o) => o.id === id);
    if (!obs || !obs.value) return null;
    if (obs.value === OBSERVATION_VALUE.YES) return "YES";
    if (obs.value === OBSERVATION_VALUE.NO) return "NO";
    return null;
  };

  // Toggle observation value
  const handleToggle = (id: ObservationId, value: "YES" | "NO" | null) => {
    if (!vehicleId) return;

    let updated: ObservationResponse[];
    const existing = observations.find((o) => o.id === id);

    if (value === null) {
      // Remove observation (SKIP/UNSURE)
      updated = observations.filter((o) => o.id !== id);
    } else if (existing) {
      // Update existing
      updated = observations.map((o) =>
        o.id === id ? { ...o, value: OBSERVATION_VALUE[value] } : o
      );
    } else {
      // Add new
      updated = [...observations, { id, value: OBSERVATION_VALUE[value] }];
    }

    saveObservationsForVehicle(vehicleId, updated);
    onObservationsChange(updated);
  };

  // Handle adding a note
  const handleAddNote = () => {
    if (!vehicleId || !noteText.trim()) return;
    addNoteForVehicle(vehicleId, noteText);
    setNotes(getNotesForVehicle(vehicleId));
    setNoteText("");
  };

  // Handle deleting a note
  const handleDeleteNote = (index: number) => {
    if (!vehicleId) return;
    deleteNoteForVehicle(vehicleId, index);
    setNotes(getNotesForVehicle(vehicleId));
  };

  // Toggle domain expansion
  const toggleDomain = (domain: ObservationDomain) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedDomains(newExpanded);
  };

  // Count active observations in domain
  const getActiveCount = (domain: ObservationDomain): number => {
    return observationsByDomain[domain].filter((obs) => getValue(obs.id) !== null).length;
  };

  if (!vehicleId) {
    return (
      <section className="card" data-testid="observations-panel">
        <h2 style={{ marginTop: 0 }}>Observations</h2>
        <p style={{ opacity: 0.7 }}>Select a vehicle to manage observations.</p>
      </section>
    );
  }

  return (
    <section className="card" data-testid="observations-panel">
      <h2 style={{ marginTop: 0 }} data-testid="observations-title">
        Observations
      </h2>
      <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
        Select symptoms you've observed. These persist between diagnostic runs. Unselected items are treated as Skip/Unsure.
      </p>

      {/* Domain Categories */}
      <div style={{ display: "grid", gap: 8 }} data-testid="observation-categories">
        {DOMAIN_ORDER.map((domain) => {
          const items = observationsByDomain[domain];
          if (items.length === 0) return null;

          const isExpanded = expandedDomains.has(domain);
          const activeCount = getActiveCount(domain);
          const isSafetyDomain = domain === "SAFETY";

          return (
            <div
              key={domain}
              style={{
                background: isSafetyDomain ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)",
                borderRadius: 8,
                border: isSafetyDomain ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)",
              }}
              data-testid={`domain-${domain}`}
            >
              {/* Domain Header */}
              <button
                className="button"
                onClick={() => toggleDomain(domain)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  fontWeight: 500,
                }}
                data-testid={`domain-toggle-${domain}`}
              >
                <span>
                  {isSafetyDomain && "⚠️ "}
                  {DOMAIN_LABELS[domain]}
                  {activeCount > 0 && (
                    <span className="badge" style={{ marginLeft: 8, fontSize: 11 }}>
                      {activeCount} selected
                    </span>
                  )}
                </span>
                <span style={{ opacity: 0.5 }}>{isExpanded ? "▼" : "▶"}</span>
              </button>

              {/* Observation Items */}
              {isExpanded && (
                <div style={{ padding: "0 12px 12px" }}>
                  {items.map((obs) => {
                    const currentValue = getValue(obs.id);
                    return (
                      <div
                        key={obs.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}
                        data-testid={`observation-${obs.id}`}
                      >
                        <span style={{ fontSize: 14 }}>
                          {obs.isSafetyCritical && <span style={{ color: "#ef4444" }}>⚠ </span>}
                          {obs.label}
                        </span>
                        <div className="row" style={{ gap: 4 }}>
                          <button
                            className="button"
                            onClick={() => handleToggle(obs.id, currentValue === "YES" ? null : "YES")}
                            style={{
                              padding: "4px 12px",
                              fontSize: 12,
                              background: currentValue === "YES" ? "rgba(34,197,94,0.3)" : undefined,
                              borderColor: currentValue === "YES" ? "rgba(34,197,94,0.5)" : undefined,
                            }}
                            data-testid={`btn-yes-${obs.id}`}
                          >
                            Yes
                          </button>
                          <button
                            className="button"
                            onClick={() => handleToggle(obs.id, currentValue === "NO" ? null : "NO")}
                            style={{
                              padding: "4px 12px",
                              fontSize: 12,
                              background: currentValue === "NO" ? "rgba(239,68,68,0.3)" : undefined,
                              borderColor: currentValue === "NO" ? "rgba(239,68,68,0.5)" : undefined,
                            }}
                            data-testid={`btn-no-${obs.id}`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Free-text Notes */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Additional Notes</h3>
        <div className="row" style={{ alignItems: "center" }}>
          <input
            className="button"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Describe any other observations..."
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            data-testid="note-input"
          />
          <button className="button" onClick={handleAddNote} data-testid="btn-add-note">
            Add Note
          </button>
        </div>

        {notes.length > 0 && (
          <div style={{ marginTop: 12, display: "grid", gap: 8 }} data-testid="notes-list">
            {notes.map((note, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <span>{note}</span>
                <button
                  className="button"
                  onClick={() => handleDeleteNote(i)}
                  style={{ padding: "2px 8px", fontSize: 11, opacity: 0.6 }}
                  data-testid={`btn-delete-note-${i}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{ marginTop: 16, fontSize: 12, opacity: 0.6 }} data-testid="observations-summary">
        {observations.filter((o) => o.value === OBSERVATION_VALUE.YES).length} symptoms marked YES,{" "}
        {observations.filter((o) => o.value === OBSERVATION_VALUE.NO).length} marked NO
      </div>
    </section>
  );
}
