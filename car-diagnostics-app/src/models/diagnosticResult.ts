/**
 * /src/models/diagnosticResult.ts
 * DATA CONTRACTS (backend-ready)
 */

import type { EntryAnchor } from "../diagnostics/entryAnchors";

export type DiagnosticResult = {
  id: string;
  vehicleId: string;
  timestamp: string; // ISO datetime
  entryAnchor: EntryAnchor;
  topHypothesis: string;
  /** Specific component when diagnosis can be narrowed beyond system level */
  specificComponent?: string;
  confidence: number;
  supportingObservations: string[];
  safetyNotes?: string[];
};
