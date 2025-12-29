import { runDiagnosticEngine } from "./src/engine/diagnosticEngine";
import { calculateConfidence } from "./src/core/confidence";
import { scoreHypotheses } from "./src/core/scoring";
import {
  OBSERVATION_IDS,
  OBSERVATION_STRENGTH,
  OBSERVATION_VALUE,
  type ObservationResponse,
} from "./src/core/observations";

type TestResult = {
  name: string;
  status: "PASS" | "FAIL";
  expected: string;
  actual: string;
  failureReason?: string;
};

function fmt(obj: any) {
  return JSON.stringify(obj);
}

function pass(name: string, expected: string, actual: string): TestResult {
  return { name, status: "PASS", expected, actual };
}

function fail(name: string, expected: string, actual: string, why: string): TestResult {
  return { name, status: "FAIL", expected, actual, failureReason: why };
}

function topAbs(scores: Record<string, number>): { family: string | null; score: number } {
  let bestFamily: string | null = null;
  let bestAbs = 0;
  let bestScore = 0;
  for (const [family, score] of Object.entries(scores)) {
    const abs = Math.abs(score);
    if (abs > bestAbs) {
      bestAbs = abs;
      bestFamily = family;
      bestScore = score;
    }
  }
  if (bestAbs === 0) return { family: null, score: 0 };
  return { family: bestFamily, score: bestScore };
}

// 1) Safety Override Test
function safetyOverrideCase(observationId: string): TestResult {
  const out = runDiagnosticEngine({
    vehicleId: "vehicle-1",
    entryAnchor: "wont_start" as any,
    observations: [{ id: observationId as any, value: OBSERVATION_VALUE.YES }],
  });

  const expected = "bypass scoring; topHypothesis=SAFETY_OVERRIDE; confidence=0; scores omitted";
  const actual = `topHypothesis=${fmt((out.result as any).topHypothesis)} confidence=${out.result.confidence} scoresPresent=${out.scores !== undefined}`;

  if (out.scores !== undefined) return fail(`Safety Override (${observationId})`, expected, actual, "Engine did not omit scores on safety override.");
  if ((out.result as any).topHypothesis !== "SAFETY_OVERRIDE") return fail(`Safety Override (${observationId})`, expected, actual, "Engine did not set topHypothesis to SAFETY_OVERRIDE.");
  if (out.result.confidence !== 0) return fail(`Safety Override (${observationId})`, expected, actual, "Engine did not set confidence to 0 on safety override.");

  return pass(`Safety Override (${observationId})`, expected, actual);
}

// 2) Single-Family Dominance
function singleFamilyDominance(): TestResult {
  // Requested observation names: weak_lights, recent_jump_start, slow_crank
  // Mapped to existing IDs:
  // - weak_lights -> HEADLIGHTS_DIM (NOTE: maps primary=alternator in current rules)
  // - recent_jump_start -> JUMP_START_HELPS
  // - slow_crank -> ENGINE_CRANKS_SLOWLY
  const observations: ObservationResponse[] = [
    { id: OBSERVATION_IDS.HEADLIGHTS_DIM as any, value: OBSERVATION_VALUE.YES, strength: OBSERVATION_STRENGTH.WEAK },
    { id: OBSERVATION_IDS.JUMP_START_HELPS as any, value: OBSERVATION_VALUE.YES, strength: OBSERVATION_STRENGTH.STRONG },
    { id: OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY as any, value: OBSERVATION_VALUE.YES, strength: OBSERVATION_STRENGTH.STRONG },
  ];

  const scores = scoreHypotheses(observations) as Record<string, number>;
  const top = topAbs(scores);
  const conf = calculateConfidence(scores);

  const expected = "topHypothesis=battery; confidence>=0.80; others not close";
  const actual = `top=${fmt(top.family)} topScore=${top.score} confidence=${conf.confidence} band=${conf.band} scores=${fmt(scores)}`;

  if (top.family !== "battery") {
    return fail(
      "Single-Family Dominance (battery)",
      expected,
      actual,
      "Current rules map HEADLIGHTS_DIM to primary=alternator, so battery is not guaranteed to be top with the requested input set."
    );
  }
  if (conf.confidence < 0.8) {
    return fail(
      "Single-Family Dominance (battery)",
      expected,
      actual,
      "Confidence did not reach 0.80 with the provided observations."
    );
  }

  return pass("Single-Family Dominance (battery)", expected, actual);
}

// 3) Cross-Family Spillover
function crossFamilySpillover(): TestResult {
  // Requested: dim_lights where battery is primary and alternator is secondary.
  // Existing mapping: HEADLIGHTS_DIM is primary=alternator; secondary=battery+grounds.
  const observations: ObservationResponse[] = [
    { id: OBSERVATION_IDS.HEADLIGHTS_DIM as any, value: OBSERVATION_VALUE.YES, strength: OBSERVATION_STRENGTH.STRONG },
  ];

  const scores = scoreHypotheses(observations) as Record<string, number>;
  const alternator = scores["alternator"] ?? 0;
  const battery = scores["battery"] ?? 0;

  const expected = "Battery dominant; alternator>0 but ≪ battery (~2%); ranking unchanged";
  const ratio = Math.abs(alternator) > 0 ? Math.abs(battery) / Math.abs(alternator) : 0;
  const actual = `alternator=${alternator} battery=${battery} ratio(battery/alternator)=${ratio} scores=${fmt(scores)}`;

  // With current mapping, alternator should be dominant and battery should be small (>0).
  const spilloverOk = Math.abs(battery) > 0 && ratio < 0.05;
  const batteryDominant = Math.abs(battery) > Math.abs(alternator);

  if (!spilloverOk) {
    return fail(
      "Cross-Family Spillover",
      expected,
      actual,
      "Secondary spillover was not observed at the expected small magnitude."
    );
  }
  if (!batteryDominant) {
    return fail(
      "Cross-Family Spillover",
      expected,
      actual,
      "Current mapping makes alternator the primary family for HEADLIGHTS_DIM, so battery cannot be the dominant score for this test input."
    );
  }

  return pass("Cross-Family Spillover", expected, actual);
}

// 4) Medium-Only Cap
function mediumOnlyCap(): TestResult {
  const obs2: ObservationResponse[] = [
    { id: OBSERVATION_IDS.VIBRATION_AT_SPEED as any, value: OBSERVATION_VALUE.YES, strength: OBSERVATION_STRENGTH.MEDIUM },
    { id: OBSERVATION_IDS.STEERING_WHEEL_SHAKE as any, value: OBSERVATION_VALUE.YES, strength: OBSERVATION_STRENGTH.MEDIUM },
  ];
  const obs3: ObservationResponse[] = [...obs2, { id: OBSERVATION_IDS.UNEVEN_TIRE_WEAR_VISIBLE as any, value: OBSERVATION_VALUE.YES, strength: OBSERVATION_STRENGTH.MEDIUM }];

  const scores2 = scoreHypotheses(obs2) as Record<string, number>;
  const scores3 = scoreHypotheses(obs3) as Record<string, number>;
  const tires2 = scores2["tires_wheels"] ?? 0;
  const tires3 = scores3["tires_wheels"] ?? 0;

  // Expected cap: positive medium contribution capped at 13, then conflict dampening halves => 6.5
  const expectedCapped = 6.5;

  // Adding one strong lifts cap.
  const scoresStrong = scoreHypotheses([
    ...obs2,
    { id: OBSERVATION_IDS.UNEVEN_TIRE_WEAR_VISIBLE as any, value: OBSERVATION_VALUE.YES, strength: OBSERVATION_STRENGTH.STRONG },
  ]) as Record<string, number>;
  const tiresStrong = scoresStrong["tires_wheels"] ?? 0;

  const expected = "Tire score capped at 13 (after dampening => 6.5); third medium no increase; strong lifts cap";
  const actual = `tires(2 medium)=${tires2} tires(3 medium)=${tires3} tires(with strong)=${tiresStrong}`;

  if (Math.abs(tires2 - expectedCapped) > 1e-9) {
    return fail("Medium-Only Cap", expected, actual, "Tire score did not match expected capped value.");
  }
  if (Math.abs(tires3 - tires2) > 1e-9) {
    return fail("Medium-Only Cap", expected, actual, "Adding a third medium increased score but should not.");
  }
  if (tiresStrong <= tires2) {
    return fail("Medium-Only Cap", expected, actual, "Adding a strong did not lift the cap.");
  }

  return pass("Medium-Only Cap", expected, actual);
}

// 5) Conflict Dampening
function conflictDampening(): TestResult {
  // Requested: brake_drag=YES, wheel_not_hot=NO
  // Use existing IDs: PULLS_WHEN_BRAKING (brake drag indicator) YES, and WHEEL_HOTTER_THAN_OTHERS NO.
  const observations: ObservationResponse[] = [
    { id: OBSERVATION_IDS.PULLS_WHEN_BRAKING as any, value: OBSERVATION_VALUE.YES, strength: OBSERVATION_STRENGTH.STRONG },
    { id: OBSERVATION_IDS.WHEEL_HOTTER_THAN_OTHERS as any, value: OBSERVATION_VALUE.NO, strength: OBSERVATION_STRENGTH.MEDIUM },
  ];

  const scores = scoreHypotheses(observations) as Record<string, number>;
  const brakes = scores["brakes_heat_drag"] ?? 0;

  // Expected: pos=26, neg=13 => net=13 => dampened=6.5
  const expectedVal = 6.5;

  const expected = "Net reduced by 50% after conflict; family not overly dominant without more evidence";
  const actual = `brakes_heat_drag=${brakes} scores=${fmt(scores)}`;

  if (Math.abs(brakes - expectedVal) > 1e-9) {
    return fail("Conflict Dampening", expected, actual, "Net score did not match expected conflict-dampened value.");
  }

  return pass("Conflict Dampening", expected, actual);
}

// 6) Zero / Tie Case
function zeroTieCase(): TestResult {
  const out = runDiagnosticEngine({
    vehicleId: "vehicle-1",
    entryAnchor: "noise" as any,
    observations: [],
  });

  const scores = out.scores ?? {};
  const conf = calculateConfidence(scores);

  const expected = "topHypothesis=null; confidence band=UNSURE";
  const actual = `topHypothesis=${fmt((out.result as any).topHypothesis)} confidence=${out.result.confidence} band=${conf.band} scoresPresent=${out.scores !== undefined}`;

  if ((out.result as any).topHypothesis !== null) {
    return fail("Zero / Tie Case", expected, actual, "Engine did not set topHypothesis to null when all scores are zero.");
  }
  if (conf.band !== "UNSURE") {
    return fail("Zero / Tie Case", expected, actual, "Confidence band was not UNSURE for zero scores.");
  }

  return pass("Zero / Tie Case", expected, actual);
}

const results: TestResult[] = [];

// 1) Safety override: test each trigger
results.push(safetyOverrideCase(OBSERVATION_IDS.OIL_PRESSURE_WARNING));
results.push(safetyOverrideCase(OBSERVATION_IDS.OVERHEATING_WARNING));
results.push(safetyOverrideCase(OBSERVATION_IDS.FLASHING_CEL));
results.push(safetyOverrideCase(OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN));
results.push(safetyOverrideCase(OBSERVATION_IDS.BRAKE_FAILURE_WARNING));

// 2) Battery dominance
results.push(singleFamilyDominance());

// 3) Spillover
results.push(crossFamilySpillover());

// 4) Medium-only cap
results.push(mediumOnlyCap());

// 5) Conflict dampening
results.push(conflictDampening());

// 6) Zero/tie
results.push(zeroTieCase());

console.log("\nFLOW VALIDATION REPORT\n");
for (const r of results) {
  console.log(`${r.status === "PASS" ? "✅" : "❌"} ${r.status} - ${r.name}`);
  if (r.status === "PASS") {
    console.log(`  expected: ${r.expected}`);
    console.log(`  actual:   ${r.actual}`);
  } else {
    console.log(`  expected: ${r.expected}`);
    console.log(`  actual:   ${r.actual}`);
    console.log(`  why:      ${r.failureReason}`);
  }
}

const failed = results.filter((r) => r.status === "FAIL");
process.exitCode = failed.length ? 1 : 0;
