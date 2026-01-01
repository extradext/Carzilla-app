/**
 * /src/ui/DiagnosticFlow.tsx
 * PRESENTATION ONLY
 * 
 * Progressive, contextual question flow with multiple-choice answers.
 * - Questions ask what's happening
 * - Answers are statements the user can identify with
 * - Selected answer determines next question
 * - No Yes/No/Unsure format
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

// Answer option that maps to observations
type AnswerOption = {
  id: string;
  text: string;
  // Observations triggered by this answer (with their values)
  observations: Array<{ id: ObservationId; value: "YES" | "NO" }>;
  // Next question to show (or null to continue to next in sequence)
  nextQuestion?: string;
};

// Question definition
type Question = {
  id: string;
  text: string;
  subtext?: string;
  options: AnswerOption[];
};

// Question sequences by entry anchor
const QUESTION_FLOWS: Record<EntryAnchor, Question[]> = {
  [ENTRY_ANCHORS.WONT_START]: [
    {
      id: "turn_key",
      text: "What happens when you turn the key?",
      subtext: "Or press the start button",
      options: [
        {
          id: "rapid_clicking",
          text: "Rapid clicking sound",
          observations: [
            { id: OBSERVATION_IDS.RAPID_CLICKING_ON_START, value: "YES" },
            { id: OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY, value: "NO" },
          ],
        },
        {
          id: "single_click",
          text: "One loud click, then nothing",
          observations: [
            { id: OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK, value: "YES" },
            { id: OBSERVATION_IDS.RAPID_CLICKING_ON_START, value: "NO" },
          ],
        },
        {
          id: "nothing",
          text: "Completely silent - no sound at all",
          observations: [
            { id: OBSERVATION_IDS.NO_CLICK_NO_CRANK, value: "YES" },
            { id: OBSERVATION_IDS.RAPID_CLICKING_ON_START, value: "NO" },
          ],
        },
        {
          id: "slow_crank",
          text: "It tries to start but sounds weak/slow",
          observations: [
            { id: OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY, value: "YES" },
            { id: OBSERVATION_IDS.NO_CLICK_NO_CRANK, value: "NO" },
          ],
        },
        {
          id: "normal_no_start",
          text: "Sounds normal but won't start",
          observations: [
            { id: OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY, value: "NO" },
            { id: OBSERVATION_IDS.NO_CLICK_NO_CRANK, value: "NO" },
            { id: OBSERVATION_IDS.LONG_CRANK_BEFORE_START, value: "YES" },
          ],
        },
      ],
    },
    {
      id: "jump_start",
      text: "Have you tried jump starting it?",
      options: [
        {
          id: "jump_helped",
          text: "Yes, and it started with a jump",
          observations: [{ id: OBSERVATION_IDS.JUMP_START_HELPS, value: "YES" }],
        },
        {
          id: "jump_no_help",
          text: "Yes, but it still won't start",
          observations: [{ id: OBSERVATION_IDS.JUMP_START_HELPS, value: "NO" }],
        },
        {
          id: "no_jump",
          text: "No, I haven't tried that yet",
          observations: [],
        },
      ],
    },
    {
      id: "dashboard_lights",
      text: "What do the dashboard lights look like?",
      options: [
        {
          id: "lights_dim",
          text: "Lights are dim or flickering",
          observations: [
            { id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "YES" },
            { id: OBSERVATION_IDS.LIGHTS_FLICKER, value: "YES" },
          ],
        },
        {
          id: "lights_reset",
          text: "Lights go out or reset when I try to start",
          observations: [{ id: OBSERVATION_IDS.DASH_RESETS_WHEN_CRANKING, value: "YES" }],
        },
        {
          id: "battery_light",
          text: "Battery warning light is on",
          observations: [{ id: OBSERVATION_IDS.BATTERY_LIGHT_ON, value: "YES" }],
        },
        {
          id: "lights_normal",
          text: "Lights look normal and bright",
          observations: [
            { id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "NO" },
            { id: OBSERVATION_IDS.DASH_RESETS_WHEN_CRANKING, value: "NO" },
          ],
        },
      ],
    },
    {
      id: "battery_condition",
      text: "What does the battery area look like?",
      subtext: "If you can safely check under the hood",
      options: [
        {
          id: "corroded",
          text: "I see white/green buildup on the terminals",
          observations: [{ id: OBSERVATION_IDS.TERMINALS_CORRODED, value: "YES" }],
        },
        {
          id: "clean",
          text: "Terminals look clean",
          observations: [{ id: OBSERVATION_IDS.TERMINALS_CORRODED, value: "NO" }],
        },
        {
          id: "cant_check",
          text: "I can't check right now",
          observations: [],
        },
      ],
    },
    {
      id: "fuel_pump",
      text: "When you turn the key to ON (without starting), do you hear a brief hum from the back?",
      subtext: "This is the fuel pump priming - usually lasts 2-3 seconds",
      options: [
        {
          id: "hear_pump",
          text: "Yes, I hear a humming sound",
          observations: [{ id: OBSERVATION_IDS.FUEL_PUMP_SOUND_NOT_HEARD, value: "NO" }],
        },
        {
          id: "no_pump",
          text: "No, I don't hear anything",
          observations: [{ id: OBSERVATION_IDS.FUEL_PUMP_SOUND_NOT_HEARD, value: "YES" }],
        },
        {
          id: "not_sure_pump",
          text: "I'm not sure what to listen for",
          observations: [],
        },
      ],
    },
  ],

  [ENTRY_ANCHORS.STARTS_THEN_DIES]: [
    {
      id: "when_stalls",
      text: "When does the engine stall?",
      options: [
        {
          id: "immediately",
          text: "Right after starting - within a few seconds",
          observations: [{ id: OBSERVATION_IDS.STARTS_THEN_STALLS, value: "YES" }],
        },
        {
          id: "when_accelerating",
          text: "When I press the gas pedal",
          observations: [{ id: OBSERVATION_IDS.STALLS_ON_ACCELERATION, value: "YES" }],
        },
        {
          id: "at_idle",
          text: "After idling for a minute or two",
          observations: [
            { id: OBSERVATION_IDS.STARTS_THEN_STALLS, value: "YES" },
            { id: OBSERVATION_IDS.ROUGH_IDLE, value: "YES" },
          ],
        },
        {
          id: "uphill",
          text: "When going uphill or under load",
          observations: [{ id: OBSERVATION_IDS.LOSS_OF_POWER_UPHILL, value: "YES" }],
        },
      ],
    },
    {
      id: "engine_behavior",
      text: "How does the engine behave before it stalls?",
      options: [
        {
          id: "rough_shaking",
          text: "It runs rough and shakes",
          observations: [
            { id: OBSERVATION_IDS.ROUGH_IDLE, value: "YES" },
            { id: OBSERVATION_IDS.ENGINE_MISFIRES_AT_IDLE, value: "YES" },
          ],
        },
        {
          id: "sputtering",
          text: "It sputters or hesitates",
          observations: [{ id: OBSERVATION_IDS.ENGINE_MISFIRES_UNDER_LOAD, value: "YES" }],
        },
        {
          id: "smooth_then_dies",
          text: "It runs smoothly then suddenly dies",
          observations: [
            { id: OBSERVATION_IDS.ROUGH_IDLE, value: "NO" },
            { id: OBSERVATION_IDS.STARTS_THEN_STALLS, value: "YES" },
          ],
        },
      ],
    },
    {
      id: "fuel_smell",
      text: "Do you notice any unusual smells?",
      options: [
        {
          id: "gas_smell",
          text: "I smell gasoline",
          observations: [{ id: OBSERVATION_IDS.RAW_FUEL_SMELL_OUTSIDE, value: "YES" }],
        },
        {
          id: "no_smell",
          text: "No unusual smells",
          observations: [{ id: OBSERVATION_IDS.RAW_FUEL_SMELL_OUTSIDE, value: "NO" }],
        },
      ],
    },
    {
      id: "restart_behavior",
      text: "What happens when you try to restart?",
      options: [
        {
          id: "long_crank",
          text: "It takes a long time to crank before starting",
          observations: [{ id: OBSERVATION_IDS.LONG_CRANK_BEFORE_START, value: "YES" }],
        },
        {
          id: "starts_easy",
          text: "It starts right up again",
          observations: [{ id: OBSERVATION_IDS.LONG_CRANK_BEFORE_START, value: "NO" }],
        },
        {
          id: "wont_restart",
          text: "It won't restart at all",
          observations: [{ id: OBSERVATION_IDS.STARTS_THEN_STALLS, value: "YES" }],
        },
      ],
    },
  ],

  [ENTRY_ANCHORS.NOISE]: [
    {
      id: "noise_type",
      text: "What kind of noise are you hearing?",
      options: [
        {
          id: "grinding",
          text: "Grinding or scraping metal sound",
          observations: [{ id: OBSERVATION_IDS.GRINDING_NOISE_WHEN_BRAKING, value: "YES" }],
        },
        {
          id: "clicking_clunking",
          text: "Clicking or clunking",
          observations: [{ id: OBSERVATION_IDS.CLUNK_OVER_BUMPS, value: "YES" }],
        },
        {
          id: "humming_droning",
          text: "Humming or droning that changes with speed",
          observations: [{ id: OBSERVATION_IDS.HUMMING_GROWL_CHANGES_WITH_SPEED, value: "YES" }],
        },
        {
          id: "squealing",
          text: "Squealing or whining",
          observations: [{ id: OBSERVATION_IDS.WHINE_WHEN_TURNING, value: "YES" }],
        },
        {
          id: "rattling",
          text: "Rattling or loose-sounding",
          observations: [{ id: OBSERVATION_IDS.RATTLE_OVER_ROUGH_ROAD, value: "YES" }],
        },
        {
          id: "popping",
          text: "Popping or backfiring",
          observations: [{ id: OBSERVATION_IDS.BACKFIRE_POP_NOISE, value: "YES" }],
        },
      ],
    },
    {
      id: "noise_when",
      text: "When do you hear the noise?",
      options: [
        {
          id: "when_braking",
          text: "When I press the brakes",
          observations: [{ id: OBSERVATION_IDS.GRINDING_NOISE_WHEN_BRAKING, value: "YES" }],
        },
        {
          id: "over_bumps",
          text: "When going over bumps",
          observations: [{ id: OBSERVATION_IDS.CLUNK_OVER_BUMPS, value: "YES" }],
        },
        {
          id: "when_turning",
          text: "When turning the steering wheel",
          observations: [{ id: OBSERVATION_IDS.WHINE_WHEN_TURNING, value: "YES" }],
        },
        {
          id: "at_speed",
          text: "At highway speeds",
          observations: [{ id: OBSERVATION_IDS.VIBRATION_AT_SPEED, value: "YES" }],
        },
        {
          id: "always",
          text: "All the time while driving",
          observations: [{ id: OBSERVATION_IDS.HUMMING_GROWL_CHANGES_WITH_SPEED, value: "YES" }],
        },
      ],
    },
    {
      id: "noise_location",
      text: "Where does the noise seem to come from?",
      options: [
        {
          id: "front",
          text: "Front of the vehicle",
          observations: [],
        },
        {
          id: "rear",
          text: "Rear of the vehicle",
          observations: [],
        },
        {
          id: "one_side",
          text: "One specific wheel/corner",
          observations: [{ id: OBSERVATION_IDS.WHEEL_HOTTER_THAN_OTHERS, value: "YES" }],
        },
        {
          id: "underneath",
          text: "Underneath the car",
          observations: [],
        },
        {
          id: "not_sure_location",
          text: "Hard to tell",
          observations: [],
        },
      ],
    },
  ],

  [ENTRY_ANCHORS.ELECTRICAL]: [
    {
      id: "electrical_symptom",
      text: "What electrical issues are you experiencing?",
      options: [
        {
          id: "lights_flickering",
          text: "Lights flickering or dimming",
          observations: [
            { id: OBSERVATION_IDS.LIGHTS_FLICKER, value: "YES" },
            { id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "YES" },
          ],
        },
        {
          id: "dead_battery",
          text: "Battery keeps dying",
          observations: [{ id: OBSERVATION_IDS.JUMP_START_HELPS, value: "YES" }],
        },
        {
          id: "radio_resets",
          text: "Radio/clock keeps resetting",
          observations: [{ id: OBSERVATION_IDS.RADIO_RESETS, value: "YES" }],
        },
        {
          id: "intermittent_power",
          text: "Random loss of electrical power",
          observations: [{ id: OBSERVATION_IDS.INTERMITTENT_NO_POWER, value: "YES" }],
        },
        {
          id: "warning_lights",
          text: "Warning lights on dashboard",
          observations: [{ id: OBSERVATION_IDS.BATTERY_LIGHT_ON, value: "YES" }],
        },
      ],
    },
    {
      id: "when_electrical",
      text: "When do the electrical issues happen?",
      options: [
        {
          id: "when_starting",
          text: "When trying to start the car",
          observations: [{ id: OBSERVATION_IDS.DASH_RESETS_WHEN_CRANKING, value: "YES" }],
        },
        {
          id: "while_running",
          text: "While the engine is running",
          observations: [{ id: OBSERVATION_IDS.LIGHTS_FLICKER, value: "YES" }],
        },
        {
          id: "after_sitting",
          text: "After the car sits overnight",
          observations: [{ id: OBSERVATION_IDS.JUMP_START_HELPS, value: "YES" }],
        },
        {
          id: "random_times",
          text: "Randomly, no pattern",
          observations: [{ id: OBSERVATION_IDS.INTERMITTENT_NO_POWER, value: "YES" }],
        },
      ],
    },
    {
      id: "battery_age",
      text: "How old is your battery?",
      options: [
        {
          id: "new_battery",
          text: "Less than 2 years old",
          observations: [],
        },
        {
          id: "old_battery",
          text: "3+ years old or unknown",
          observations: [{ id: OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY, value: "YES" }],
        },
        {
          id: "recently_replaced",
          text: "Just replaced it recently",
          observations: [{ id: OBSERVATION_IDS.TERMINALS_CORRODED, value: "YES" }],
        },
      ],
    },
  ],

  [ENTRY_ANCHORS.BRAKING_HANDLING]: [
    {
      id: "brake_feel",
      text: "How do the brakes feel?",
      options: [
        {
          id: "soft_spongy",
          text: "Soft or spongy - pedal goes too far down",
          observations: [{ id: OBSERVATION_IDS.BRAKE_PEDAL_SOFT, value: "YES" }],
        },
        {
          id: "pulsating",
          text: "Pulsating or vibrating when I brake",
          observations: [{ id: OBSERVATION_IDS.BRAKE_PEDAL_PULSATION, value: "YES" }],
        },
        {
          id: "pulling",
          text: "Car pulls to one side when braking",
          observations: [{ id: OBSERVATION_IDS.PULLS_WHEN_BRAKING, value: "YES" }],
        },
        {
          id: "brakes_fine",
          text: "Brakes feel normal",
          observations: [
            { id: OBSERVATION_IDS.BRAKE_PEDAL_SOFT, value: "NO" },
            { id: OBSERVATION_IDS.BRAKE_PEDAL_PULSATION, value: "NO" },
          ],
        },
      ],
    },
    {
      id: "steering_feel",
      text: "How does the steering feel?",
      options: [
        {
          id: "heavy_steering",
          text: "Heavy or hard to turn",
          observations: [{ id: OBSERVATION_IDS.STEERING_FEELS_HEAVY, value: "YES" }],
        },
        {
          id: "wandering",
          text: "Wanders - hard to keep straight",
          observations: [{ id: OBSERVATION_IDS.STEERING_WANDERS, value: "YES" }],
        },
        {
          id: "pulls_driving",
          text: "Pulls to one side while driving",
          observations: [{ id: OBSERVATION_IDS.PULLS_TO_ONE_SIDE, value: "YES" }],
        },
        {
          id: "vibrating_wheel",
          text: "Steering wheel shakes or vibrates",
          observations: [{ id: OBSERVATION_IDS.STEERING_WHEEL_SHAKE, value: "YES" }],
        },
        {
          id: "steering_fine",
          text: "Steering feels normal",
          observations: [
            { id: OBSERVATION_IDS.STEERING_FEELS_HEAVY, value: "NO" },
            { id: OBSERVATION_IDS.STEERING_WANDERS, value: "NO" },
          ],
        },
      ],
    },
    {
      id: "vibration",
      text: "Do you notice any vibration?",
      options: [
        {
          id: "vibration_speed",
          text: "Yes, especially at highway speeds",
          observations: [{ id: OBSERVATION_IDS.VIBRATION_AT_SPEED, value: "YES" }],
        },
        {
          id: "vibration_braking",
          text: "Yes, when braking",
          observations: [{ id: OBSERVATION_IDS.BRAKE_PEDAL_PULSATION, value: "YES" }],
        },
        {
          id: "no_vibration",
          text: "No vibration",
          observations: [{ id: OBSERVATION_IDS.VIBRATION_AT_SPEED, value: "NO" }],
        },
      ],
    },
    {
      id: "tire_condition",
      text: "Have you checked your tires recently?",
      options: [
        {
          id: "uneven_wear",
          text: "I noticed uneven wear",
          observations: [{ id: OBSERVATION_IDS.UNEVEN_TIRE_WEAR_VISIBLE, value: "YES" }],
        },
        {
          id: "pressure_light",
          text: "Tire pressure light is on",
          observations: [{ id: OBSERVATION_IDS.TIRE_PRESSURE_LIGHT_ON, value: "YES" }],
        },
        {
          id: "tires_ok",
          text: "Tires look fine",
          observations: [{ id: OBSERVATION_IDS.UNEVEN_TIRE_WEAR_VISIBLE, value: "NO" }],
        },
      ],
    },
  ],

  [ENTRY_ANCHORS.HVAC_SMELLS]: [
    {
      id: "hvac_issue",
      text: "What's the main issue?",
      options: [
        {
          id: "no_heat",
          text: "No heat from the vents",
          observations: [{ id: OBSERVATION_IDS.NO_HEAT, value: "YES" }],
        },
        {
          id: "no_ac",
          text: "No cold air / AC not working",
          observations: [{ id: OBSERVATION_IDS.NO_AC, value: "YES" }],
        },
        {
          id: "weak_airflow",
          text: "Weak airflow even on high",
          observations: [{ id: OBSERVATION_IDS.AIRFLOW_WEAK, value: "YES" }],
        },
        {
          id: "blower_dead",
          text: "Blower fan doesn't work at all",
          observations: [{ id: OBSERVATION_IDS.BLOWER_NOT_WORKING, value: "YES" }],
        },
        {
          id: "bad_smell",
          text: "Bad smell from vents",
          observations: [{ id: OBSERVATION_IDS.MUSTY_SMELL_FROM_VENTS, value: "YES" }],
        },
      ],
    },
    {
      id: "smell_type",
      text: "What kind of smell do you notice?",
      options: [
        {
          id: "musty_mold",
          text: "Musty or moldy smell",
          observations: [{ id: OBSERVATION_IDS.MUSTY_SMELL_FROM_VENTS, value: "YES" }],
        },
        {
          id: "sweet_smell",
          text: "Sweet, syrup-like smell",
          observations: [{ id: OBSERVATION_IDS.SWEET_SMELL, value: "YES" }],
        },
        {
          id: "burning_oil",
          text: "Burning oil smell",
          observations: [{ id: OBSERVATION_IDS.BURNING_OIL_SMELL, value: "YES" }],
        },
        {
          id: "exhaust_inside",
          text: "Exhaust fumes inside the car",
          observations: [{ id: OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN, value: "YES" }],
        },
        {
          id: "rotten_egg",
          text: "Rotten egg / sulfur smell",
          observations: [{ id: OBSERVATION_IDS.ROTTEN_EGG_SMELL, value: "YES" }],
        },
        {
          id: "electrical_burning",
          text: "Burning electrical/plastic smell",
          observations: [{ id: OBSERVATION_IDS.BURNT_ELECTRICAL_SMELL, value: "YES" }],
        },
        {
          id: "no_smell",
          text: "No unusual smell",
          observations: [],
        },
      ],
    },
    {
      id: "smell_when",
      text: "When do you notice the smell?",
      options: [
        {
          id: "ac_on",
          text: "When the AC is on",
          observations: [{ id: OBSERVATION_IDS.MUSTY_SMELL_FROM_VENTS, value: "YES" }],
        },
        {
          id: "heat_on",
          text: "When the heat is on",
          observations: [{ id: OBSERVATION_IDS.SWEET_SMELL, value: "YES" }],
        },
        {
          id: "always_smell",
          text: "All the time",
          observations: [],
        },
        {
          id: "after_driving",
          text: "After driving for a while",
          observations: [{ id: OBSERVATION_IDS.BURNING_OIL_SMELL, value: "YES" }],
        },
      ],
    },
  ],
};

// Entry anchor display info
const ENTRY_ANCHOR_INFO: Record<EntryAnchor, { title: string; description: string; icon: string }> = {
  [ENTRY_ANCHORS.WONT_START]: {
    title: "Won't Start",
    description: "Car doesn't start when I turn the key",
    icon: "🔑",
  },
  [ENTRY_ANCHORS.STARTS_THEN_DIES]: {
    title: "Starts Then Dies",
    description: "Engine starts but stalls or won't stay running",
    icon: "💨",
  },
  [ENTRY_ANCHORS.NOISE]: {
    title: "Strange Noise",
    description: "I'm hearing an unusual sound",
    icon: "🔊",
  },
  [ENTRY_ANCHORS.ELECTRICAL]: {
    title: "Electrical Problem",
    description: "Lights, battery, or electrical issues",
    icon: "⚡",
  },
  [ENTRY_ANCHORS.BRAKING_HANDLING]: {
    title: "Braking or Handling",
    description: "Issues with brakes, steering, or how the car drives",
    icon: "🛞",
  },
  [ENTRY_ANCHORS.HVAC_SMELLS]: {
    title: "Climate or Smells",
    description: "Heat, AC, ventilation, or unusual odors",
    icon: "🌡️",
  },
};

export function DiagnosticFlow({ vehicleId, onResult }: DiagnosticFlowProps) {
  const [step, setStep] = useState<FlowStep>("entry");
  const [entryAnchor, setEntryAnchor] = useState<EntryAnchor | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState<ObservationResponse[]>([]);

  // Get current question
  const questions = entryAnchor ? QUESTION_FLOWS[entryAnchor] : [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Handle entry anchor selection
  const handleSelectEntry = (anchor: EntryAnchor) => {
    setEntryAnchor(anchor);
    setStep("questions");
    setCurrentQuestionIndex(0);
    setAnswers({});
    setObservations([]);
  };

  // Handle answer selection
  const handleSelectAnswer = (option: AnswerOption) => {
    // Record the answer
    const newAnswers = { ...answers, [currentQuestion.id]: option.id };
    setAnswers(newAnswers);

    // Add observations from this answer
    const newObservations = [...observations];
    for (const obs of option.observations) {
      const def = OBSERVATION_DEFINITIONS[obs.id];
      const existing = newObservations.findIndex((o) => o.id === obs.id);
      const newObs: ObservationResponse = {
        id: obs.id,
        value: OBSERVATION_VALUE[obs.value],
        strength: def?.defaultStrength,
      };
      if (existing >= 0) {
        newObservations[existing] = newObs;
      } else {
        newObservations.push(newObs);
      }
    }
    setObservations(newObservations);

    // Move to next question or finish
    if (currentQuestionIndex + 1 >= totalQuestions) {
      // Run diagnosis
      runDiagnosis(newObservations, newAnswers);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Go back to previous question
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      // Go back to entry selection
      setStep("entry");
      setEntryAnchor(null);
    }
  };

  // Start over
  const handleStartOver = () => {
    setStep("entry");
    setEntryAnchor(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setObservations([]);
  };

  // Run the diagnostic engine
  const runDiagnosis = (obs: ObservationResponse[], ans: Record<string, string>) => {
    if (!entryAnchor) return;

    const output = runDiagnosticEngine({
      vehicleId: vehicleId || "unknown",
      entryAnchor,
      observations: obs,
      resultId: generateUUID(),
      timestamp: new Date().toISOString(),
    });

    onResult(output.result, ans);
  };

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
          What's going on with your car?
        </h2>
        <p style={{ opacity: 0.8, marginBottom: 20 }}>
          Select the issue that best describes your situation
        </p>

        <div style={{ display: "grid", gap: 12 }} data-testid="entry-anchor-options">
          {Object.entries(ENTRY_ANCHOR_INFO).map(([anchor, info]) => (
            <button
              key={anchor}
              className="button"
              onClick={() => handleSelectEntry(anchor as EntryAnchor)}
              style={{
                textAlign: "left",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
              data-testid={`entry-${anchor}`}
            >
              <span style={{ fontSize: 28 }}>{info.icon}</span>
              <div>
                <strong style={{ fontSize: 16 }}>{info.title}</strong>
                <br />
                <span style={{ opacity: 0.7, fontSize: 14 }}>{info.description}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  // Progressive questions
  if (step === "questions" && entryAnchor && currentQuestion) {
    return (
      <section className="card" data-testid="diagnostic-flow">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <div className="badge" style={{ marginBottom: 8 }}>
              {ENTRY_ANCHOR_INFO[entryAnchor].icon} {ENTRY_ANCHOR_INFO[entryAnchor].title}
            </div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              Question {currentQuestionIndex + 1} of {totalQuestions}
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

        {/* Progress bar */}
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: 4,
            height: 4,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background: "rgba(100,200,100,0.6)",
              borderRadius: 4,
              height: 4,
              width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
              transition: "width 0.3s",
            }}
          />
        </div>

        <h2 style={{ margin: "0 0 8px", fontSize: 22 }} data-testid="question-text">
          {currentQuestion.text}
        </h2>
        {currentQuestion.subtext && (
          <p style={{ margin: "0 0 20px", opacity: 0.7, fontSize: 14 }}>
            {currentQuestion.subtext}
          </p>
        )}

        <div style={{ display: "grid", gap: 10 }} data-testid="answer-options">
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              className="button"
              onClick={() => handleSelectAnswer(option)}
              style={{
                textAlign: "left",
                padding: "14px 18px",
                fontSize: 15,
                lineHeight: 1.4,
              }}
              data-testid={`answer-${option.id}`}
            >
              {option.text}
            </button>
          ))}
        </div>
      </section>
    );
  }

  return null;
}
