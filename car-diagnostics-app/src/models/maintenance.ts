/**
 * /src/models/maintenance.ts
 * DATA CONTRACTS (backend-ready)
 */

export type MaintenanceEventType =
  | "oil_change"
  | "brake_service"
  | "tire_rotation"
  | "tire_replacement"
  | "battery_replacement"
  | "coolant_flush"
  | "transmission_service"
  | "air_filter"
  | "spark_plugs"
  | "other";

export type MaintenanceEvent = {
  id: string;
  vehicleId: string;
  type: MaintenanceEventType;
  description: string;
  mileage: number;
  date: string; // ISO date
  createdAt: string;
};

export type MileageEntry = {
  id: string;
  vehicleId: string;
  mileage: number;
  date: string; // ISO date
  createdAt: string;
};

export const MAINTENANCE_EVENT_LABELS: Record<MaintenanceEventType, string> = {
  oil_change: "Oil Change",
  brake_service: "Brake Service",
  tire_rotation: "Tire Rotation",
  tire_replacement: "Tire Replacement",
  battery_replacement: "Battery Replacement",
  coolant_flush: "Coolant Flush",
  transmission_service: "Transmission Service",
  air_filter: "Air Filter",
  spark_plugs: "Spark Plugs",
  other: "Other",
};

export function createMaintenanceEvent(
  vehicleId: string,
  type: MaintenanceEventType,
  description: string,
  mileage: number,
  date: string
): MaintenanceEvent {
  return {
    id: crypto.randomUUID(),
    vehicleId,
    type,
    description: description.trim(),
    mileage,
    date,
    createdAt: new Date().toISOString(),
  };
}

export function createMileageEntry(vehicleId: string, mileage: number): MileageEntry {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    vehicleId,
    mileage,
    date: now.split("T")[0],
    createdAt: now,
  };
}
