/**
 * /src/core/scoring.ts
 * NON-NEGOTIABLE LOGIC (per file contracts)
 *
 * Purpose:
 * - Convert observations into weighted hypothesis-family scores.
 *
 * Output:
 * - Deterministic map of hypothesisFamily → score.
 *
 * Rules (authoritative; do not change without authorization):
 * - Weights: Weak=6 / Medium=13 / Strong=26
 * - Cross-family multiplier: 0.02
 *   - Apply full weight to primary family
 *   - Apply (weight × 0.02) ONLY to explicitly listed secondary families
 *   - No spillover to unrelated families
 * - Medium-only caps:
 *   - If a family has zero strong observations, total positive medium contribution is capped at 13
 *   - Weak observations are uncapped
 *   - Cap is lifted once any strong observation exists
 * - Conflict dampening:
 *   - Separate positive and negative contributions per family
 *   - net = abs(positive − negative)
 *   - final = net × 0.5
 *   - Preserve sign of dominant side
 *   - Apply after caps, before confidence calculation
 * - Skip / Unsure are neutral (no weight)
 * - Clarifiers are NOT consumed here; they are resolved upstream and expressed as observations
 *
 * Constraints:
 * - No safety logic
 * - No measurements logic (handled elsewhere)
 * - No diagnosis output (no ranking, no top hypothesis here)
 */

import { HYPOTHESIS_FAMILIES, type HypothesisFamilyId } from "../diagnostics/hypothesisFamilies";
import { DIAGNOSTIC_RULES } from "../diagnostics/rules";
import {
  normalizeObservationValue,
  OBSERVATION_DEFINITIONS,
  OBSERVATION_STRENGTH,
  OBSERVATION_VALUE,
  type ObservationId,
  type ObservationResponse,
} from "./observations";

export const CROSS_FAMILY_MULTIPLIER = 0.02 as const;

type FamilyRule = {
  primary: HypothesisFamilyId;
  secondary?: HypothesisFamilyId[];
};

/**
 * Expected shape for /src/diagnostics/rules.ts.
 *
 * TODO: When diagnostics rules are authored, ensure it provides:
 *   DIAGNOSTIC_RULES.observationFamilies: Record<ObservationId, { primary, secondary? }>
 *
 * This module does not invent family mappings; it consumes them if present.
 */
function getFamiliesForObservation(id: ObservationId): FamilyRule | undefined {
  const anyRules: any = DIAGNOSTIC_RULES as any;
  const map: Record<string, FamilyRule> | undefined = anyRules?.observationFamilies;
  const rule = map?.[id];
  if (!rule) return undefined;
  if (!rule.primary) return undefined;
  return {
    primary: rule.primary,
    secondary: Array.isArray(rule.secondary) ? rule.secondary : undefined,
  };
}

type StrengthBucket = "WEAK" | "MEDIUM" | "STRONG";

function bucketStrength(strength: number): StrengthBucket {
  if (strength === OBSERVATION_STRENGTH.STRONG) return "STRONG";
  if (strength === OBSERVATION_STRENGTH.MEDIUM) return "MEDIUM";
  return "WEAK";
}

function resolveStrength(o: ObservationResponse): { baseStrength: number; bucket: StrengthBucket } {
  // Prefer explicit strength if provided; else fall back to definition default.
  const explicit = typeof o.strength === "number" ? o.strength : undefined;
  const def = (OBSERVATION_DEFINITIONS as any)[o.id] as { defaultStrength?: number } | undefined;
  const baseStrength = explicit ?? def?.defaultStrength ?? OBSERVATION_STRENGTH.WEAK;
  return { baseStrength, bucket: bucketStrength(baseStrength) };
}

type FamilyAccumulator = {
  posWeak: number;
  posMedium: number;
  posStrong: number;
  negWeak: number;
  negMedium: number;
  negStrong: number;
  /** True once any strong observation exists for this family (positive or negative). */
  hasAnyStrong: boolean;
};

function createEmptyAcc(): FamilyAccumulator {
  return {
    posWeak: 0,
    posMedium: 0,
    posStrong: 0,
    negWeak: 0,
    negMedium: 0,
    negStrong: 0,
    hasAnyStrong: false,
  };
}

function addContribution(acc: FamilyAccumulator, sign: 1 | -1, bucket: StrengthBucket, amount: number): void {
  // NOTE: amount may be fractional (e.g., cross-family multiplier). Bucket is derived from the base strength.
  if (sign === 1) {
    if (bucket === "WEAK") acc.posWeak += amount;
    if (bucket === "MEDIUM") acc.posMedium += amount;
    if (bucket === "STRONG") {
      acc.posStrong += amount;
      acc.hasAnyStrong = true;
    }
  } else {
    if (bucket === "WEAK") acc.negWeak += amount;
    if (bucket === "MEDIUM") acc.negMedium += amount;
    if (bucket === "STRONG") {
      acc.negStrong += amount;
      acc.hasAnyStrong = true;
    }
  }
}

function applyMediumCap(acc: FamilyAccumulator): void {
  // Medium-only cap applies only to positive medium contributions and only if the family has zero strong observations.
  if (acc.hasAnyStrong) return;
  if (acc.posMedium > OBSERVATION_STRENGTH.MEDIUM) acc.posMedium = OBSERVATION_STRENGTH.MEDIUM;
}

function finalizeScore(acc: FamilyAccumulator): number {
  applyMediumCap(acc);

  const positive = acc.posWeak + acc.posMedium + acc.posStrong;
  const negative = acc.negWeak + acc.negMedium + acc.negStrong;

  if (positive === 0 && negative === 0) return 0;

  const dominantSign: 1 | -1 = positive >= negative ? 1 : -1;
  const net = Math.abs(positive - negative);
  const dampened = net * 0.5;
  return dominantSign * dampened;
}

function initAllFamilies(): Record<HypothesisFamilyId, FamilyAccumulator> {
  const all = Object.values(HYPOTHESIS_FAMILIES) as HypothesisFamilyId[];
  const out = {} as Record<HypothesisFamilyId, FamilyAccumulator>;
  for (const f of all) out[f] = createEmptyAcc();
  return out;
}

function normalizeObservationsInput(input: unknown): ObservationResponse[] {
  if (Array.isArray(input)) return input as ObservationResponse[];
  return [];
}

/**
 * Score hypotheses by family.
 *
 * @param observations Array of ObservationResponse (clarifiers must already be expressed as observations upstream)
 * @param measurements Unused here (no measurement logic in scoring.ts)
 */
export function scoreHypotheses(
  observations: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  measurements?: unknown
): Record<HypothesisFamilyId, number> {
  const obs = normalizeObservationsInput(observations);
  const accByFamily = initAllFamilies();

  for (const o of obs) {
    // Skip/Unsure are neutral.
    const v = normalizeObservationValue(o.value);
    if (v !== OBSERVATION_VALUE.YES && v !== OBSERVATION_VALUE.NO) continue;

    const families = getFamiliesForObservation(o.id as ObservationId);
    if (!families) {
      // No family mapping defined for this observation; scoring remains unaffected.
      // TODO: Ensure /src/diagnostics/rules.ts defines the observationFamilies mapping.
      continue;
    }

    const { baseStrength, bucket } = resolveStrength(o);
    const sign: 1 | -1 = v === OBSERVATION_VALUE.YES ? 1 : -1;

    // Primary family: full weight.
    addContribution(accByFamily[families.primary], sign, bucket, baseStrength);

    // Secondary families: cross-family spillover only to explicit secondaries.
    if (families.secondary && families.secondary.length > 0) {
      const spill = baseStrength * CROSS_FAMILY_MULTIPLIER;
      for (const secondaryFamily of families.secondary) {
        addContribution(accByFamily[secondaryFamily], sign, bucket, spill);
      }
    }
  }

  const out = {} as Record<HypothesisFamilyId, number>;
  for (const [family, acc] of Object.entries(accByFamily) as Array<[HypothesisFamilyId, FamilyAccumulator]>) {
    out[family] = finalizeScore(acc);
  }

  return out;
}
