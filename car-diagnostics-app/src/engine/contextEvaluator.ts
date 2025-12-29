/**
 * /src/engine/contextEvaluator.ts
 * ORCHESTRATION/GLUE (per file contracts)
 *
 * Purpose:
 * - Produce a "Known Issues" context panel to help explain how user-known issues
 *   relate to the diagnostic result.
 *
 * Rules:
 * - Do NOT affect scores, rankings, or confidence.
 * - Pure functions only.
 * - No scoring math.
 * - No safety logic.
 * - No measurements logic.
 */

import type { DiagnosticResult } from "../models/diagnosticResult";

/** UI classification symbols. */
export type KnownIssueClassification = "+" | "±" | "–";

export type KnownIssue = {
  /** Stable key for storage/export. */
  id: string;
  /** User-provided description, e.g., "weak battery", "coolant leak". */
  label: string;
  /** Optional tags to help relate an issue to a family/result. */
  tags?: string[];
};

export type ContextPanelItem = {
  issueId: string;
  issueLabel: string;
  classification: KnownIssueClassification;
  explanation: string;
};

export type ContextEvaluation = {
  /** The unchanged diagnostic result this panel refers to. */
  resultId: string | null;
  topHypothesis: string | null;
  /** Items to render in the context panel. */
  items: ContextPanelItem[];
  /** Explanatory footer shown in UI. */
  notes: string[];
};

function normalizeText(s: string): string {
  return s.trim().toLowerCase();
}

function hasAnyTag(issue: KnownIssue, tags: string[]): boolean {
  const itags = (issue.tags ?? []).map(normalizeText);
  return tags.some((t) => itags.includes(normalizeText(t)));
}

/**
 * Minimal, conservative matching between known issues and a top hypothesis.
 *
 * IMPORTANT:
 * - This is NOT diagnosis logic and must not change the result.
 * - It is purely for explanation.
 * - Matching is intentionally conservative and relies on tags/keywords.
 */
function classifyIssueAgainstTopHypothesis(issue: KnownIssue, topHypothesis: string | null): ContextPanelItem {
  const label = normalizeText(issue.label);
  const top = topHypothesis ? normalizeText(topHypothesis) : null;

  // If no top hypothesis, everything is neutral.
  if (!top) {
    return {
      issueId: issue.id,
      issueLabel: issue.label,
      classification: "±",
      explanation: "No top hypothesis available; this issue is shown for context only.",
    };
  }

  // Keyword/tag helpers (conservative; not exhaustive).
  const batteryLike = ["battery", "weak battery", "dead battery", "slow crank", "charging"]; 
  const alternatorLike = ["alternator", "charging", "battery light"]; 
  const groundsLike = ["ground", "grounds", "connection", "corrosion", "terminal"]; 
  const fuelLike = ["fuel", "fuel pump", "fuel smell", "gas smell"]; 
  const ignitionLike = ["misfire", "spark", "ignition", "rough idle"]; 
  const brakesLike = ["brake", "brakes", "brake work", "caliper", "rotor", "pads"]; 
  const tiresLike = ["tire", "tires", "wheel", "balance", "alignment", "pressure"]; 
  const suspensionLike = ["suspension", "strut", "shock", "control arm", "bushing"]; 
  const steeringLike = ["steering", "power steering", "eps"]; 
  const hvacLike = ["hvac", "ac", "a/c", "heat", "blower", "vents"]; 
  const exhaustLike = ["exhaust", "muffler", "cabin exhaust", "fumes"]; 

  const matchesTop = (keywords: string[]) => {
    return keywords.some((k) => label.includes(normalizeText(k))) || hasAnyTag(issue, keywords);
  };

  // Support: issue matches the top hypothesis family keywords.
  const supportByFamily: Array<[string, string[]]> = [
    ["battery", batteryLike],
    ["alternator", alternatorLike],
    ["grounds", groundsLike],
    ["fuel", fuelLike],
    ["ignition", ignitionLike],
    ["brakes_heat_drag", brakesLike],
    ["tires_wheels", tiresLike],
    ["suspension", suspensionLike],
    ["steering_hydraulic", steeringLike],
    ["steering_eps", steeringLike],
    ["hvac", hvacLike],
    ["exhaust", exhaustLike],
  ];

  const supported = supportByFamily.find(([family]) => top.includes(family));
  if (supported && matchesTop(supported[1])) {
    return {
      issueId: issue.id,
      issueLabel: issue.label,
      classification: "+",
      explanation: "This known issue is related to the current top hypothesis (context only).",
    };
  }

  // Contradiction: user says issue was recently addressed for the same domain.
  // This is conservative and does not override the result.
  const recentlyFixedIndicators = ["recent", "recently", "just", "replaced", "new", "fixed", "service", "work done"]; 
  const indicatesRecentWork = recentlyFixedIndicators.some((k) => label.includes(k));
  if (indicatesRecentWork && supported && matchesTop(supported[1])) {
    return {
      issueId: issue.id,
      issueLabel: issue.label,
      classification: "–",
      explanation:
        "This issue suggests recent work in the same area; it may reduce confidence subjectively, but does not change the diagnostic result.",
    };
  }

  // Neutral: related-ish but not clearly supporting or contradicting.
  return {
    issueId: issue.id,
    issueLabel: issue.label,
    classification: "±",
    explanation: "This issue may be related, but it does not clearly support or contradict the top hypothesis.",
  };
}

export type ContextEvaluatorInput = {
  result: DiagnosticResult;
  knownIssues: KnownIssue[];
};

export function evaluateContext(input: ContextEvaluatorInput): ContextEvaluation {
  const topHypothesis = (input.result as any)?.topHypothesis ?? null;
  const resultId = (input.result as any)?.id ?? null;

  const items = (input.knownIssues ?? []).map((issue) => classifyIssueAgainstTopHypothesis(issue, topHypothesis));

  return {
    resultId,
    topHypothesis,
    items,
    notes: [
      "Context panel is informational only.",
      "It does not affect scoring, rankings, or confidence.",
      "If an issue is unclear, it is marked neutral (±).",
    ],
  };
}
