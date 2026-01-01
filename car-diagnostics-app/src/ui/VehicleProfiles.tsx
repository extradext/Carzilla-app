/**
 * /src/ui/VehicleProfiles.tsx
 * PRESENTATION ONLY
 * 
 * Vehicle selector lives at the top of the app.
 * Tap to: Select profile, Create new, Delete profile
 * Profile requires: Name, Make, Model
 * Switching profiles swaps all visible data.
 */

import React, { useState, useEffect } from 'react';
import type { Vehicle } from '../models/vehicle';
import {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getActiveVehicleId,
  setActiveVehicleId,
} from '../storage/localStore';

type VehicleProfilesProps = {
  onVehicleChange?: (vehicle: Vehicle | null) => void;
  compact?: boolean;
};

export function VehicleProfiles({ onVehicleChange, compact = false }: VehicleProfilesProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nickname: '',
    make: '',
    model: '',
    year: '',
    currentMileage: '',
  });

  useEffect(() => {
    const loaded = getVehicles();
    setVehicles(loaded);
    const storedActiveId = getActiveVehicleId();
    if (storedActiveId && loaded.find((v) => v.id === storedActiveId)) {
      setActiveId(storedActiveId);
      const activeVehicle = loaded.find((v) => v.id === storedActiveId) ?? null;
      onVehicleChange?.(activeVehicle);
    } else if (loaded.length > 0) {
      // Auto-select first vehicle
      setActiveId(loaded[0].id);
      setActiveVehicleId(loaded[0].id);
      onVehicleChange?.(loaded[0]);
    }
  }, []);

  const handleSelectVehicle = (id: string) => {
    setActiveId(id);
    setActiveVehicleId(id);
    const vehicle = vehicles.find((v) => v.id === id) ?? null;
    onVehicleChange?.(vehicle);
  };

  const resetForm = () => {
    setFormData({ nickname: '', make: '', model: '', year: '', currentMileage: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!formData.nickname.trim() || !formData.make.trim() || !formData.model.trim()) {
      return; // Name, Make, Model required
    }

    if (editingId) {
      updateVehicle(editingId, {
        nickname: formData.nickname,
        make: formData.make,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : undefined,
        currentMileage: parseInt(formData.currentMileage) || 0,
      });
    } else {
      const newVehicle = addVehicle({
        nickname: formData.nickname,
        make: formData.make,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : undefined,
        currentMileage: parseInt(formData.currentMileage) || 0,
        weeklyMileageAvg: 0,
      });
      // Auto-select new vehicle
      setActiveId(newVehicle.id);
      setActiveVehicleId(newVehicle.id);
      onVehicleChange?.(newVehicle);
    }

    const updated = getVehicles();
    setVehicles(updated);
    resetForm();
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({
      nickname: vehicle.nickname,
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year?.toString() || '',
      currentMileage: vehicle.currentMileage.toString(),
    });
    setEditingId(vehicle.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this vehicle? All associated garage data will be removed.')) return;
    
    deleteVehicle(id);
    const updated = getVehicles();
    setVehicles(updated);

    if (activeId === id) {
      const newActive = updated.length > 0 ? updated[0] : null;
      setActiveId(newActive?.id ?? null);
      setActiveVehicleId(newActive?.id ?? null);
      onVehicleChange?.(newActive);
    }
  };

  // Compact mode: selector only for app header
  if (compact) {
    const activeVehicle = vehicles.find((v) => v.id === activeId);
    return (
      <div className="row" style={{ alignItems: 'center' }} data-testid="vehicle-selector-compact">
        <select
          className="button"
          value={activeId || ''}
          onChange={(e) => {
            if (e.target.value === '__new__') {
              setShowForm(true);
            } else {
              handleSelectVehicle(e.target.value);
            }
          }}
          style={{ minWidth: 180 }}
          data-testid="vehicle-select"
        >
          {vehicles.length === 0 && <option value="">No vehicles</option>}
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nickname} ({v.year} {v.make} {v.model})
            </option>
          ))}
          <option value="__new__">+ Create new vehicle</option>
        </select>

        {showForm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => resetForm()}
          >
            <div
              className="card"
              style={{ minWidth: 400, maxWidth: 500 }}
              onClick={(e) => e.stopPropagation()}
              data-testid="vehicle-form-modal"
            >
              <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Vehicle' : 'Create New Vehicle'}</h3>
              <VehicleForm
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                onCancel={resetForm}
                editingId={editingId}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full vehicle management view
  return (
    <section className="card" data-testid="vehicle-profiles">
      <h2 style={{ marginTop: 0 }} data-testid="vehicle-profiles-title">
        Vehicle Profiles
      </h2>

      {!showForm && (
        <button className="button" onClick={() => setShowForm(true)} data-testid="add-vehicle-btn">
          + Create New Vehicle
        </button>
      )}

      {showForm && (
        <div
          className="card"
          style={{ marginTop: 12, background: 'rgba(255,255,255,0.04)' }}
          data-testid="vehicle-form"
        >
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Vehicle' : 'Create New Vehicle'}</h3>
          <VehicleForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onCancel={resetForm}
            editingId={editingId}
          />
        </div>
      )}

      <div style={{ marginTop: 16 }} data-testid="vehicle-list">
        {vehicles.length === 0 && (
          <p style={{ opacity: 0.6 }}>No vehicles yet. Create one to get started.</p>
        )}
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="card"
            style={{
              marginBottom: 8,
              background: vehicle.id === activeId ? 'rgba(100,150,255,0.15)' : 'rgba(255,255,255,0.04)',
              border: vehicle.id === activeId ? '1px solid rgba(100,150,255,0.4)' : undefined,
            }}
            data-testid="vehicle-item"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                style={{ cursor: 'pointer', flex: 1 }}
                onClick={() => handleSelectVehicle(vehicle.id)}
              >
                <strong>{vehicle.nickname}</strong>
                <span style={{ opacity: 0.7, marginLeft: 12 }}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </span>
                {vehicle.currentMileage > 0 && (
                  <span className="badge" style={{ marginLeft: 12 }}>
                    {vehicle.currentMileage.toLocaleString()} mi
                  </span>
                )}
                {vehicle.id === activeId && (
                  <span className="badge" style={{ marginLeft: 12, background: 'rgba(100,200,100,0.3)' }}>
                    Active
                  </span>
                )}
              </div>
              <div className="row">
                <button
                  className="button"
                  onClick={() => handleEdit(vehicle)}
                  style={{ padding: '4px 8px', fontSize: 12 }}
                >
                  Edit
                </button>
                <button
                  className="button"
                  onClick={() => handleDelete(vehicle.id)}
                  style={{ padding: '4px 8px', fontSize: 12 }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Vehicle Form Component
function VehicleForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  editingId,
}: {
  formData: { nickname: string; make: string; model: string; year: string; currentMileage: string };
  setFormData: (data: typeof formData) => void;
  onSave: () => void;
  onCancel: () => void;
  editingId: string | null;
}) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <input
        className="button"
        placeholder="Name (e.g., My Honda) *"
        value={formData.nickname}
        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
        data-testid="vehicle-nickname-input"
      />
      <div className="row">
        <input
          className="button"
          placeholder="Make (e.g., Honda) *"
          value={formData.make}
          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
          style={{ flex: 1 }}
          data-testid="vehicle-make-input"
        />
        <input
          className="button"
          placeholder="Model (e.g., Civic) *"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          style={{ flex: 1 }}
          data-testid="vehicle-model-input"
        />
      </div>
      <div className="row">
        <input
          className="button"
          type="number"
          placeholder="Year"
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          style={{ maxWidth: 120 }}
          data-testid="vehicle-year-input"
        />
        <input
          className="button"
          type="number"
          placeholder="Current mileage"
          value={formData.currentMileage}
          onChange={(e) => setFormData({ ...formData, currentMileage: e.target.value })}
          style={{ flex: 1 }}
          data-testid="vehicle-mileage-input"
        />
      </div>
      <p style={{ opacity: 0.7, margin: '4px 0', fontSize: 12 }}>* Required fields</p>
      <div className="row">
        <button className="button" onClick={onSave} data-testid="save-vehicle-btn">
          {editingId ? 'Update' : 'Create'} Vehicle
        </button>
        <button className="button" onClick={onCancel} data-testid="cancel-vehicle-btn">
          Cancel
        </button>
      </div>
    </div>
  );
}

// Export the VehicleSelector for header use
export function VehicleSelector({
  onVehicleChange,
}: {
  onVehicleChange?: (vehicle: Vehicle | null) => void;
}) {
  return <VehicleProfiles onVehicleChange={onVehicleChange} compact />;
}
