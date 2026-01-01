/**
 * /src/ui/MyGarage.tsx
 * PRESENTATION ONLY
 * 
 * My Garage is the single container for all vehicle-specific data.
 * Contains internal tabs: Notes/Memory, Maintenance, Saved Diagnostics
 */

import React, { useState, useEffect } from 'react';
import type { GarageNote } from '../models/garageNote';
import type { MaintenanceEvent } from '../models/maintenance';
import type { SavedDiagnostic } from '../models/savedDiagnostic';
import {
  getGarageNotes,
  addGarageNote,
  updateGarageNote,
  deleteGarageNote,
  getMaintenanceEvents,
  addMaintenanceEvent,
  updateMaintenanceEvent,
  deleteMaintenanceEvent,
  getSavedDiagnostics,
  deleteSavedDiagnostic,
} from '../storage/localStore';
import { exportDiagnosticPayload } from '../utils/export';

type GarageTab = 'notes' | 'maintenance' | 'saved';

type MyGarageProps = {
  vehicleId: string | null;
  vehicleName?: string;
};

export function MyGarage({ vehicleId, vehicleName }: MyGarageProps) {
  const [activeTab, setActiveTab] = useState<GarageTab>('notes');

  if (!vehicleId) {
    return (
      <section className="card" data-testid="garage-no-vehicle">
        <h2 style={{ marginTop: 0 }}>My Garage</h2>
        <p>Please select or create a vehicle profile to access your garage.</p>
      </section>
    );
  }

  return (
    <section className="card" data-testid="my-garage">
      <h2 style={{ marginTop: 0 }} data-testid="garage-title">
        My Garage {vehicleName && <span style={{ opacity: 0.7 }}>— {vehicleName}</span>}
      </h2>

      <div className="row" style={{ marginBottom: 16 }} data-testid="garage-tabs">
        <button
          className={`button ${activeTab === 'notes' ? 'button-active' : ''}`}
          onClick={() => setActiveTab('notes')}
          data-testid="garage-tab-notes"
          style={activeTab === 'notes' ? { background: 'rgba(255,255,255,0.2)' } : {}}
        >
          Notes / Memory
        </button>
        <button
          className={`button ${activeTab === 'maintenance' ? 'button-active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
          data-testid="garage-tab-maintenance"
          style={activeTab === 'maintenance' ? { background: 'rgba(255,255,255,0.2)' } : {}}
        >
          Maintenance
        </button>
        <button
          className={`button ${activeTab === 'saved' ? 'button-active' : ''}`}
          onClick={() => setActiveTab('saved')}
          data-testid="garage-tab-saved"
          style={activeTab === 'saved' ? { background: 'rgba(255,255,255,0.2)' } : {}}
        >
          Saved Diagnostics
        </button>
      </div>

      {activeTab === 'notes' && <NotesTab vehicleId={vehicleId} />}
      {activeTab === 'maintenance' && <MaintenanceTab vehicleId={vehicleId} />}
      {activeTab === 'saved' && <SavedDiagnosticsTab vehicleId={vehicleId} />}
    </section>
  );
}

// Notes / Memory Tab
function NotesTab({ vehicleId }: { vehicleId: string }) {
  const [notes, setNotes] = useState<GarageNote[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    text: '',
    category: 'other' as GarageNote['category'],
    dateNoticed: '',
    isIntermittent: false,
    conditions: { driving: false, weather: '', temperature: '', fuelLevel: '' },
  });

  useEffect(() => {
    setNotes(getGarageNotes(vehicleId));
  }, [vehicleId]);

  const resetForm = () => {
    setFormData({
      text: '',
      category: 'other',
      dateNoticed: '',
      isIntermittent: false,
      conditions: { driving: false, weather: '', temperature: '', fuelLevel: '' },
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!formData.text.trim()) return;

    if (editingId) {
      updateGarageNote(editingId, {
        text: formData.text,
        category: formData.category,
        dateNoticed: formData.dateNoticed || undefined,
        isIntermittent: formData.isIntermittent,
        conditions: formData.conditions,
      });
    } else {
      addGarageNote({
        vehicleId,
        text: formData.text,
        category: formData.category,
        dateNoticed: formData.dateNoticed || undefined,
        isIntermittent: formData.isIntermittent,
        conditions: formData.conditions,
        resolved: false,
      });
    }

    setNotes(getGarageNotes(vehicleId));
    resetForm();
  };

  const handleEdit = (note: GarageNote) => {
    setFormData({
      text: note.text,
      category: note.category,
      dateNoticed: note.dateNoticed || '',
      isIntermittent: note.isIntermittent || false,
      conditions: note.conditions || { driving: false, weather: '', temperature: '', fuelLevel: '' },
    });
    setEditingId(note.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteGarageNote(id);
    setNotes(getGarageNotes(vehicleId));
  };

  const handleToggleResolved = (note: GarageNote) => {
    updateGarageNote(note.id, { resolved: !note.resolved });
    setNotes(getGarageNotes(vehicleId));
  };

  return (
    <div data-testid="notes-tab">
      <p style={{ opacity: 0.8, marginTop: 0 }}>
        Log what you heard, saw, felt, or smelled. Notes are for reference only and never affect diagnostics.
      </p>

      {!showForm && (
        <button className="button" onClick={() => setShowForm(true)} data-testid="add-note-btn">
          + Add Note
        </button>
      )}

      {showForm && (
        <div className="card" style={{ marginTop: 12, background: 'rgba(255,255,255,0.04)' }} data-testid="note-form">
          <div style={{ display: 'grid', gap: 10 }}>
            <textarea
              placeholder="Describe what you observed..."
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="button"
              style={{ minHeight: 80, resize: 'vertical', width: '100%' }}
              data-testid="note-text-input"
            />

            <div className="row">
              <select
                className="button"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as GarageNote['category'] })}
                data-testid="note-category-select"
              >
                <option value="heard">Heard</option>
                <option value="saw">Saw</option>
                <option value="felt">Felt</option>
                <option value="smelled">Smelled</option>
                <option value="other">Other</option>
              </select>

              <input
                type="date"
                className="button"
                value={formData.dateNoticed}
                onChange={(e) => setFormData({ ...formData, dateNoticed: e.target.value })}
                placeholder="Date noticed"
                data-testid="note-date-input"
              />

              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={formData.isIntermittent}
                  onChange={(e) => setFormData({ ...formData, isIntermittent: e.target.checked })}
                  data-testid="note-intermittent-checkbox"
                />
                Intermittent
              </label>
            </div>

            <details style={{ opacity: 0.9 }}>
              <summary style={{ cursor: 'pointer' }}>Conditions (optional)</summary>
              <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={formData.conditions.driving}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditions: { ...formData.conditions, driving: e.target.checked },
                      })
                    }
                  />
                  While driving
                </label>
                <input
                  className="button"
                  placeholder="Weather"
                  value={formData.conditions.weather}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: { ...formData.conditions, weather: e.target.value },
                    })
                  }
                  style={{ maxWidth: 120 }}
                />
                <input
                  className="button"
                  placeholder="Temperature"
                  value={formData.conditions.temperature}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: { ...formData.conditions, temperature: e.target.value },
                    })
                  }
                  style={{ maxWidth: 120 }}
                />
                <input
                  className="button"
                  placeholder="Fuel level"
                  value={formData.conditions.fuelLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: { ...formData.conditions, fuelLevel: e.target.value },
                    })
                  }
                  style={{ maxWidth: 120 }}
                />
              </div>
            </details>

            <div className="row">
              <button className="button" onClick={handleSave} data-testid="save-note-btn">
                {editingId ? 'Update' : 'Save'} Note
              </button>
              <button className="button" onClick={resetForm} data-testid="cancel-note-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }} data-testid="notes-list">
        {notes.length === 0 && <p style={{ opacity: 0.6 }}>No notes yet.</p>}
        {notes.map((note) => (
          <div
            key={note.id}
            className="card"
            style={{
              marginBottom: 8,
              background: note.resolved ? 'rgba(100,200,100,0.1)' : 'rgba(255,255,255,0.04)',
              opacity: note.resolved ? 0.7 : 1,
            }}
            data-testid="note-item"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="badge" style={{ marginBottom: 6, textTransform: 'capitalize' }}>
                  {note.category}
                </div>
                <p style={{ margin: '4px 0', textDecoration: note.resolved ? 'line-through' : 'none' }}>
                  {note.text}
                </p>
                {note.dateNoticed && (
                  <small style={{ opacity: 0.7 }}>Noticed: {note.dateNoticed}</small>
                )}
                {note.isIntermittent && <span className="badge" style={{ marginLeft: 8 }}>Intermittent</span>}
              </div>
              <div className="row">
                <button
                  className="button"
                  onClick={() => handleToggleResolved(note)}
                  style={{ padding: '4px 8px', fontSize: 12 }}
                >
                  {note.resolved ? 'Unresolve' : 'Resolve'}
                </button>
                <button
                  className="button"
                  onClick={() => handleEdit(note)}
                  style={{ padding: '4px 8px', fontSize: 12 }}
                >
                  Edit
                </button>
                <button
                  className="button"
                  onClick={() => handleDelete(note.id)}
                  style={{ padding: '4px 8px', fontSize: 12 }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Maintenance Tab
function MaintenanceTab({ vehicleId }: { vehicleId: string }) {
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    date: '',
    mileage: '',
    notes: '',
  });

  useEffect(() => {
    setEvents(getMaintenanceEvents(vehicleId));
  }, [vehicleId]);

  const resetForm = () => {
    setFormData({ type: '', date: '', mileage: '', notes: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!formData.type.trim() || !formData.date) return;

    if (editingId) {
      updateMaintenanceEvent(editingId, {
        type: formData.type,
        date: formData.date,
        mileage: parseInt(formData.mileage) || 0,
        notes: formData.notes || undefined,
      });
    } else {
      addMaintenanceEvent({
        vehicleId,
        type: formData.type,
        date: formData.date,
        mileage: parseInt(formData.mileage) || 0,
        notes: formData.notes || undefined,
      });
    }

    setEvents(getMaintenanceEvents(vehicleId));
    resetForm();
  };

  const handleEdit = (event: MaintenanceEvent) => {
    setFormData({
      type: event.type,
      date: event.date,
      mileage: event.mileage.toString(),
      notes: event.notes || '',
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteMaintenanceEvent(id);
    setEvents(getMaintenanceEvents(vehicleId));
  };

  const maintenanceTypes = [
    'Oil Change',
    'Brake Pads',
    'Brake Rotors',
    'Brake Fluid Added',
    'Brake Fluid Flush',
    'Brake Line/Hose Repair',
    'Air Filter',
    'Cabin Filter',
    'Spark Plugs',
    'Transmission Fluid',
    'Coolant Flush',
    'Battery Replacement',
    'Tire Rotation',
    'Tire Replacement',
    'Other',
  ];

  return (
    <div data-testid="maintenance-tab">
      <p style={{ opacity: 0.8, marginTop: 0 }}>
        Track oil changes, brakes, component replacements, and mileage entries.
      </p>

      {/* Brake Fluid Educational Tip */}
      <div style={{ 
        marginBottom: 16, 
        padding: 10, 
        background: 'rgba(100,150,255,0.08)', 
        borderRadius: 6,
        border: '1px solid rgba(100,150,255,0.15)',
        fontSize: 13,
      }}>
        <strong>💡 Tip:</strong> Check your usual parking spot for fresh fluid spots and log them here. 
        If you add brake fluid, log the date and amount so you can tell if it's dropping again.
      </div>

      {!showForm && (
        <button className="button" onClick={() => setShowForm(true)} data-testid="add-maintenance-btn">
          + Add Maintenance Record
        </button>
      )}

      {showForm && (
        <div className="card" style={{ marginTop: 12, background: 'rgba(255,255,255,0.04)' }} data-testid="maintenance-form">
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="row">
              <select
                className="button"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                data-testid="maintenance-type-select"
              >
                <option value="">Select type...</option>
                {maintenanceTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="button"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                data-testid="maintenance-date-input"
              />

              <input
                type="number"
                className="button"
                placeholder="Mileage"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                style={{ maxWidth: 120 }}
                data-testid="maintenance-mileage-input"
              />
            </div>

            <input
              className="button"
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              data-testid="maintenance-notes-input"
            />

            <div className="row">
              <button className="button" onClick={handleSave} data-testid="save-maintenance-btn">
                {editingId ? 'Update' : 'Save'} Record
              </button>
              <button className="button" onClick={resetForm} data-testid="cancel-maintenance-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }} data-testid="maintenance-list">
        {events.length === 0 && <p style={{ opacity: 0.6 }}>No maintenance records yet.</p>}
        {events
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((event) => (
            <div
              key={event.id}
              className="card"
              style={{ marginBottom: 8, background: 'rgba(255,255,255,0.04)' }}
              data-testid="maintenance-item"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{event.type}</strong>
                  <span style={{ opacity: 0.7, marginLeft: 12 }}>{event.date}</span>
                  {event.mileage > 0 && (
                    <span className="badge" style={{ marginLeft: 8 }}>
                      {event.mileage.toLocaleString()} mi
                    </span>
                  )}
                  {event.notes && <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: 14 }}>{event.notes}</p>}
                </div>
                <div className="row">
                  <button
                    className="button"
                    onClick={() => handleEdit(event)}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    Edit
                  </button>
                  <button
                    className="button"
                    onClick={() => handleDelete(event.id)}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// Saved Diagnostics Tab
function SavedDiagnosticsTab({ vehicleId }: { vehicleId: string }) {
  const [diagnostics, setDiagnostics] = useState<SavedDiagnostic[]>([]);

  useEffect(() => {
    setDiagnostics(getSavedDiagnostics(vehicleId));
  }, [vehicleId]);

  const handleDelete = (id: string) => {
    deleteSavedDiagnostic(id);
    setDiagnostics(getSavedDiagnostics(vehicleId));
  };

  const handleExport = (diagnostic: SavedDiagnostic) => {
    const payload = exportDiagnosticPayload(diagnostic.result, diagnostic.userNotes);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-${diagnostic.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="saved-diagnostics-tab">
      <p style={{ opacity: 0.8, marginTop: 0 }}>
        View and export your saved diagnostic results.
      </p>

      <div data-testid="saved-diagnostics-list">
        {diagnostics.length === 0 && <p style={{ opacity: 0.6 }}>No saved diagnostics yet.</p>}
        {diagnostics
          .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
          .map((diag) => (
            <div
              key={diag.id}
              className="card"
              style={{ marginBottom: 8, background: 'rgba(255,255,255,0.04)' }}
              data-testid="saved-diagnostic-item"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="row" style={{ marginBottom: 8 }}>
                    <div className="badge">Top: {diag.result.topHypothesis || 'Unknown'}</div>
                    <div className="badge">Confidence: {Math.round(diag.result.confidence * 100)}%</div>
                  </div>
                  <small style={{ opacity: 0.7 }}>
                    Saved: {new Date(diag.savedAt).toLocaleString()}
                  </small>
                  {diag.userNotes && (
                    <p style={{ margin: '8px 0 0', fontSize: 14, opacity: 0.9 }}>
                      Notes: {diag.userNotes}
                    </p>
                  )}
                </div>
                <div className="row">
                  <button
                    className="button"
                    onClick={() => handleExport(diag)}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    Export
                  </button>
                  <button
                    className="button"
                    onClick={() => handleDelete(diag.id)}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
