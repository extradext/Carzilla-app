/**
 * /src/utils/export.ts
 * Export utilities for diagnostic payloads
 * V1-safe and V2-forward compatible
 */

import type { DiagnosticResult } from '../models/diagnosticResult';
import type { Vehicle } from '../models/vehicle';
import type { GarageNote } from '../models/garageNote';
import type { MaintenanceEvent } from '../models/maintenance';

export type ExportPayload = {
  version: string;
  exportedAt: string;
  vehicle?: Partial<Vehicle>;
  result: DiagnosticResult;
  diagnosticAnswers?: Record<string, string>;
  userNotes?: string;
  garageNotes?: GarageNote[];
  maintenance?: MaintenanceEvent[];
};

export function exportDiagnosticPayload(
  result: DiagnosticResult,
  userNotes?: string,
  vehicle?: Vehicle,
  garageNotes?: GarageNote[],
  maintenance?: MaintenanceEvent[],
  diagnosticAnswers?: Record<string, string>
): ExportPayload {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    vehicle: vehicle
      ? {
          id: vehicle.id,
          nickname: vehicle.nickname,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          currentMileage: vehicle.currentMileage,
        }
      : undefined,
    result,
    diagnosticAnswers,
    userNotes,
    garageNotes,
    maintenance,
  };
}

export function createFeedbackPayload(
  result: DiagnosticResult,
  feedbackType: 'rerun_excluding' | 'submit_feedback',
  userNotes?: string,
  vehicle?: Vehicle,
  diagnosticAnswers?: Record<string, string>
): ExportPayload & { feedbackType: string } {
  return {
    ...exportDiagnosticPayload(result, userNotes, vehicle, undefined, undefined, diagnosticAnswers),
    feedbackType,
  };
}
