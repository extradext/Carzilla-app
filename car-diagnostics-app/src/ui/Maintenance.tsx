/**
 * /src/ui/Maintenance.tsx
 * PRESENTATION ONLY
 *
 * Maintenance + Mileage (PERSISTENT)
 * - Track oil change mileage, brake service, component replacements
 * - Compute rolling weekly mileage average
 * - Countdown to next oil change
 * - Auto-adjust averages when mileage corrected
 */

import React, { useState, useMemo } from "react";
import type { Vehicle } from "../models/vehicle";
import type { MaintenanceEvent, MaintenanceEventType, MileageEntry } from "../models/maintenance";
import { MAINTENANCE_EVENT_LABELS, createMaintenanceEvent, createMileageEntry } from "../models/maintenance";
import {
  getMaintenanceForVehicle,
  addMaintenanceEvent,
  deleteMaintenanceEvent,
  getMileageEntriesForVehicle,
  addMileageEntry,
  updateVehicle,
} from "../storage/localStore";
import {
  calculateWeeklyMileageAvg,
  calculateMilesUntilOilChange,
  estimateDaysUntilOilChange,
  formatMilesRemaining,
  formatDaysRemaining,
} from "../utils/mileageAveraging";

type MaintenanceProps = {
  vehicle: Vehicle | null;
  onVehicleUpdate?: (vehicle: Vehicle) => void;
};

export function Maintenance({ vehicle, onVehicleUpdate }: MaintenanceProps) {
  // Form state
  const [eventType, setEventType] = useState<MaintenanceEventType>("oil_change");
  const [eventDescription, setEventDescription] = useState("");
  const [eventMileage, setEventMileage] = useState<number | "">("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);

  // Mileage update
  const [newMileage, setNewMileage] = useState<number | "">("");

  // Data
  const [events, setEvents] = useState<MaintenanceEvent[]>(
    vehicle ? getMaintenanceForVehicle(vehicle.id) : []
  );
  const [mileageEntries, setMileageEntries] = useState<MileageEntry[]>(
    vehicle ? getMileageEntriesForVehicle(vehicle.id) : []
  );

  // Refresh data when vehicle changes
  React.useEffect(() => {
    if (vehicle) {
      setEvents(getMaintenanceForVehicle(vehicle.id));
      setMileageEntries(getMileageEntriesForVehicle(vehicle.id));
    } else {
      setEvents([]);
      setMileageEntries([]);
    }
  }, [vehicle?.id]);

  // Computed values
  const weeklyAvg = useMemo(() => calculateWeeklyMileageAvg(mileageEntries), [mileageEntries]);
  const milesUntilOil = useMemo(
    () => vehicle ? calculateMilesUntilOilChange(vehicle.currentMileage, events) : null,
    [vehicle?.currentMileage, events]
  );
  const daysUntilOil = useMemo(
    () => milesUntilOil !== null ? estimateDaysUntilOilChange(milesUntilOil, weeklyAvg) : null,
    [milesUntilOil, weeklyAvg]
  );

  const handleAddEvent = () => {
    if (!vehicle || !eventMileage) return;

    const event = createMaintenanceEvent(
      vehicle.id,
      eventType,
      eventDescription,
      eventMileage,
      eventDate
    );
    addMaintenanceEvent(event);
    setEvents(getMaintenanceForVehicle(vehicle.id));

    // Reset form
    setEventDescription("");
    setEventMileage("");
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteMaintenanceEvent(eventId);
    if (vehicle) {
      setEvents(getMaintenanceForVehicle(vehicle.id));
    }
  };

  const handleUpdateMileage = () => {
    if (!vehicle || !newMileage) return;

    // Add mileage entry for tracking
    const entry = createMileageEntry(vehicle.id, newMileage);
    addMileageEntry(entry);

    // Update vehicle
    const updated: Vehicle = {
      ...vehicle,
      currentMileage: newMileage,
      weeklyMileageAvg: calculateWeeklyMileageAvg([...mileageEntries, entry]),
    };
    updateVehicle(updated);
    onVehicleUpdate?.(updated);

    // Refresh
    setMileageEntries(getMileageEntriesForVehicle(vehicle.id));
    setNewMileage("");
  };

  if (!vehicle) {
    return (
      <section className="card" data-testid="maintenance-panel">
        <h2 style={{ marginTop: 0 }}>Maintenance</h2>
        <p style={{ opacity: 0.7 }}>Select a vehicle to manage maintenance records.</p>
      </section>
    );
  }

  return (
    <section className="card" data-testid="maintenance-panel">
      <h2 style={{ marginTop: 0 }} data-testid="maintenance-title">
        Maintenance — {vehicle.name}
      </h2>

      {/* Mileage Dashboard */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
        data-testid="mileage-dashboard"
      >
        {/* Current Mileage */}
        <div style={{ padding: 16, background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.6 }}>Current Mileage</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            {vehicle.currentMileage.toLocaleString()}
          </div>
        </div>

        {/* Weekly Average */}
        <div style={{ padding: 16, background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.6 }}>Weekly Average</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            {weeklyAvg > 0 ? `${weeklyAvg.toLocaleString()} mi` : "--"}
          </div>
        </div>

        {/* Oil Change Countdown */}
        <div
          style={{
            padding: 16,
            background: milesUntilOil !== null && milesUntilOil <= 500
              ? "rgba(239,68,68,0.15)"
              : "rgba(255,255,255,0.04)",
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.6 }}>Until Oil Change</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>
            {formatMilesRemaining(milesUntilOil)}
          </div>
          {daysUntilOil !== null && (
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
              ~{formatDaysRemaining(daysUntilOil)}
            </div>
          )}
        </div>
      </div>

      {/* Update Mileage */}
      <div style={{ marginBottom: 24, padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Update Current Mileage</h3>
        <div className="row" style={{ alignItems: "center" }}>
          <input
            className="button"
            type="number"
            placeholder="Enter current mileage"
            value={newMileage}
            onChange={(e) => setNewMileage(e.target.value ? parseInt(e.target.value, 10) : "")}
            style={{ flex: 1, maxWidth: 200 }}
            data-testid="input-new-mileage"
          />
          <button className="button" onClick={handleUpdateMileage} data-testid="btn-update-mileage">
            Update
          </button>
        </div>
        <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8, marginBottom: 0 }}>
          Regular updates help calculate accurate weekly averages.
        </p>
      </div>

      {/* Add Maintenance Event */}
      <div style={{ marginBottom: 24, padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Log Maintenance Event</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <div className="row">
            <select
              className="button"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as MaintenanceEventType)}
              style={{ flex: 1 }}
              data-testid="select-event-type"
            >
              {Object.entries(MAINTENANCE_EVENT_LABELS).map(([type, label]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>
            <input
              className="button"
              type="number"
              placeholder="Mileage"
              value={eventMileage}
              onChange={(e) => setEventMileage(e.target.value ? parseInt(e.target.value, 10) : "")}
              style={{ width: 120 }}
              data-testid="input-event-mileage"
            />
            <input
              className="button"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              data-testid="input-event-date"
            />
          </div>
          <div className="row">
            <input
              className="button"
              type="text"
              placeholder="Description (optional)"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              style={{ flex: 1 }}
              data-testid="input-event-description"
            />
            <button className="button" onClick={handleAddEvent} data-testid="btn-add-event">
              Add Event
            </button>
          </div>
        </div>
      </div>

      {/* Maintenance History */}
      <div>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Maintenance History</h3>
        {events.length === 0 ? (
          <p style={{ opacity: 0.6, fontSize: 13 }}>No maintenance events recorded yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }} data-testid="maintenance-history">
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>
                    {MAINTENANCE_EVENT_LABELS[event.type]}
                  </div>
                  {event.description && (
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                      {event.description}
                    </div>
                  )}
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                    {event.mileage.toLocaleString()} mi • {new Date(event.date).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="button"
                  onClick={() => handleDeleteEvent(event.id)}
                  style={{ padding: "4px 10px", fontSize: 11, opacity: 0.6 }}
                  data-testid={`btn-delete-event-${event.id}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
