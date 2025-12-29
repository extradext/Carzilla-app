/**
 * /src/diagnostics/entryAnchors.ts
 * DOMAIN DEFINITIONS — STATIC (per file contracts)
 *
 * Defines allowed start states (used only to scope hypotheses):
 *  - Won’t start
 *  - Starts then dies
 *  - Noise
 *  - Electrical
 *  - Braking / handling
 *  - HVAC / smells
 */

// TODO: Define canonical entry anchors. Keep static.

export const ENTRY_ANCHORS = {
  WONT_START: "wont_start",
  STARTS_THEN_DIES: "starts_then_dies",
  NOISE: "noise",
  ELECTRICAL: "electrical",
  BRAKING_HANDLING: "braking_handling",
  HVAC_SMELLS: "hvac_smells",
} as const;

export type EntryAnchor = (typeof ENTRY_ANCHORS)[keyof typeof ENTRY_ANCHORS];
