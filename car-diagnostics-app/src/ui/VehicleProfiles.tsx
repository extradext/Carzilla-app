/**
 * /src/ui/VehicleProfiles.tsx
 * PRESENTATION ONLY
 *
 * Vehicle Profiles (HARD GATE)
 * - Diagnostics cannot begin unless a vehicle profile exists
 * - Profile must have: Name, Make, Model
 * - Support multiple vehicle profiles
 * - Switching profiles preserves all data per vehicle
 * - New vehicle profile starts completely empty
 * - Clone Profile option for advanced users
 */

import React, { useState } from "react";
import type { Vehicle, VehicleFormData } from "../models/vehicle";
import { createVehicle, cloneVehicle } from "../models/vehicle";
import {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getActiveVehicleId,
  setActiveVehicleId,
} from "../storage/localStore";

type VehicleProfilesProps = {
  onVehicleChange?: (vehicle: Vehicle | null) => void;
};

type Mode = "list" | "create" | "edit" | "clone";

export function VehicleProfiles({ onVehicleChange }: VehicleProfilesProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getVehicles());
  const [activeId, setActiveId] = useState<string | null>(() => getActiveVehicleId());
  const [mode, setMode] = useState<Mode>("list");
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [cloneSource, setCloneSource] = useState<Vehicle | null>(null);

  // Form state
  const [formData, setFormData] = useState<VehicleFormData>({
    name: "",
    make: "",
    model: "",
    year: undefined,
    currentMileage: undefined,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const refreshVehicles = () => {
    setVehicles(getVehicles());
    setActiveId(getActiveVehicleId());
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setActiveVehicleId(vehicleId);
    setActiveId(vehicleId);
    const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null;
    onVehicleChange?.(vehicle);
  };

  const handleStartCreate = () => {
    setFormData({ name: "", make: "", model: "", year: undefined, currentMileage: undefined });
    setFormError(null);
    setMode("create");
  };

  const handleStartEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      currentMileage: vehicle.currentMileage,
    });
    setFormError(null);
    setMode("edit");
  };

  const handleStartClone = (vehicle: Vehicle) => {
    setCloneSource(vehicle);
    setFormData({
      name: `${vehicle.name} (Copy)`,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      currentMileage: vehicle.currentMileage,
    });
    setFormError(null);
    setMode("clone");
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setFormError("Name is required");
      return false;
    }
    if (!formData.make.trim()) {
      setFormError("Make is required");
      return false;
    }
    if (!formData.model.trim()) {
      setFormError("Model is required");
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSaveCreate = () => {
    if (!validateForm()) return;
    const newVehicle = createVehicle(formData);
    addVehicle(newVehicle);
    
    // Auto-select the new vehicle (always for first vehicle, or just select it)
    setActiveVehicleId(newVehicle.id);
    setActiveId(newVehicle.id);
    onVehicleChange?.(newVehicle);
    
    refreshVehicles();
    setMode("list");
  };

  const handleSaveEdit = () => {
    if (!validateForm() || !editingVehicle) return;
    const updated: Vehicle = {
      ...editingVehicle,
      name: formData.name.trim(),
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: formData.year,
      currentMileage: formData.currentMileage ?? editingVehicle.currentMileage,
    };
    updateVehicle(updated);
    refreshVehicles();
    setMode("list");
    setEditingVehicle(null);
  };

  const handleSaveClone = () => {
    if (!validateForm() || !cloneSource) return;
    const cloned = cloneVehicle(cloneSource, formData.name);
    addVehicle(cloned);
    refreshVehicles();
    setMode("list");
    setCloneSource(null);
  };

  const handleDelete = (vehicleId: string) => {
    if (!confirm("Delete this vehicle and all its data? This cannot be undone.")) return;
    deleteVehicle(vehicleId);
    refreshVehicles();
    if (activeId === vehicleId) {
      onVehicleChange?.(null);
    }
  };

  const handleCancel = () => {
    setMode("list");
    setEditingVehicle(null);
    setCloneSource(null);
    setFormError(null);
  };

  const activeVehicle = vehicles.find((v) => v.id === activeId);

  // -------------------------------------------------------------------------
  // Form UI
  // -------------------------------------------------------------------------
  const renderForm = (title: string, onSave: () => void) => (
    <div data-testid="vehicle-form">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      
      {formError && (
        <div className="badge" style={{ background: "rgba(239,68,68,0.2)", marginBottom: 12 }} data-testid="form-error">
          {formError}
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontSize: 12, opacity: 0.8 }}>Name *</label>
          <input
            className="button"
            type="text"
            placeholder="e.g., My Honda"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{ width: "100%", boxSizing: "border-box" }}
            data-testid="input-name"
          />
        </div>

        <div className="row">
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 12, opacity: 0.8 }}>Make *</label>
            <input
              className="button"
              type="text"
              placeholder="e.g., Honda"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              style={{ width: "100%", boxSizing: "border-box" }}
              data-testid="input-make"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 12, opacity: 0.8 }}>Model *</label>
            <input
              className="button"
              type="text"
              placeholder="e.g., Civic"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              style={{ width: "100%", boxSizing: "border-box" }}
              data-testid="input-model"
            />
          </div>
        </div>

        <div className="row">
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 12, opacity: 0.8 }}>Year</label>
            <input
              className="button"
              type="number"
              placeholder="e.g., 2020"
              value={formData.year ?? ""}
              onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value, 10) : undefined })}
              style={{ width: "100%", boxSizing: "border-box" }}
              data-testid="input-year"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 12, opacity: 0.8 }}>Current Mileage</label>
            <input
              className="button"
              type="number"
              placeholder="e.g., 45000"
              value={formData.currentMileage ?? ""}
              onChange={(e) => setFormData({ ...formData, currentMileage: e.target.value ? parseInt(e.target.value, 10) : undefined })}
              style={{ width: "100%", boxSizing: "border-box" }}
              data-testid="input-mileage"
            />
          </div>
        </div>
      </div>

      <div className="row" style={{ marginTop: 16 }}>
        <button className="button" onClick={onSave} data-testid="btn-save">
          Save
        </button>
        <button className="button" onClick={handleCancel} style={{ opacity: 0.7 }} data-testid="btn-cancel">
          Cancel
        </button>
      </div>
    </div>
  );

  // -------------------------------------------------------------------------
  // Vehicle Card
  // -------------------------------------------------------------------------
  const renderVehicleCard = (vehicle: Vehicle) => {
    const isActive = vehicle.id === activeId;
    return (
      <div
        key={vehicle.id}
        className="card"
        style={{
          border: isActive ? "2px solid rgba(59,130,246,0.7)" : undefined,
          cursor: "pointer",
        }}
        onClick={() => handleSelectVehicle(vehicle.id)}
        data-testid={`vehicle-card-${vehicle.id}`}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{vehicle.name}</div>
            <div style={{ opacity: 0.8, fontSize: 14 }}>
              {vehicle.year ? `${vehicle.year} ` : ""}{vehicle.make} {vehicle.model}
            </div>
            {vehicle.currentMileage > 0 && (
              <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
                {vehicle.currentMileage.toLocaleString()} miles
              </div>
            )}
          </div>
          <div className="row" onClick={(e) => e.stopPropagation()}>
            {isActive && (
              <span className="badge" style={{ background: "rgba(59,130,246,0.3)" }}>Active</span>
            )}
            <button
              className="button"
              style={{ padding: "6px 10px", fontSize: 12 }}
              onClick={() => handleStartEdit(vehicle)}
              data-testid={`btn-edit-${vehicle.id}`}
            >
              Edit
            </button>
            <button
              className="button"
              style={{ padding: "6px 10px", fontSize: 12 }}
              onClick={() => handleStartClone(vehicle)}
              data-testid={`btn-clone-${vehicle.id}`}
            >
              Clone
            </button>
            <button
              className="button"
              style={{ padding: "6px 10px", fontSize: 12, opacity: 0.7 }}
              onClick={() => handleDelete(vehicle.id)}
              data-testid={`btn-delete-${vehicle.id}`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Main Render
  // -------------------------------------------------------------------------
  return (
    <section className="card" data-testid="vehicle-profiles">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }} data-testid="vehicle-profiles-title">
          Vehicle Profiles
        </h2>
        {mode === "list" && (
          <button className="button" onClick={handleStartCreate} data-testid="btn-add-vehicle">
            + Add Vehicle
          </button>
        )}
      </div>

      {mode === "create" && renderForm("Add New Vehicle", handleSaveCreate)}
      {mode === "edit" && editingVehicle && renderForm(`Edit: ${editingVehicle.name}`, handleSaveEdit)}
      {mode === "clone" && cloneSource && renderForm(`Clone: ${cloneSource.name}`, handleSaveClone)}

      {mode === "list" && (
        <>
          {vehicles.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, opacity: 0.7 }} data-testid="no-vehicles">
              <p>No vehicles yet. Add a vehicle to start diagnosing.</p>
              <p style={{ fontSize: 12 }}>A vehicle profile is required before running diagnostics.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }} data-testid="vehicle-list">
              {vehicles.map(renderVehicleCard)}
            </div>
          )}

          {activeVehicle && (
            <div style={{ marginTop: 16, padding: 12, background: "rgba(255,255,255,0.04)", borderRadius: 8 }} data-testid="active-summary">
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Selected for diagnosis:</div>
              <div style={{ fontWeight: 600 }}>
                {activeVehicle.name} — {activeVehicle.year ? `${activeVehicle.year} ` : ""}{activeVehicle.make} {activeVehicle.model}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
