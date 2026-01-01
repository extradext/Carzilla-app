/**
 * /src/storage/localStore.ts
 * LOCAL-FIRST, SYNC-READY (per file contracts)
 */

import type { Vehicle } from '../models/vehicle';
import type { MaintenanceEvent } from '../models/maintenance';
import type { GarageNote } from '../models/garageNote';
import type { SavedDiagnostic } from '../models/savedDiagnostic';
import type { UserPreferences } from '../models/userPreferences';
import { generateUUID } from '../utils/uuid';

const STORAGE_KEYS = {
  VEHICLES: 'car_diag_vehicles',
  ACTIVE_VEHICLE: 'car_diag_active_vehicle',
  GARAGE_NOTES: 'car_diag_garage_notes',
  MAINTENANCE: 'car_diag_maintenance',
  SAVED_DIAGNOSTICS: 'car_diag_saved_diagnostics',
  PREFERENCES: 'car_diag_preferences',
  SAFETY_ACKNOWLEDGED: 'car_diag_safety_ack',
} as const;

// Vehicle Operations
export function getVehicles(): Vehicle[] {
  const data = localStorage.getItem(STORAGE_KEYS.VEHICLES);
  return data ? JSON.parse(data) : [];
}

export function saveVehicles(vehicles: Vehicle[]): void {
  localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
}

export function addVehicle(vehicle: Omit<Vehicle, 'id'>): Vehicle {
  const vehicles = getVehicles();
  const newVehicle: Vehicle = { ...vehicle, id: generateUUID() };
  vehicles.push(newVehicle);
  saveVehicles(vehicles);
  return newVehicle;
}

export function updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle | null {
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === id);
  if (index === -1) return null;
  vehicles[index] = { ...vehicles[index], ...updates };
  saveVehicles(vehicles);
  return vehicles[index];
}

export function deleteVehicle(id: string): boolean {
  const vehicles = getVehicles();
  const filtered = vehicles.filter(v => v.id !== id);
  if (filtered.length === vehicles.length) return false;
  saveVehicles(filtered);
  // Also clean up related data
  deleteGarageNotesForVehicle(id);
  deleteMaintenanceForVehicle(id);
  deleteSavedDiagnosticsForVehicle(id);
  return true;
}

export function getActiveVehicleId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE);
}

export function setActiveVehicleId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_VEHICLE, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_VEHICLE);
  }
}

export function getActiveVehicle(): Vehicle | null {
  const id = getActiveVehicleId();
  if (!id) return null;
  const vehicles = getVehicles();
  return vehicles.find(v => v.id === id) ?? null;
}

// Garage Notes Operations
export function getGarageNotes(vehicleId: string): GarageNote[] {
  const data = localStorage.getItem(STORAGE_KEYS.GARAGE_NOTES);
  const all: GarageNote[] = data ? JSON.parse(data) : [];
  return all.filter(n => n.vehicleId === vehicleId);
}

export function getAllGarageNotes(): GarageNote[] {
  const data = localStorage.getItem(STORAGE_KEYS.GARAGE_NOTES);
  return data ? JSON.parse(data) : [];
}

export function saveAllGarageNotes(notes: GarageNote[]): void {
  localStorage.setItem(STORAGE_KEYS.GARAGE_NOTES, JSON.stringify(notes));
}

export function addGarageNote(note: Omit<GarageNote, 'id' | 'createdAt' | 'updatedAt'>): GarageNote {
  const notes = getAllGarageNotes();
  const now = new Date().toISOString();
  const newNote: GarageNote = {
    ...note,
    id: generateUUID(),
    createdAt: now,
    updatedAt: now,
  };
  notes.push(newNote);
  saveAllGarageNotes(notes);
  return newNote;
}

export function updateGarageNote(id: string, updates: Partial<GarageNote>): GarageNote | null {
  const notes = getAllGarageNotes();
  const index = notes.findIndex(n => n.id === id);
  if (index === -1) return null;
  notes[index] = { ...notes[index], ...updates, updatedAt: new Date().toISOString() };
  saveAllGarageNotes(notes);
  return notes[index];
}

export function deleteGarageNote(id: string): boolean {
  const notes = getAllGarageNotes();
  const filtered = notes.filter(n => n.id !== id);
  if (filtered.length === notes.length) return false;
  saveAllGarageNotes(filtered);
  return true;
}

function deleteGarageNotesForVehicle(vehicleId: string): void {
  const notes = getAllGarageNotes();
  const filtered = notes.filter(n => n.vehicleId !== vehicleId);
  saveAllGarageNotes(filtered);
}

// Maintenance Operations
export function getMaintenanceEvents(vehicleId: string): MaintenanceEvent[] {
  const data = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
  const all: MaintenanceEvent[] = data ? JSON.parse(data) : [];
  return all.filter(m => m.vehicleId === vehicleId);
}

export function getAllMaintenanceEvents(): MaintenanceEvent[] {
  const data = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
  return data ? JSON.parse(data) : [];
}

export function saveAllMaintenanceEvents(events: MaintenanceEvent[]): void {
  localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(events));
}

export function addMaintenanceEvent(event: Omit<MaintenanceEvent, 'id'>): MaintenanceEvent {
  const events = getAllMaintenanceEvents();
  const newEvent: MaintenanceEvent = { ...event, id: generateUUID() };
  events.push(newEvent);
  saveAllMaintenanceEvents(events);
  return newEvent;
}

export function updateMaintenanceEvent(id: string, updates: Partial<MaintenanceEvent>): MaintenanceEvent | null {
  const events = getAllMaintenanceEvents();
  const index = events.findIndex(e => e.id === id);
  if (index === -1) return null;
  events[index] = { ...events[index], ...updates };
  saveAllMaintenanceEvents(events);
  return events[index];
}

export function deleteMaintenanceEvent(id: string): boolean {
  const events = getAllMaintenanceEvents();
  const filtered = events.filter(e => e.id !== id);
  if (filtered.length === events.length) return false;
  saveAllMaintenanceEvents(filtered);
  return true;
}

function deleteMaintenanceForVehicle(vehicleId: string): void {
  const events = getAllMaintenanceEvents();
  const filtered = events.filter(e => e.vehicleId !== vehicleId);
  saveAllMaintenanceEvents(filtered);
}

// Saved Diagnostics Operations
export function getSavedDiagnostics(vehicleId: string): SavedDiagnostic[] {
  const data = localStorage.getItem(STORAGE_KEYS.SAVED_DIAGNOSTICS);
  const all: SavedDiagnostic[] = data ? JSON.parse(data) : [];
  return all.filter(d => d.vehicleId === vehicleId);
}

export function getAllSavedDiagnostics(): SavedDiagnostic[] {
  const data = localStorage.getItem(STORAGE_KEYS.SAVED_DIAGNOSTICS);
  return data ? JSON.parse(data) : [];
}

export function saveAllSavedDiagnostics(diagnostics: SavedDiagnostic[]): void {
  localStorage.setItem(STORAGE_KEYS.SAVED_DIAGNOSTICS, JSON.stringify(diagnostics));
}

export function saveDiagnosticResult(diagnostic: Omit<SavedDiagnostic, 'id' | 'savedAt'>): SavedDiagnostic {
  const diagnostics = getAllSavedDiagnostics();
  const newDiagnostic: SavedDiagnostic = {
    ...diagnostic,
    id: generateUUID(),
    savedAt: new Date().toISOString(),
  };
  diagnostics.push(newDiagnostic);
  saveAllSavedDiagnostics(diagnostics);
  return newDiagnostic;
}

export function deleteSavedDiagnostic(id: string): boolean {
  const diagnostics = getAllSavedDiagnostics();
  const filtered = diagnostics.filter(d => d.id !== id);
  if (filtered.length === diagnostics.length) return false;
  saveAllSavedDiagnostics(filtered);
  return true;
}

function deleteSavedDiagnosticsForVehicle(vehicleId: string): void {
  const diagnostics = getAllSavedDiagnostics();
  const filtered = diagnostics.filter(d => d.vehicleId !== vehicleId);
  saveAllSavedDiagnostics(filtered);
}

// User Preferences
export function getPreferences(): UserPreferences {
  const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
  return data ? JSON.parse(data) : { notificationsEnabled: false, oilReminder: false, seasonalReminders: false };
}

export function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
}

// Safety Acknowledgment
export function isSafetyAcknowledged(): boolean {
  return localStorage.getItem(STORAGE_KEYS.SAFETY_ACKNOWLEDGED) === 'true';
}

export function setSafetyAcknowledged(): void {
  localStorage.setItem(STORAGE_KEYS.SAFETY_ACKNOWLEDGED, 'true');
}
