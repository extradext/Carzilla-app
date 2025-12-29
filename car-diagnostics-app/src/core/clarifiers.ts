/**
 * /src/core/clarifiers.ts
 * LOGIC — IMMUTABLE (per file contracts)
 *
 * Exports:
 *  - List of allowed clarifying questions
 *  - Mapping → hypothesis families
 *
 * Rules:
 *  - Max 3 per run
 *  - Binary only
 *  - Never override measurements
 */

// TODO: Define clarifying questions list and mapping to hypothesis families.
// NOTE: Intentionally unimplemented.

export type Clarifier = {
  id: string;
  question: string;
  familyIds: string[];
  // TODO: enforce binary choices only
};

export const MAX_CLARIFIERS_PER_RUN = 3 as const;

export const CLARIFIERS: Clarifier[] = [
  // TODO
];
