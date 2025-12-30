/**
 * /src/storage/localStore.ts
 * LOCAL-FIRST, SYNC-READY (per file contracts)
 */

import type { Vehicle } from "../models/vehicle";
import type { DiagnosticResult } from "../models/diagnosticResult";
import type { MaintenanceEvent, MileageEntry } from "../models/maintenance";
import type { UserPreferences } from "../models/userPreferences";
import { DEFAULT_USER_PREFERENCES } from "../models/userPreferences";
import type { ObservationResponse } from "../core/observations";

const STORAGE_KEYS = {
  VEHICLES: "car_diag_vehicles",
  ACTIVE_VEHICLE_ID: "car_diag_active_vehicle",
  OBSERVATIONS: "car_diag_observations", // keyed by vehicleId
  DIAGNOSTIC_RESULTS: "car_diag_results",
  MAINTENANCE_EVENTS: "car_diag_maintenance",
  MILEAGE_ENTRIES: "car_diag_mileage",
  USER_PREFERENCES: "car_diag_preferences",
  USER_NOTES: "car_diag_notes", // keyed by vehicleId
} as const;

// ============================================================================
// VEHICLES
// ============================================================================

export function getVehicles(): Vehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVehicles(vehicles: Vehicle[]): void {
  localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
}

export function addVehicle(vehicle: Vehicle): void {
  const vehicles = getVehicles();
  vehicles.push(vehicle);
  saveVehicles(vehicles);
}

export function updateVehicle(vehicle: Vehicle): void {
  const vehicles = getVehicles();
  const index = vehicles.findIndex((v) => v.id === vehicle.id);
  if (index !== -1) {
    vehicles[index] = { ...vehicle, updatedAt: new Date().toISOString() };
    saveVehicles(vehicles);
  }
}

export function deleteVehicle(vehicleId: string): void {
  const vehicles = getVehicles().filter((v) => v.id !== vehicleId);
  saveVehicles(vehicles);
  
  // Clean up related data
  deleteObservationsForVehicle(vehicleId);
  deleteResultsForVehicle(vehicleId);
  deleteMaintenanceForVehicle(vehicleId);
  deleteMileageEntriesForVehicle(vehicleId);
  deleteNotesForVehicle(vehicleId);
  
  // Clear active vehicle if it was deleted
  if (getActiveVehicleId() === vehicleId) {
    setActiveVehicleId(null);
  }
}

export function getVehicleById(vehicleId: string): Vehicle | null {
  return getVehicles().find((v) => v.id === vehicleId) ?? null;
}

// ============================================================================
// ACTIVE VEHICLE
// ============================================================================

export function getActiveVehicleId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE_ID);
}

export function setActiveVehicleId(vehicleId: string | null): void {
  if (vehicleId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_VEHICLE_ID, vehicleId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_VEHICLE_ID);
  }
}

export function getActiveVehicle(): Vehicle | null {
  const id = getActiveVehicleId();
  if (!id) return null;
  return getVehicleById(id);
}

// ============================================================================
// OBSERVATIONS (per vehicle, persistent)
// ============================================================================

type ObservationsMap = Record<string, ObservationResponse[]>;

function getAllObservations(): ObservationsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OBSERVATIONS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllObservations(map: ObservationsMap): void {
  localStorage.setItem(STORAGE_KEYS.OBSERVATIONS, JSON.stringify(map));
}

export function getObservationsForVehicle(vehicleId: string): ObservationResponse[] {
  return getAllObservations()[vehicleId] ?? [];
}

export function saveObservationsForVehicle(vehicleId: string, observations: ObservationResponse[]): void {
  const map = getAllObservations();
  map[vehicleId] = observations;
  saveAllObservations(map);
}

export function deleteObservationsForVehicle(vehicleId: string): void {
  const map = getAllObservations();
  delete map[vehicleId];
  saveAllObservations(map);
}

// ============================================================================
// USER NOTES (per vehicle, free-text observations)
// ============================================================================

type NotesMap = Record<string, string[]>;

function getAllNotes(): NotesMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_NOTES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllNotes(map: NotesMap): void {
  localStorage.setItem(STORAGE_KEYS.USER_NOTES, JSON.stringify(map));
}

export function getNotesForVehicle(vehicleId: string): string[] {
  return getAllNotes()[vehicleId] ?? [];
}

export function saveNotesForVehicle(vehicleId: string, notes: string[]): void {
  const map = getAllNotes();
  map[vehicleId] = notes;
  saveAllNotes(map);
}

export function addNoteForVehicle(vehicleId: string, note: string): void {
  const notes = getNotesForVehicle(vehicleId);
  notes.push(note.trim());
  saveNotesForVehicle(vehicleId, notes);
}

export function deleteNoteForVehicle(vehicleId: string, index: number): void {
  const notes = getNotesForVehicle(vehicleId);
  notes.splice(index, 1);
  saveNotesForVehicle(vehicleId, notes);
}

export function deleteNotesForVehicle(vehicleId: string): void {
  const map = getAllNotes();
  delete map[vehicleId];
  saveAllNotes(map);
}

// ============================================================================
// DIAGNOSTIC RESULTS
// ============================================================================

export function getDiagnosticResults(): DiagnosticResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DIAGNOSTIC_RESULTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDiagnosticResults(results: DiagnosticResult[]): void {
  localStorage.setItem(STORAGE_KEYS.DIAGNOSTIC_RESULTS, JSON.stringify(results));
}

export function addDiagnosticResult(result: DiagnosticResult): void {
  const results = getDiagnosticResults();
  results.unshift(result); // Most recent first
  saveDiagnosticResults(results);
}

export function getResultsForVehicle(vehicleId: string): DiagnosticResult[] {
  return getDiagnosticResults().filter((r) => r.vehicleId === vehicleId);
}

export function deleteResultsForVehicle(vehicleId: string): void {
  const results = getDiagnosticResults().filter((r) => r.vehicleId !== vehicleId);
  saveDiagnosticResults(results);
}

// ============================================================================
// MAINTENANCE EVENTS
// ============================================================================

export function getMaintenanceEvents(): MaintenanceEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAINTENANCE_EVENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMaintenanceEvents(events: MaintenanceEvent[]): void {
  localStorage.setItem(STORAGE_KEYS.MAINTENANCE_EVENTS, JSON.stringify(events));
}

export function addMaintenanceEvent(event: MaintenanceEvent): void {
  const events = getMaintenanceEvents();
  events.unshift(event);
  saveMaintenanceEvents(events);
}

export function getMaintenanceForVehicle(vehicleId: string): MaintenanceEvent[] {
  return getMaintenanceEvents().filter((e) => e.vehicleId === vehicleId);
}

export function deleteMaintenanceEvent(eventId: string): void {
  const events = getMaintenanceEvents().filter((e) => e.id !== eventId);
  saveMaintenanceEvents(events);
}

export function deleteMaintenanceForVehicle(vehicleId: string): void {
  const events = getMaintenanceEvents().filter((e) => e.vehicleId !== vehicleId);
  saveMaintenanceEvents(events);
}

// ============================================================================
// MILEAGE ENTRIES
// ============================================================================

export function getMileageEntries(): MileageEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MILEAGE_ENTRIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMileageEntries(entries: MileageEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.MILEAGE_ENTRIES, JSON.stringify(entries));
}

export function addMileageEntry(entry: MileageEntry): void {
  const entries = getMileageEntries();
  entries.unshift(entry);
  saveMileageEntries(entries);
}

export function getMileageEntriesForVehicle(vehicleId: string): MileageEntry[] {
  return getMileageEntries().filter((e) => e.vehicleId === vehicleId);
}

export function deleteMileageEntriesForVehicle(vehicleId: string): void {
  const entries = getMileageEntries().filter((e) => e.vehicleId !== vehicleId);
  saveMileageEntries(entries);
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

export function getUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return raw ? { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_USER_PREFERENCES;
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs));
}
