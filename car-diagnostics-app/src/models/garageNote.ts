/**
 * /src/models/garageNote.ts
 * DATA CONTRACTS (backend-ready)
 */

export type NoteConditions = {
  driving?: boolean;
  weather?: string;
  temperature?: string;
  fuelLevel?: string;
};

export type GarageNote = {
  id: string;
  vehicleId: string;
  text: string;
  category: 'heard' | 'saw' | 'felt' | 'smelled' | 'other';
  dateNoticed?: string; // ISO date
  isIntermittent?: boolean;
  conditions?: NoteConditions;
  resolved: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
};
