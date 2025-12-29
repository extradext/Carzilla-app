/**
 * /src/models/observation.ts
 * DATA CONTRACTS (backend-ready)
 */

export type Observation = {
  id: string;
  vehicleId: string;
  text: string;
  resolved: boolean;
};
