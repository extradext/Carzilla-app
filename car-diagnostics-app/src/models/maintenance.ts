/**
 * /src/models/maintenance.ts
 * DATA CONTRACTS (backend-ready)
 */

export type MaintenanceEvent = {
  id: string;
  vehicleId: string;
  type: string;
  date: string; // ISO date
  mileage: number;
  notes?: string;
};
