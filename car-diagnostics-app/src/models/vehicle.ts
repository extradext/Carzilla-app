/**
 * /src/models/vehicle.ts
 * DATA CONTRACTS (backend-ready)
 */

export type Vehicle = {
  id: string;
  name: string;
  make: string;
  model: string;
  year?: number;
  currentMileage: number;
  weeklyMileageAvg: number;
  createdAt: string;
  updatedAt: string;
};

export type VehicleFormData = {
  name: string;
  make: string;
  model: string;
  year?: number;
  currentMileage?: number;
};

export function createVehicle(data: VehicleFormData): Vehicle {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    make: data.make.trim(),
    model: data.model.trim(),
    year: data.year,
    currentMileage: data.currentMileage ?? 0,
    weeklyMileageAvg: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneVehicle(source: Vehicle, newName: string): Vehicle {
  const now = new Date().toISOString();
  return {
    ...source,
    id: crypto.randomUUID(),
    name: newName.trim(),
    createdAt: now,
    updatedAt: now,
  };
}
