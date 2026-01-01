/**
 * /src/models/savedDiagnostic.ts
 * DATA CONTRACTS (backend-ready)
 */

import type { DiagnosticResult } from './diagnosticResult';

export type SavedDiagnostic = {
  id: string;
  vehicleId: string;
  result: DiagnosticResult;
  savedAt: string; // ISO datetime
  userNotes?: string;
};
