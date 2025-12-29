/**
 * /src/models/vehicle.ts
 * DATA CONTRACTS (backend-ready)
 */

export type Vehicle = {
  id: string;
  nickname: string;
  year?: number;
  make?: string;
  model?: string;
  currentMileage: number;
  weeklyMileageAvg: number;
};
