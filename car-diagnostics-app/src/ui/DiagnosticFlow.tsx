/**
 * /src/ui/DiagnosticFlow.tsx
 * PRESENTATION ONLY
 * 
 * Progressive, multi-question elimination flow.
 * - No single-question diagnosis
 * - No dropdown diagnosis
 * - Contextual answers per question (Yes/No/Unsure)
 * - Back arrow at every stage
 * - Start Over button clears current session only
 */

import React, { useState, useMemo } from "react";
import { runDiagnosticEngine } from "../engine/diagnosticEngine";
import type { DiagnosticResult } from "../models/diagnosticResult";
import type { EntryAnchor } from "../diagnostics/entryAnchors";
import { ENTRY_ANCHORS } from "../diagnostics/entryAnchors";
import {
  OBSERVATION_IDS,
  OBSERVATION_DEFINITIONS,
  OBSERVATION_VALUE,
  type ObservationId,
  type ObservationResponse,
} from "../core/observations";
import { generateUUID } from "../utils/uuid";

type DiagnosticFlowProps = {
  vehicleId: string | null;
  onResult: (result: DiagnosticResult, answers: Record<string, string>) => void;
};

type FlowStep = "entry" | "questions" | "complete";

// Define question sequences by entry anchor
// These are progressive questions that narrow down the diagnosis
const QUESTION_SEQUENCES: Record<EntryAnchor, ObservationId[][]> = {
  [ENTRY_ANCHORS.WONT_START]: [
    // Phase 1: Initial symptoms
    [OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY, OBSERVATION_IDS.RAPID_CLICKING_ON_START],
    // Phase 2: Click type
    [OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK, OBSERVATION_IDS.NO_CLICK_NO_CRANK],
    // Phase 3: Jump start response
    [OBSERVATION_IDS.JUMP_START_HELPS, OBSERVATION_IDS.BATTERY_LIGHT_ON],
    // Phase 4: Visual/audio checks
    [OBSERVATION_IDS.TERMINALS_CORRODED, OBSERVATION_IDS.FUEL_PUMP_SOUND_NOT_HEARD],
    // Phase 5: Additional indicators
    [OBSERVATION_IDS.HEADLIGHTS_DIM, OBSERVATION_IDS.DASH_RESETS_WHEN_CRANKING],
  ],
  [ENTRY_ANCHORS.STARTS_THEN_DIES]: [
    [OBSERVATION_IDS.STARTS_THEN_STALLS, OBSERVATION_IDS.LONG_CRANK_BEFORE_START],
    [OBSERVATION_IDS.STALLS_ON_ACCELERATION, OBSERVATION_IDS.LOSS_OF_POWER_UPHILL],
    [OBSERVATION_IDS.ROUGH_IDLE, OBSERVATION_IDS.ENGINE_MISFIRES_AT_IDLE],
    [OBSERVATION_IDS.FUEL_PUMP_SOUND_NOT_HEARD, OBSERVATION_IDS.RAW_FUEL_SMELL_OUTSIDE],
  ],
  [ENTRY_ANCHORS.NOISE]: [
    [OBSERVATION_IDS.GRINDING_NOISE_WHEN_BRAKING, OBSERVATION_IDS.CLUNK_OVER_BUMPS],
    [OBSERVATION_IDS.HUMMING_GROWL_CHANGES_WITH_SPEED, OBSERVATION_IDS.RATTLE_OVER_ROUGH_ROAD],
    [OBSERVATION_IDS.WHINE_WHEN_TURNING, OBSERVATION_IDS.BACKFIRE_POP_NOISE],
    [OBSERVATION_IDS.VIBRATION_AT_SPEED, OBSERVATION_IDS.STEERING_WHEEL_SHAKE],
  ],
  [ENTRY_ANCHORS.ELECTRICAL]: [
    [OBSERVATION_IDS.LIGHTS_FLICKER, OBSERVATION_IDS.INTERMITTENT_NO_POWER],
    [OBSERVATION_IDS.HEADLIGHTS_DIM, OBSERVATION_IDS.RADIO_RESETS],
    [OBSERVATION_IDS.BATTERY_LIGHT_ON, OBSERVATION_IDS.RELAY_CLICKING_HEARD],
    [OBSERVATION_IDS.TERMINALS_CORRODED, OBSERVATION_IDS.DASH_RESETS_WHEN_CRANKING],
  ],
  [ENTRY_ANCHORS.BRAKING_HANDLING]: [
    [OBSERVATION_IDS.BRAKE_PEDAL_SOFT, OBSERVATION_IDS.BRAKE_PEDAL_PULSATION],
    [OBSERVATION_IDS.PULLS_WHEN_BRAKING, OBSERVATION_IDS.PULLS_TO_ONE_SIDE],
    [OBSERVATION_IDS.STEERING_FEELS_HEAVY, OBSERVATION_IDS.STEERING_WANDERS],
    [OBSERVATION_IDS.WHEEL_HOTTER_THAN_OTHERS, OBSERVATION_IDS.BURNING_SMELL_NEAR_WHEEL],
    [OBSERVATION_IDS.EXCESSIVE_BOUNCING, OBSERVATION_IDS.UNEVEN_TIRE_WEAR_VISIBLE],
  ],
  [ENTRY_ANCHORS.HVAC_SMELLS]: [
    [OBSERVATION_IDS.NO_HEAT, OBSERVATION_IDS.NO_AC],
    [OBSERVATION_IDS.BLOWER_NOT_WORKING, OBSERVATION_IDS.AIRFLOW_WEAK],
    [OBSERVATION_IDS.MUSTY_SMELL_FROM_VENTS, OBSERVATION_IDS.SWEET_SMELL],
    [OBSERVATION_IDS.BURNING_OIL_SMELL, OBSERVATION_IDS.BURNT_ELECTRICAL_SMELL],
    [OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN, OBSERVATION_IDS.ROTTEN_EGG_SMELL],
  ],
};

// Entry anchor display info
const ENTRY_ANCHOR_INFO: Record<EntryAnchor, { title: string; description: string }> = {
  [ENTRY_ANCHORS.WONT_START]: {
    title: "Won't Start",
    description: "Vehicle doesn't start, no crank, slow crank, or clicks but won't turn over",
  },
  [ENTRY_ANCHORS.STARTS_THEN_DIES]: {
    title: "Starts Then Dies",
    description: "Vehicle starts but stalls shortly after, or has trouble staying running",
  },
  [ENTRY_ANCHORS.NOISE]: {
    title: "Unusual Noise",
    description: "Grinding, clicking, humming, rattling, or other unusual sounds",
  },
  [ENTRY_ANCHORS.ELECTRICAL]: {
    title: "Electrical Issues",
    description: "Flickering lights, dead battery symptoms, electrical malfunctions",
  },
  [ENTRY_ANCHORS.BRAKING_HANDLING]: {
    title: "Braking / Handling",
    description: "Brake problems, steering issues, pulling, vibration, or handling concerns",
  },
  [ENTRY_ANCHORS.HVAC_SMELLS]: {
    title: "HVAC / Smells",
    description: "Heating, cooling, ventilation problems, or unusual odors",
  },
};

export function DiagnosticFlow({ vehicleId, onResult }: DiagnosticFlowProps) {
  const [step, setStep] = useState<FlowStep>("entry");
  const [entryAnchor, setEntryAnchor] = useState<EntryAnchor | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState<ObservationResponse[]>([]);

  // Get current questions based on entry anchor and phase
  const currentQuestions = useMemo(() => {
    if (!entryAnchor) return [];
    const sequences = QUESTION_SEQUENCES[entryAnchor];
    if (currentPhase >= sequences.length) return [];
    return sequences[currentPhase];
  }, [entryAnchor, currentPhase]);

  const totalPhases = entryAnchor ? QUESTION_SEQUENCES[entryAnchor].length : 0;

  // Handle starting the flow with selected entry anchor
  const handleSelectEntry = (anchor: EntryAnchor) => {
    setEntryAnchor(anchor);
    setStep("questions");
    setCurrentPhase(0);
    setAnswers({});
    setObservations([]);
  };

  // Handle answering a question
  const handleAnswer = (questionId: ObservationId, value: "YES" | "NO" | "UNSURE") => {
    const def = OBSERVATION_DEFINITIONS[questionId];
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    const newObservation: ObservationResponse = {
      id: questionId,
      value: OBSERVATION_VALUE[value],
      strength: def?.defaultStrength,
    };

    setObservations((prev) => {
      // Replace if exists, otherwise add
      const filtered = prev.filter((o) => o.id !== questionId);
      return [...filtered, newObservation];
    });
  };

  // Navigate to next phase or complete
  const handleNextPhase = () => {
    if (currentPhase + 1 >= totalPhases) {
      // Run diagnosis
      runDiagnosis();
    } else {
      setCurrentPhase(currentPhase + 1);
    }
  };

  // Go back to previous phase
  const handleBack = () => {
    if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1);
    } else {
      // Go back to entry selection
      setStep("entry");
      setEntryAnchor(null);
    }
  };

  // Start over - clears current diagnostic session only
  const handleStartOver = () => {
    setStep("entry");
    setEntryAnchor(null);
    setCurrentPhase(0);
    setAnswers({});
    setObservations([]);
  };

  // Run the diagnostic engine
  const runDiagnosis = () => {
    if (!entryAnchor) return;

    const output = runDiagnosticEngine({
      vehicleId: vehicleId || "unknown",
      entryAnchor,
      observations,
      resultId: generateUUID(),
      timestamp: new Date().toISOString(),
    });

    onResult(output.result, answers);
  };

  // Check if all questions in current phase are answered
  const allCurrentQuestionsAnswered = currentQuestions.every((qId) => answers[qId] !== undefined);

  // No vehicle selected
  if (!vehicleId) {
    return (
      <section className="card" data-testid="diagnostic-flow">
        <h2 style={{ marginTop: 0 }}>Diagnose</h2>
        <p>Please select or create a vehicle profile to start diagnosis.</p>
      </section>
    );
  }

  // Entry anchor selection
  if (step === "entry") {
    return (
      <section className="card" data-testid="diagnostic-flow">
        <h2 style={{ marginTop: 0 }} data-testid="diagnostic-flow-title">
          What's the main issue?
        </h2>
        <p style={{ opacity: 0.8, marginBottom: 16 }}>
          Select the category that best describes your vehicle's problem.
        </p>

        <div style={{ display: "grid", gap: 12 }} data-testid="entry-anchor-options">
          {Object.entries(ENTRY_ANCHOR_INFO).map(([anchor, info]) => (
            <button
              key={anchor}
              className="button"
              onClick={() => handleSelectEntry(anchor as EntryAnchor)}
              style={{
                textAlign: "left",
                padding: "16px",
                display: "block",
              }}
              data-testid={`entry-${anchor}`}
            >
              <strong style={{ fontSize: 16 }}>{info.title}</strong>
              <br />
              <span style={{ opacity: 0.8, fontSize: 14 }}>{info.description}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  // Progressive questions
  if (step === "questions" && entryAnchor) {
    return (
      <section className="card" data-testid="diagnostic-flow">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }} data-testid="diagnostic-flow-title">
              {ENTRY_ANCHOR_INFO[entryAnchor].title}
            </h2>
            <div className="badge" style={{ marginTop: 8 }}>
              Phase {currentPhase + 1} of {totalPhases}
            </div>
          </div>
          <div className="row">
            <button
              className="button"
              onClick={handleBack}
              data-testid="back-button"
              style={{ padding: "8px 16px" }}
            >
              ← Back
            </button>
            <button
              className="button"
              onClick={handleStartOver}
              data-testid="start-over-button"
              style={{ padding: "8px 16px" }}
            >
              Start Over
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }} data-testid="questions-container">
          {currentQuestions.map((questionId) => {
            const def = OBSERVATION_DEFINITIONS[questionId];
            if (!def) return null;

            const currentAnswer = answers[questionId];

            return (
              <div
                key={questionId}
                className="card"
                style={{
                  marginBottom: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: currentAnswer ? "1px solid rgba(100,200,100,0.3)" : undefined,
                }}
                data-testid={`question-${questionId}`}
              >
                <p style={{ margin: "0 0 12px", fontWeight: 500, fontSize: 16 }}>
                  {def.label}?
                </p>

                <div className="row" style={{ gap: 8 }}>
                  <button
                    className="button"
                    onClick={() => handleAnswer(questionId, "YES")}
                    style={{
                      background:
                        currentAnswer === "YES" ? "rgba(100,200,100,0.3)" : undefined,
                      minWidth: 80,
                    }}
                    data-testid={`answer-${questionId}-yes`}
                  >
                    Yes
                  </button>
                  <button
                    className="button"
                    onClick={() => handleAnswer(questionId, "NO")}
                    style={{
                      background:
                        currentAnswer === "NO" ? "rgba(200,100,100,0.3)" : undefined,
                      minWidth: 80,
                    }}
                    data-testid={`answer-${questionId}-no`}
                  >
                    No
                  </button>
                  <button
                    className="button"
                    onClick={() => handleAnswer(questionId, "UNSURE")}
                    style={{
                      background:
                        currentAnswer === "UNSURE" ? "rgba(200,200,100,0.3)" : undefined,
                      minWidth: 80,
                    }}
                    data-testid={`answer-${questionId}-unsure`}
                  >
                    Unsure
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: 4,
            height: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: "rgba(100,200,100,0.6)",
              borderRadius: 4,
              height: 8,
              width: `${((currentPhase + 1) / totalPhases) * 100}%`,
              transition: "width 0.3s",
            }}
          />
        </div>

        <button
          className="button"
          onClick={handleNextPhase}
          disabled={!allCurrentQuestionsAnswered}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: 16,
            opacity: allCurrentQuestionsAnswered ? 1 : 0.5,
          }}
          data-testid="next-phase-button"
        >
          {currentPhase + 1 >= totalPhases ? "Get Diagnosis" : "Continue →"}
        </button>

        <p style={{ marginTop: 12, opacity: 0.7, fontSize: 14, textAlign: "center" }}>
          Answer all questions to continue. If unsure, select "Unsure".
        </p>
      </section>
    );
  }

  return null;
}
