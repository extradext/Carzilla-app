/**
 * /src/ui/DiagnosticFlow.tsx
 * PRESENTATION ONLY
 * 
 * DYNAMIC question flow - questions change based on previous answers.
 * - Each answer can lead to different follow-up questions
 * - Flow ends when confidence is sufficient or no more useful questions
 * - Branching logic determines next question dynamically
 */

import React, { useState } from "react";
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
  excludedHypotheses?: string[];
  onClearExclusions?: () => void;
};

type FlowStep = "entry" | "questions";

// Answer option that maps to observations and determines next question
type AnswerOption = {
  id: string;
  text: string;
  observations: Array<{ id: ObservationId; value: "YES" | "NO" }>;
  // Next question ID - if null, system determines dynamically or ends flow
  next?: string | null;
  // If true, this answer provides enough info to potentially end the flow
  canResolve?: boolean;
};

type Question = {
  id: string;
  text: string;
  subtext?: string;
  options: AnswerOption[];
};

// All available questions - system picks dynamically based on context
const ALL_QUESTIONS: Record<string, Question> = {
  // ===== WON'T START QUESTIONS =====
  turn_key: {
    id: "turn_key",
    text: "What happens when you turn the key?",
    subtext: "Or press the start button",
    options: [
      {
        id: "rapid_clicking",
        text: "Rapid clicking sound",
        observations: [
          { id: OBSERVATION_IDS.RAPID_CLICKING_ON_START, value: "YES" },
        ],
        next: "lights_during_click", // Check lights to confirm battery
      },
      {
        id: "single_click",
        text: "One loud click, then nothing",
        observations: [
          { id: OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK, value: "YES" },
        ],
        next: "lights_during_click", // Could be battery OR starter - need to differentiate
      },
      {
        id: "nothing",
        text: "Completely silent - no sound at all",
        observations: [
          { id: OBSERVATION_IDS.NO_CLICK_NO_CRANK, value: "YES" },
        ],
        next: "dashboard_power", // Check if there's any power
      },
      {
        id: "slow_crank",
        text: "Engine turns over slowly, sounds weak",
        observations: [
          { id: OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY, value: "YES" },
        ],
        next: "lights_during_click", // Battery-related path
      },
      {
        id: "normal_crank",
        text: "Cranks normally but won't fire up",
        observations: [
          { id: OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY, value: "NO" },
          { id: OBSERVATION_IDS.LONG_CRANK_BEFORE_START, value: "YES" },
        ],
        next: "fuel_check", // Fuel system path
      },
    ],
  },

  // NEW: Key differentiating question - do lights work normally?
  lights_during_click: {
    id: "lights_during_click",
    text: "When you turn the key to ON (before trying to start), are all the dashboard lights bright?",
    subtext: "Check the dashboard warning lights and headlights",
    options: [
      {
        id: "lights_bright",
        text: "Yes - all lights come on bright and normal",
        observations: [
          { id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "NO" },
        ],
        next: "lights_when_cranking", // Lights OK, check what happens during crank
      },
      {
        id: "lights_dim_weak",
        text: "No - lights are dim or weak",
        observations: [
          { id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "YES" },
        ],
        next: "jump_start", // Dim lights = likely battery
      },
      {
        id: "no_lights_at_all",
        text: "No lights come on at all",
        observations: [
          { id: OBSERVATION_IDS.INTERMITTENT_NO_POWER, value: "YES" },
        ],
        next: "battery_terminals", // Total power loss
      },
    ],
  },

  // What happens to lights DURING the crank attempt?
  lights_when_cranking: {
    id: "lights_when_cranking",
    text: "What happens to the dashboard/headlights when you try to start?",
    subtext: "Watch the lights as you turn the key to START",
    options: [
      {
        id: "lights_dim_during",
        text: "They dim significantly or flicker",
        observations: [
          { id: OBSERVATION_IDS.LIGHTS_FLICKER, value: "YES" },
        ],
        next: "jump_start", // Battery can't handle load
      },
      {
        id: "lights_go_out",
        text: "They go completely out momentarily",
        observations: [
          { id: OBSERVATION_IDS.DASH_RESETS_WHEN_CRANKING, value: "YES" },
        ],
        next: "battery_terminals", // Bad connection or dead cell
      },
      {
        id: "lights_stay_bright",
        text: "They stay bright - barely change at all",
        observations: [
          { id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "NO" },
        ],
        next: "starter_tap_test", // Battery is fine, likely starter
      },
    ],
  },

  jump_start: {
    id: "jump_start",
    text: "Have you tried jump starting it?",
    options: [
      {
        id: "jump_worked",
        text: "Yes - it started with a jump",
        observations: [{ id: OBSERVATION_IDS.JUMP_START_HELPS, value: "YES" }],
        next: "battery_age", // Confirm battery issue
      },
      {
        id: "jump_failed",
        text: "Yes - still won't start even with a jump",
        observations: [{ id: OBSERVATION_IDS.JUMP_START_HELPS, value: "NO" }],
        next: "starter_tap_test", // Not battery, check starter
      },
      {
        id: "no_jump",
        text: "Haven't tried yet",
        observations: [],
        next: "headlights_test", // Do another test to narrow down
      },
    ],
  },

  // Direct headlight test
  headlights_test: {
    id: "headlights_test",
    text: "Turn on the headlights. How bright are they?",
    options: [
      {
        id: "headlights_bright",
        text: "Bright and strong",
        observations: [
          { id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "NO" },
        ],
        next: "starter_tap_test", // Battery seems OK, check starter
      },
      {
        id: "headlights_dim",
        text: "Dim or weak",
        observations: [
          { id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "YES" },
        ],
        next: "battery_terminals", // Battery or connection issue
      },
      {
        id: "headlights_off",
        text: "Won't turn on at all",
        observations: [
          { id: OBSERVATION_IDS.INTERMITTENT_NO_POWER, value: "YES" },
        ],
        next: "battery_terminals", // Dead battery or bad connection
      },
    ],
  },

  dashboard_power: {
    id: "dashboard_power",
    text: "Do any dashboard lights come on when you turn the key to ON?",
    options: [
      {
        id: "no_lights",
        text: "No - dashboard is completely dead",
        observations: [
          { id: OBSERVATION_IDS.INTERMITTENT_NO_POWER, value: "YES" },
        ],
        next: "battery_terminals",
      },
      {
        id: "lights_work",
        text: "Yes - lights come on normally",
        observations: [],
        next: "security_light",
      },
      {
        id: "lights_dim",
        text: "Lights come on but very dim",
        observations: [
          { id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "YES" },
        ],
        next: "battery_terminals",
      },
    ],
  },

  dashboard_lights: {
    id: "dashboard_lights",
    text: "What do the dashboard lights look like when you try to start?",
    options: [
      {
        id: "lights_dim_crank",
        text: "They dim or flicker when cranking",
        observations: [
          { id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "YES" },
          { id: OBSERVATION_IDS.LIGHTS_FLICKER, value: "YES" },
        ],
        next: "battery_age",
      },
      {
        id: "lights_go_out",
        text: "They go completely out when I turn the key",
        observations: [
          { id: OBSERVATION_IDS.DASH_RESETS_WHEN_CRANKING, value: "YES" },
        ],
        next: "battery_terminals",
      },
      {
        id: "battery_warning",
        text: "Battery warning light was already on before this",
        observations: [
          { id: OBSERVATION_IDS.BATTERY_LIGHT_ON, value: "YES" },
        ],
        next: "alternator_check",
      },
      {
        id: "lights_normal",
        text: "Lights stay bright, look normal",
        observations: [
          { id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "NO" },
        ],
        next: "starter_tap_test", // Battery OK, check starter
      },
    ],
  },

  battery_terminals: {
    id: "battery_terminals",
    text: "Can you check the battery terminals under the hood?",
    subtext: "Look for white/green crusty buildup on the connections",
    options: [
      {
        id: "corroded",
        text: "Yes - I see corrosion buildup",
        observations: [{ id: OBSERVATION_IDS.TERMINALS_CORRODED, value: "YES" }],
        next: "battery_age",
      },
      {
        id: "loose",
        text: "Terminals look loose or disconnected",
        observations: [{ id: OBSERVATION_IDS.TERMINALS_CORRODED, value: "YES" }],
        next: null,
        canResolve: true, // Clear answer: fix the connection
      },
      {
        id: "clean",
        text: "Terminals look clean and tight",
        observations: [{ id: OBSERVATION_IDS.TERMINALS_CORRODED, value: "NO" }],
        next: "battery_age",
      },
      {
        id: "cant_check",
        text: "I can't check right now",
        observations: [],
        next: "battery_age",
      },
    ],
  },

  battery_age: {
    id: "battery_age",
    text: "How old is your car battery?",
    options: [
      {
        id: "old",
        text: "3+ years old, or I don't know",
        observations: [],
        next: "confirm_battery_symptoms",
      },
      {
        id: "medium",
        text: "1-3 years old",
        observations: [],
        next: "confirm_battery_symptoms",
      },
      {
        id: "new",
        text: "Less than 1 year old",
        observations: [],
        next: "alternator_check", // New battery shouldn't die, check charging
      },
      {
        id: "just_replaced",
        text: "Just replaced it recently",
        observations: [],
        next: "battery_terminals", // New battery but issues = bad install
      },
    ],
  },

  // Final confirmation for battery diagnosis
  confirm_battery_symptoms: {
    id: "confirm_battery_symptoms",
    text: "One more check: Before this problem started, did you notice any of these?",
    options: [
      {
        id: "slow_start_before",
        text: "Car was starting slower than usual lately",
        observations: [{ id: OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY, value: "YES" }],
        next: null,
        canResolve: true, // Classic dying battery
      },
      {
        id: "sits_unused",
        text: "Car sat unused for a week or more",
        observations: [],
        next: null,
        canResolve: true, // Discharged battery
      },
      {
        id: "lights_left_on",
        text: "Interior lights or accessories were left on",
        observations: [],
        next: null,
        canResolve: true, // Drained battery
      },
      {
        id: "nothing_unusual",
        text: "No - everything seemed normal until now",
        observations: [],
        next: "alternator_check", // May not be battery after all
      },
    ],
  },

  alternator_check: {
    id: "alternator_check",
    text: "Before this happened, did you notice anything unusual while driving?",
    options: [
      {
        id: "battery_light_driving",
        text: "Battery light came on while driving",
        observations: [{ id: OBSERVATION_IDS.BATTERY_LIGHT_ON, value: "YES" }],
        next: null,
        canResolve: true, // Alternator not charging
      },
      {
        id: "lights_dimming",
        text: "Headlights were dimming at idle or while driving",
        observations: [{ id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "YES" }],
        next: null,
        canResolve: true, // Alternator issue
      },
      {
        id: "electrical_issues",
        text: "Radio or electronics were acting weird",
        observations: [{ id: OBSERVATION_IDS.RADIO_RESETS, value: "YES" }],
        next: null,
        canResolve: true, // Charging/electrical issue
      },
      {
        id: "nothing_unusual",
        text: "No, everything seemed fine",
        observations: [],
        next: "starter_tap_test", // Check starter if electrical seems OK
      },
    ],
  },

  starter_symptoms: {
    id: "starter_symptoms",
    text: "When you turn the key, what exactly do you hear?",
    options: [
      {
        id: "loud_click",
        text: "A loud CLUNK or CLICK from the engine area",
        observations: [{ id: OBSERVATION_IDS.SINGLE_CLICK_NO_CRANK, value: "YES" }],
        next: "lights_during_click", // Need to check if battery or starter
      },
      {
        id: "grinding",
        text: "A grinding or whirring noise",
        observations: [],
        next: null,
        canResolve: true, // Starter gear issue - clear diagnosis
      },
      {
        id: "nothing_starter",
        text: "Absolutely nothing",
        observations: [{ id: OBSERVATION_IDS.NO_CLICK_NO_CRANK, value: "YES" }],
        next: "dashboard_power",
      },
    ],
  },

  starter_tap_test: {
    id: "starter_tap_test",
    text: "Here's a classic test: Can you have someone tap the starter motor with a wrench while you turn the key?",
    subtext: "The starter is usually on the lower side of the engine - a firm tap, not a hard hit",
    options: [
      {
        id: "tap_worked",
        text: "Yes! It started after tapping",
        observations: [],
        next: null,
        canResolve: true, // Definitive: bad starter motor
      },
      {
        id: "tap_no_change",
        text: "Tried it - no change",
        observations: [],
        next: "starter_history",
      },
      {
        id: "cant_tap",
        text: "I can't do that test right now",
        observations: [],
        next: "starter_history",
      },
    ],
  },

  // Additional starter questions
  starter_history: {
    id: "starter_history",
    text: "Has starting been inconsistent lately?",
    subtext: "Sometimes works, sometimes doesn't",
    options: [
      {
        id: "intermittent",
        text: "Yes - sometimes it starts fine, sometimes it doesn't",
        observations: [],
        next: null,
        canResolve: true, // Intermittent = likely starter
      },
      {
        id: "first_failure",
        text: "No - this is the first time it won't start",
        observations: [],
        next: "security_light",
      },
      {
        id: "getting_worse",
        text: "It's been getting harder to start over time",
        observations: [{ id: OBSERVATION_IDS.ENGINE_CRANKS_SLOWLY, value: "YES" }],
        next: "confirm_battery_symptoms",
      },
    ],
  },

  security_light: {
    id: "security_light",
    text: "Is there a security/key/immobilizer light flashing on the dashboard?",
    subtext: "Look for a key symbol, lock symbol, or car with a key inside it",
    options: [
      {
        id: "security_on",
        text: "Yes - there's a key or lock symbol flashing",
        observations: [],
        next: null,
        canResolve: true, // Security system issue
      },
      {
        id: "security_solid",
        text: "There's a key symbol but it's solid, not flashing",
        observations: [],
        next: "fuel_check",
      },
      {
        id: "security_off",
        text: "No security lights",
        observations: [],
        next: "fuel_check",
      },
    ],
  },

  fuel_check: {
    id: "fuel_check",
    text: "Let's check the fuel system. When you turn the key to ON (don't start), do you hear a brief hum from the back?",
    subtext: "This is the fuel pump - listen for 2-3 seconds of humming",
    options: [
      {
        id: "no_pump_sound",
        text: "No - I don't hear any humming",
        observations: [{ id: OBSERVATION_IDS.FUEL_PUMP_SOUND_NOT_HEARD, value: "YES" }],
        next: "fuel_gauge",
        canResolve: true,
      },
      {
        id: "hear_pump",
        text: "Yes - I hear the pump prime",
        observations: [{ id: OBSERVATION_IDS.FUEL_PUMP_SOUND_NOT_HEARD, value: "NO" }],
        next: "fuel_gauge",
      },
      {
        id: "not_sure_sound",
        text: "I'm not sure what to listen for",
        observations: [],
        next: "fuel_gauge",
      },
    ],
  },

  fuel_gauge: {
    id: "fuel_gauge",
    text: "How much fuel do you have?",
    options: [
      {
        id: "empty",
        text: "Gauge shows empty or very low",
        observations: [],
        next: null,
        canResolve: true,
      },
      {
        id: "has_fuel",
        text: "I have fuel - at least a quarter tank",
        observations: [],
        next: "smell_fuel",
      },
    ],
  },

  smell_fuel: {
    id: "smell_fuel",
    text: "After trying to start several times, do you smell gasoline?",
    options: [
      {
        id: "strong_gas_smell",
        text: "Yes - strong gas smell",
        observations: [{ id: OBSERVATION_IDS.RAW_FUEL_SMELL_OUTSIDE, value: "YES" }],
        next: null, // Flooded or injector issue
        canResolve: true,
      },
      {
        id: "no_smell",
        text: "No gas smell",
        observations: [],
        next: null,
      },
    ],
  },

  // ===== STARTS THEN DIES QUESTIONS =====
  when_stalls: {
    id: "when_stalls",
    text: "When exactly does the engine die?",
    options: [
      {
        id: "immediate",
        text: "Within seconds of starting",
        observations: [{ id: OBSERVATION_IDS.STARTS_THEN_STALLS, value: "YES" }],
        next: "foot_on_gas",
      },
      {
        id: "after_warmup",
        text: "After warming up for a few minutes",
        observations: [{ id: OBSERVATION_IDS.STARTS_THEN_STALLS, value: "YES" }],
        next: "engine_temp",
      },
      {
        id: "when_driving",
        text: "While I'm driving",
        observations: [{ id: OBSERVATION_IDS.STALLS_ON_ACCELERATION, value: "YES" }],
        next: "stall_conditions",
      },
      {
        id: "at_stops",
        text: "When I come to a stop",
        observations: [{ id: OBSERVATION_IDS.ROUGH_IDLE, value: "YES" }],
        next: "idle_quality",
      },
    ],
  },

  foot_on_gas: {
    id: "foot_on_gas",
    text: "Can you keep it running by pressing the gas pedal?",
    options: [
      {
        id: "gas_helps",
        text: "Yes - stays running if I give it gas",
        observations: [{ id: OBSERVATION_IDS.ROUGH_IDLE, value: "YES" }],
        next: "idle_quality",
      },
      {
        id: "gas_no_help",
        text: "No - dies even with gas pedal pressed",
        observations: [],
        next: "security_light",
      },
    ],
  },

  idle_quality: {
    id: "idle_quality",
    text: "How does the engine sound when idling?",
    options: [
      {
        id: "rough_shaking",
        text: "Rough, shaking, uneven",
        observations: [
          { id: OBSERVATION_IDS.ROUGH_IDLE, value: "YES" },
          { id: OBSERVATION_IDS.ENGINE_MISFIRES_AT_IDLE, value: "YES" },
        ],
        next: "check_engine_light",
      },
      {
        id: "smooth_then_dies",
        text: "Sounds smooth but then just cuts out",
        observations: [{ id: OBSERVATION_IDS.ROUGH_IDLE, value: "NO" }],
        next: "fuel_check",
      },
    ],
  },

  check_engine_light: {
    id: "check_engine_light",
    text: "Is the check engine light on?",
    options: [
      {
        id: "cel_on",
        text: "Yes - check engine light is on",
        observations: [],
        next: null,
        canResolve: true,
      },
      {
        id: "cel_flashing",
        text: "Yes - and it's FLASHING",
        observations: [{ id: OBSERVATION_IDS.ENGINE_MISFIRES_AT_IDLE, value: "YES" }],
        next: null,
        canResolve: true,
      },
      {
        id: "cel_off",
        text: "No check engine light",
        observations: [],
        next: "vacuum_leak_symptoms",
      },
    ],
  },

  vacuum_leak_symptoms: {
    id: "vacuum_leak_symptoms",
    text: "Do you hear any hissing sounds from the engine bay?",
    options: [
      {
        id: "hissing",
        text: "Yes - I hear a hissing or whistling",
        observations: [],
        next: null,
        canResolve: true,
      },
      {
        id: "no_hissing",
        text: "No unusual sounds",
        observations: [],
        next: null,
      },
    ],
  },

  engine_temp: {
    id: "engine_temp",
    text: "What does the temperature gauge show?",
    options: [
      {
        id: "overheating",
        text: "Running hot / in the red zone",
        observations: [{ id: OBSERVATION_IDS.TEMP_GAUGE_HIGH, value: "YES" }],
        next: null,
        canResolve: true,
      },
      {
        id: "normal_temp",
        text: "Temperature looks normal",
        observations: [],
        next: "idle_quality",
      },
      {
        id: "stays_cold",
        text: "Never warms up / stays cold",
        observations: [],
        next: null,
        canResolve: true,
      },
    ],
  },

  stall_conditions: {
    id: "stall_conditions",
    text: "What are you doing when it stalls while driving?",
    options: [
      {
        id: "accelerating",
        text: "Pressing the gas / accelerating",
        observations: [{ id: OBSERVATION_IDS.STALLS_ON_ACCELERATION, value: "YES" }],
        next: "loss_of_power",
      },
      {
        id: "uphill",
        text: "Going uphill",
        observations: [{ id: OBSERVATION_IDS.LOSS_OF_POWER_UPHILL, value: "YES" }],
        next: "loss_of_power",
      },
      {
        id: "random_driving",
        text: "Randomly - no pattern",
        observations: [],
        next: "fuel_check",
      },
    ],
  },

  loss_of_power: {
    id: "loss_of_power",
    text: "Before it stalls, do you notice a loss of power?",
    options: [
      {
        id: "power_loss",
        text: "Yes - car feels sluggish, won't accelerate well",
        observations: [{ id: OBSERVATION_IDS.LOSS_OF_POWER_UPHILL, value: "YES" }],
        next: "check_engine_light",
      },
      {
        id: "sudden_shutoff",
        text: "No - it just suddenly dies",
        observations: [],
        next: "fuel_check",
      },
    ],
  },

  // ===== NOISE QUESTIONS =====
  noise_when: {
    id: "noise_when",
    text: "When do you hear the noise?",
    options: [
      {
        id: "when_braking",
        text: "When I press the brakes",
        observations: [{ id: OBSERVATION_IDS.GRINDING_NOISE_WHEN_BRAKING, value: "YES" }],
        next: "brake_noise_type",
      },
      {
        id: "over_bumps",
        text: "Going over bumps or rough roads",
        observations: [{ id: OBSERVATION_IDS.CLUNK_OVER_BUMPS, value: "YES" }],
        next: "suspension_noise_type",
      },
      {
        id: "when_turning",
        text: "When turning the steering wheel",
        observations: [{ id: OBSERVATION_IDS.WHINE_WHEN_TURNING, value: "YES" }],
        next: "steering_noise_type",
      },
      {
        id: "constant_driving",
        text: "Constantly while driving - changes with speed",
        observations: [{ id: OBSERVATION_IDS.HUMMING_GROWL_CHANGES_WITH_SPEED, value: "YES" }],
        next: "wheel_bearing_check",
      },
      {
        id: "engine_running",
        text: "Even when parked with engine running",
        observations: [],
        next: "engine_noise_type",
      },
    ],
  },

  brake_noise_type: {
    id: "brake_noise_type",
    text: "What kind of brake noise?",
    options: [
      {
        id: "grinding",
        text: "Grinding - metal on metal sound",
        observations: [{ id: OBSERVATION_IDS.GRINDING_NOISE_WHEN_BRAKING, value: "YES" }],
        next: null,
        canResolve: true,
      },
      {
        id: "squealing",
        text: "High-pitched squealing",
        observations: [],
        next: "squeal_when",
      },
      {
        id: "pulsating",
        text: "Rhythmic thumping or pulsing",
        observations: [{ id: OBSERVATION_IDS.BRAKE_PEDAL_PULSATION, value: "YES" }],
        next: null,
        canResolve: true,
      },
    ],
  },

  squeal_when: {
    id: "squeal_when",
    text: "When does the squealing happen?",
    options: [
      {
        id: "always_braking",
        text: "Every time I brake",
        observations: [],
        next: null,
        canResolve: true,
      },
      {
        id: "first_thing",
        text: "Only first thing in the morning, then goes away",
        observations: [],
        next: null,
        canResolve: true,
      },
      {
        id: "light_braking",
        text: "Only with light braking, not hard stops",
        observations: [],
        next: null,
      },
    ],
  },

  suspension_noise_type: {
    id: "suspension_noise_type",
    text: "Describe the bump noise:",
    options: [
      {
        id: "clunk",
        text: "Solid clunk or knock",
        observations: [{ id: OBSERVATION_IDS.CLUNK_OVER_BUMPS, value: "YES" }],
        next: "clunk_location",
      },
      {
        id: "rattle",
        text: "Rattling or loose-sounding",
        observations: [{ id: OBSERVATION_IDS.RATTLE_OVER_ROUGH_ROAD, value: "YES" }],
        next: null,
      },
      {
        id: "squeak",
        text: "Squeaking or creaking",
        observations: [],
        next: null,
      },
    ],
  },

  clunk_location: {
    id: "clunk_location",
    text: "Where does the clunk seem to come from?",
    options: [
      {
        id: "front_one_side",
        text: "Front - one side",
        observations: [],
        next: null,
        canResolve: true,
      },
      {
        id: "front_both",
        text: "Front - both sides",
        observations: [],
        next: null,
      },
      {
        id: "rear",
        text: "Rear of the vehicle",
        observations: [],
        next: null,
      },
    ],
  },

  steering_noise_type: {
    id: "steering_noise_type",
    text: "What type of steering noise?",
    options: [
      {
        id: "whine",
        text: "Whining that gets louder when turning",
        observations: [{ id: OBSERVATION_IDS.WHINE_WHEN_TURNING, value: "YES" }],
        next: null,
        canResolve: true,
      },
      {
        id: "groan",
        text: "Groaning or moaning sound",
        observations: [{ id: OBSERVATION_IDS.STEERING_FEELS_HEAVY, value: "YES" }],
        next: null,
        canResolve: true,
      },
      {
        id: "click_turn",
        text: "Clicking when turning",
        observations: [],
        next: "click_turn_speed",
      },
    ],
  },

  click_turn_speed: {
    id: "click_turn_speed",
    text: "When does the clicking happen while turning?",
    options: [
      {
        id: "slow_turns",
        text: "Slow speed turns, like parking lots",
        observations: [],
        next: null,
        canResolve: true, // CV joint
      },
      {
        id: "any_speed",
        text: "Any speed when turning",
        observations: [],
        next: null,
      },
    ],
  },

  wheel_bearing_check: {
    id: "wheel_bearing_check",
    text: "Does the humming/droning change when you swerve slightly?",
    subtext: "Try gently weaving on an empty road",
    options: [
      {
        id: "changes_left",
        text: "Gets louder when turning left",
        observations: [],
        next: null,
        canResolve: true, // Right wheel bearing
      },
      {
        id: "changes_right",
        text: "Gets louder when turning right",
        observations: [],
        next: null,
        canResolve: true, // Left wheel bearing
      },
      {
        id: "no_change",
        text: "Stays the same regardless of steering",
        observations: [{ id: OBSERVATION_IDS.VIBRATION_AT_SPEED, value: "YES" }],
        next: "tire_noise_check",
      },
    ],
  },

  tire_noise_check: {
    id: "tire_noise_check",
    text: "Have you checked your tires recently?",
    options: [
      {
        id: "uneven_wear",
        text: "Yes - noticed uneven wear",
        observations: [{ id: OBSERVATION_IDS.UNEVEN_TIRE_WEAR_VISIBLE, value: "YES" }],
        next: null,
        canResolve: true,
      },
      {
        id: "tires_ok",
        text: "Tires look fine",
        observations: [],
        next: null,
      },
    ],
  },

  engine_noise_type: {
    id: "engine_noise_type",
    text: "Describe the engine noise:",
    options: [
      {
        id: "ticking",
        text: "Ticking or tapping",
        observations: [],
        next: "tick_oil_level",
      },
      {
        id: "knocking",
        text: "Deep knocking or banging",
        observations: [],
        next: null,
        canResolve: true, // Serious - rod knock
      },
      {
        id: "squealing_belt",
        text: "Squealing that changes with RPM",
        observations: [],
        next: null,
        canResolve: true, // Belt
      },
      {
        id: "hissing",
        text: "Hissing sound",
        observations: [],
        next: null,
        canResolve: true, // Vacuum leak
      },
    ],
  },

  tick_oil_level: {
    id: "tick_oil_level",
    text: "When did you last check the oil level?",
    options: [
      {
        id: "oil_low",
        text: "It's low or I haven't checked in a while",
        observations: [],
        next: null,
        canResolve: true,
      },
      {
        id: "oil_ok",
        text: "Oil level is fine",
        observations: [],
        next: null,
      },
    ],
  },

  // ===== ELECTRICAL QUESTIONS =====
  electrical_symptom: {
    id: "electrical_symptom",
    text: "What's the main electrical issue?",
    options: [
      {
        id: "flickering",
        text: "Lights flickering or dimming",
        observations: [
          { id: OBSERVATION_IDS.LIGHTS_FLICKER, value: "YES" },
          { id: OBSERVATION_IDS.HEADLIGHTS_DIM, value: "YES" },
        ],
        next: "flicker_when",
      },
      {
        id: "dead_battery",
        text: "Battery keeps dying",
        observations: [{ id: OBSERVATION_IDS.JUMP_START_HELPS, value: "YES" }],
        next: "battery_drain_pattern",
      },
      {
        id: "things_reset",
        text: "Clock/radio keep resetting",
        observations: [{ id: OBSERVATION_IDS.RADIO_RESETS, value: "YES" }],
        next: "battery_drain_pattern",
      },
      {
        id: "random_shutoff",
        text: "Random electrical cutouts while driving",
        observations: [{ id: OBSERVATION_IDS.INTERMITTENT_NO_POWER, value: "YES" }],
        next: "cutout_pattern",
      },
    ],
  },

  flicker_when: {
    id: "flicker_when",
    text: "When do the lights flicker?",
    options: [
      {
        id: "at_idle",
        text: "At idle, then get better when revving",
        observations: [],
        next: null,
        canResolve: true, // Alternator
      },
      {
        id: "using_accessories",
        text: "When using AC, wipers, or other accessories",
        observations: [],
        next: null,
        canResolve: true,
      },
      {
        id: "random_flicker",
        text: "Randomly, no pattern",
        observations: [],
        next: "battery_terminals",
      },
    ],
  },

  battery_drain_pattern: {
    id: "battery_drain_pattern",
    text: "How quickly does the battery die?",
    options: [
      {
        id: "overnight",
        text: "Overnight - dead by morning",
        observations: [],
        next: "parasitic_draw_check",
      },
      {
        id: "few_days",
        text: "After sitting for a few days",
        observations: [],
        next: "battery_age",
      },
      {
        id: "same_day",
        text: "Same day - even after driving",
        observations: [],
        next: null,
        canResolve: true, // Alternator not charging
      },
    ],
  },

  parasitic_draw_check: {
    id: "parasitic_draw_check",
    text: "Did you recently add any accessories to the car?",
    subtext: "Dashcam, stereo, alarm, lights, etc.",
    options: [
      {
        id: "yes_accessories",
        text: "Yes - added something recently",
        observations: [],
        next: null,
        canResolve: true,
      },
      {
        id: "no_accessories",
        text: "No - nothing new",
        observations: [],
        next: null,
      },
    ],
  },

  cutout_pattern: {
    id: "cutout_pattern",
    text: "Is there a pattern to when the electrical cuts out?",
    options: [
      {
        id: "over_bumps",
        text: "Often happens over bumps",
        observations: [],
        next: null,
        canResolve: true, // Loose connection
      },
      {
        id: "random_cutout",
        text: "Completely random",
        observations: [],
        next: "battery_terminals",
      },
    ],
  },

  // ===== BRAKING/HANDLING QUESTIONS =====
  brake_or_handling: {
    id: "brake_or_handling",
    text: "Is this a braking issue or a handling/steering issue?",
    options: [
      {
        id: "brake_issue",
        text: "Braking - something feels wrong with the brakes",
        observations: [],
        next: "brake_feel",
      },
      {
        id: "steering_issue",
        text: "Steering or handling feels off",
        observations: [],
        next: "steering_feel",
      },
      {
        id: "vibration",
        text: "Vibration or shaking",
        observations: [{ id: OBSERVATION_IDS.VIBRATION_AT_SPEED, value: "YES" }],
        next: "vibration_when",
      },
      {
        id: "pulling",
        text: "Car pulls to one side",
        observations: [{ id: OBSERVATION_IDS.PULLS_TO_ONE_SIDE, value: "YES" }],
        next: "pull_when",
      },
    ],
  },

  brake_feel: {
    id: "brake_feel",
    text: "How do the brakes feel?",
    options: [
      {
        id: "soft",
        text: "Soft/spongy - pedal goes too far down",
        observations: [{ id: OBSERVATION_IDS.BRAKE_PEDAL_SOFT, value: "YES" }],
        next: "brake_fluid_check",
      },
      {
        id: "pulsating",
        text: "Pulsating - pedal vibrates when braking",
        observations: [{ id: OBSERVATION_IDS.BRAKE_PEDAL_PULSATION, value: "YES" }],
        next: null,
        canResolve: true, // Warped rotors
      },
      {
        id: "hard",
        text: "Hard - have to push really hard",
        observations: [],
        next: null,
        canResolve: true, // Booster issue
      },
      {
        id: "grabby",
        text: "Grabby - brakes too hard even with light pressure",
        observations: [],
        next: null,
      },
    ],
  },

  brake_fluid_check: {
    id: "brake_fluid_check",
    text: "Can you check the brake fluid level?",
    subtext: "Look at the reservoir under the hood",
    options: [
      {
        id: "fluid_low",
        text: "It's low",
        observations: [],
        next: "brake_leak_check",
      },
      {
        id: "fluid_ok",
        text: "Fluid level looks fine",
        observations: [],
        next: null,
        canResolve: true, // Air in lines
      },
    ],
  },

  brake_leak_check: {
    id: "brake_leak_check",
    text: "Do you see any fluid leaking near the wheels?",
    options: [
      {
        id: "yes_leak",
        text: "Yes - I see wet spots near a wheel",
        observations: [],
        next: null,
        canResolve: true,
      },
      {
        id: "no_leak",
        text: "No visible leaks",
        observations: [],
        next: null,
      },
    ],
  },

  steering_feel: {
    id: "steering_feel",
    text: "What's wrong with the steering?",
    options: [
      {
        id: "heavy",
        text: "Heavy - hard to turn",
        observations: [{ id: OBSERVATION_IDS.STEERING_FEELS_HEAVY, value: "YES" }],
        next: "power_steering_check",
      },
      {
        id: "loose",
        text: "Loose - lots of play before wheels respond",
        observations: [{ id: OBSERVATION_IDS.STEERING_WANDERS, value: "YES" }],
        next: null,
        canResolve: true,
      },
      {
        id: "wanders",
        text: "Wanders - hard to keep straight",
        observations: [{ id: OBSERVATION_IDS.STEERING_WANDERS, value: "YES" }],
        next: "alignment_check",
      },
    ],
  },

  power_steering_check: {
    id: "power_steering_check",
    text: "Does your car have power steering fluid? (Not all newer cars do)",
    options: [
      {
        id: "has_ps_fluid",
        text: "Yes - I can see the reservoir",
        observations: [],
        next: "ps_fluid_level",
      },
      {
        id: "electric_ps",
        text: "No - it's electric power steering",
        observations: [],
        next: null,
      },
      {
        id: "not_sure_ps",
        text: "I'm not sure",
        observations: [],
        next: null,
      },
    ],
  },

  ps_fluid_level: {
    id: "ps_fluid_level",
    text: "What's the power steering fluid level?",
    options: [
      {
        id: "ps_low",
        text: "It's low",
        observations: [],
        next: null,
        canResolve: true,
      },
      {
        id: "ps_ok",
        text: "Level looks fine",
        observations: [],
        next: null,
      },
    ],
  },

  alignment_check: {
    id: "alignment_check",
    text: "Have you hit any big potholes or curbs recently?",
    options: [
      {
        id: "hit_pothole",
        text: "Yes - hit something hard",
        observations: [],
        next: null,
        canResolve: true, // Alignment
      },
      {
        id: "no_impact",
        text: "No - nothing like that",
        observations: [{ id: OBSERVATION_IDS.UNEVEN_TIRE_WEAR_VISIBLE, value: "YES" }],
        next: null,
      },
    ],
  },

  vibration_when: {
    id: "vibration_when",
    text: "When do you feel the vibration?",
    options: [
      {
        id: "highway_speed",
        text: "At highway speeds (60+ mph)",
        observations: [{ id: OBSERVATION_IDS.VIBRATION_AT_SPEED, value: "YES" }],
        next: "vibration_where",
      },
      {
        id: "any_speed",
        text: "At all speeds",
        observations: [],
        next: "vibration_where",
      },
      {
        id: "only_braking",
        text: "Only when braking",
        observations: [{ id: OBSERVATION_IDS.BRAKE_PEDAL_PULSATION, value: "YES" }],
        next: null,
        canResolve: true,
      },
    ],
  },

  vibration_where: {
    id: "vibration_where",
    text: "Where do you feel it most?",
    options: [
      {
        id: "steering_wheel",
        text: "In the steering wheel",
        observations: [{ id: OBSERVATION_IDS.STEERING_WHEEL_SHAKE, value: "YES" }],
        next: null,
        canResolve: true, // Front balance/tires
      },
      {
        id: "seat",
        text: "In my seat / whole car",
        observations: [],
        next: null,
        canResolve: true, // Rear balance/tires
      },
      {
        id: "both",
        text: "Both steering wheel and seat",
        observations: [{ id: OBSERVATION_IDS.STEERING_WHEEL_SHAKE, value: "YES" }],
        next: null,
      },
    ],
  },

  pull_when: {
    id: "pull_when",
    text: "When does it pull to the side?",
    options: [
      {
        id: "always_pulling",
        text: "All the time while driving",
        observations: [{ id: OBSERVATION_IDS.PULLS_TO_ONE_SIDE, value: "YES" }],
        next: "alignment_check",
      },
      {
        id: "only_braking_pull",
        text: "Only when I brake",
        observations: [{ id: OBSERVATION_IDS.PULLS_WHEN_BRAKING, value: "YES" }],
        next: null,
        canResolve: true, // Stuck caliper or uneven brakes
      },
    ],
  },

  // ===== HVAC/SMELLS QUESTIONS =====
  hvac_or_smell: {
    id: "hvac_or_smell",
    text: "Is this a climate control issue or an unusual smell?",
    options: [
      {
        id: "hvac",
        text: "Heat or AC not working right",
        observations: [],
        next: "hvac_issue",
      },
      {
        id: "smell",
        text: "I'm noticing an unusual smell",
        observations: [],
        next: "smell_type",
      },
    ],
  },

  hvac_issue: {
    id: "hvac_issue",
    text: "What's the HVAC issue?",
    options: [
      {
        id: "no_heat",
        text: "No heat - only cold air",
        observations: [{ id: OBSERVATION_IDS.NO_HEAT, value: "YES" }],
        next: "heat_temp_gauge",
      },
      {
        id: "no_cold",
        text: "No AC - only warm air",
        observations: [{ id: OBSERVATION_IDS.NO_AC, value: "YES" }],
        next: "ac_details",
      },
      {
        id: "weak_air",
        text: "Weak airflow even on high",
        observations: [{ id: OBSERVATION_IDS.AIRFLOW_WEAK, value: "YES" }],
        next: "weak_air_details",
      },
      {
        id: "no_fan",
        text: "Fan doesn't blow at all",
        observations: [{ id: OBSERVATION_IDS.BLOWER_NOT_WORKING, value: "YES" }],
        next: "fan_details",
      },
    ],
  },

  heat_temp_gauge: {
    id: "heat_temp_gauge",
    text: "What does the engine temperature gauge show?",
    options: [
      {
        id: "never_warms",
        text: "Engine never warms up - stays cold",
        observations: [],
        next: null,
        canResolve: true, // Thermostat stuck open
      },
      {
        id: "warms_normal",
        text: "Engine warms up normally",
        observations: [],
        next: "coolant_check",
      },
      {
        id: "overheats",
        text: "Engine is overheating",
        observations: [{ id: OBSERVATION_IDS.TEMP_GAUGE_HIGH, value: "YES" }],
        next: null,
        canResolve: true,
      },
    ],
  },

  coolant_check: {
    id: "coolant_check",
    text: "Can you check the coolant level?",
    subtext: "Look at the overflow reservoir - DON'T open a hot radiator cap",
    options: [
      {
        id: "coolant_low",
        text: "It's low",
        observations: [],
        next: null,
        canResolve: true,
      },
      {
        id: "coolant_ok",
        text: "Level looks normal",
        observations: [],
        next: null,
        canResolve: true, // Blend door or heater core
      },
    ],
  },

  ac_details: {
    id: "ac_details",
    text: "When you turn on the AC, what happens?",
    options: [
      {
        id: "compressor_noise",
        text: "I hear a click and the engine RPM changes",
        observations: [],
        next: null,
        canResolve: true, // Low refrigerant
      },
      {
        id: "no_change",
        text: "Nothing - no click, no change",
        observations: [],
        next: null,
        canResolve: true, // Compressor or electrical
      },
    ],
  },

  weak_air_details: {
    id: "weak_air_details",
    text: "Is it weak from all vents or just some?",
    options: [
      {
        id: "all_vents_weak",
        text: "All vents are weak",
        observations: [],
        next: null,
        canResolve: true, // Cabin filter
      },
      {
        id: "some_vents",
        text: "Some vents are fine, others weak",
        observations: [],
        next: null,
        canResolve: true, // Blend door
      },
    ],
  },

  fan_details: {
    id: "fan_details",
    text: "Does the fan work on any speed setting?",
    options: [
      {
        id: "some_speeds",
        text: "Only works on high (or only some speeds)",
        observations: [],
        next: null,
        canResolve: true, // Resistor
      },
      {
        id: "no_speeds",
        text: "Doesn't work on any speed",
        observations: [{ id: OBSERVATION_IDS.BLOWER_NOT_WORKING, value: "YES" }],
        next: null,
        canResolve: true, // Motor or fuse
      },
    ],
  },

  smell_type: {
    id: "smell_type",
    text: "What does it smell like?",
    options: [
      {
        id: "sweet",
        text: "Sweet, like syrup or maple",
        observations: [{ id: OBSERVATION_IDS.SWEET_SMELL, value: "YES" }],
        next: null,
        canResolve: true, // Coolant leak
      },
      {
        id: "burning_oil",
        text: "Burning oil",
        observations: [{ id: OBSERVATION_IDS.BURNING_OIL_SMELL, value: "YES" }],
        next: "burning_oil_when",
      },
      {
        id: "rotten_egg",
        text: "Rotten eggs / sulfur",
        observations: [{ id: OBSERVATION_IDS.ROTTEN_EGG_SMELL, value: "YES" }],
        next: null,
        canResolve: true, // Catalytic converter
      },
      {
        id: "musty",
        text: "Musty or moldy",
        observations: [{ id: OBSERVATION_IDS.MUSTY_SMELL_FROM_VENTS, value: "YES" }],
        next: null,
        canResolve: true, // AC evaporator/cabin filter
      },
      {
        id: "exhaust_inside",
        text: "Exhaust fumes inside the car",
        observations: [{ id: OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN, value: "YES" }],
        next: null,
        canResolve: true, // Exhaust leak - dangerous
      },
      {
        id: "electrical_burning",
        text: "Burning plastic or electrical",
        observations: [{ id: OBSERVATION_IDS.BURNT_ELECTRICAL_SMELL, value: "YES" }],
        next: null,
        canResolve: true,
      },
      {
        id: "gas_smell",
        text: "Gasoline",
        observations: [{ id: OBSERVATION_IDS.RAW_FUEL_SMELL_OUTSIDE, value: "YES" }],
        next: null,
        canResolve: true,
      },
    ],
  },

  burning_oil_when: {
    id: "burning_oil_when",
    text: "When do you smell burning oil?",
    options: [
      {
        id: "after_driving",
        text: "After driving, from outside the car",
        observations: [],
        next: null,
        canResolve: true, // Valve cover or oil leak
      },
      {
        id: "through_vents",
        text: "Coming through the vents while driving",
        observations: [],
        next: null,
        canResolve: true,
      },
    ],
  },
};

// Starting question for each entry anchor
const ENTRY_START_QUESTIONS: Record<EntryAnchor, string> = {
  [ENTRY_ANCHORS.WONT_START]: "turn_key",
  [ENTRY_ANCHORS.STARTS_THEN_DIES]: "when_stalls",
  [ENTRY_ANCHORS.NOISE]: "noise_when",
  [ENTRY_ANCHORS.ELECTRICAL]: "electrical_symptom",
  [ENTRY_ANCHORS.BRAKING_HANDLING]: "brake_or_handling",
  [ENTRY_ANCHORS.HVAC_SMELLS]: "hvac_or_smell",
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

export function DiagnosticFlow({ vehicleId, onResult, excludedHypotheses = [], onClearExclusions }: DiagnosticFlowProps) {
  const [step, setStep] = useState<FlowStep>("entry");
  const [entryAnchor, setEntryAnchor] = useState<EntryAnchor | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState<ObservationResponse[]>([]);

  const currentQuestion = currentQuestionId ? ALL_QUESTIONS[currentQuestionId] : null;

  // Handle entry anchor selection
  const handleSelectEntry = (anchor: EntryAnchor) => {
    setEntryAnchor(anchor);
    setStep("questions");
    const startQuestion = ENTRY_START_QUESTIONS[anchor];
    setCurrentQuestionId(startQuestion);
    setQuestionHistory([startQuestion]);
    setAnswers({});
    setObservations([]);
  };

  // Handle answer selection
  const handleSelectAnswer = (option: AnswerOption) => {
    if (!currentQuestionId || !entryAnchor) return;

    // Record the answer
    const newAnswers = { ...answers, [currentQuestionId]: option.id };
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

    // Determine next question or end flow
    if (option.next === null || option.canResolve) {
      // Check if we should end the flow
      if (option.canResolve || option.next === null) {
        runDiagnosis(newObservations, newAnswers);
        return;
      }
    }

    if (option.next && ALL_QUESTIONS[option.next]) {
      // Go to specified next question
      setCurrentQuestionId(option.next);
      setQuestionHistory([...questionHistory, option.next]);
    } else {
      // No more questions - run diagnosis
      runDiagnosis(newObservations, newAnswers);
    }
  };

  // Go back to previous question
  const handleBack = () => {
    if (questionHistory.length > 1) {
      const newHistory = questionHistory.slice(0, -1);
      setQuestionHistory(newHistory);
      setCurrentQuestionId(newHistory[newHistory.length - 1]);
      // Remove the last answer
      const lastQuestionId = questionHistory[questionHistory.length - 1];
      const newAnswers = { ...answers };
      delete newAnswers[lastQuestionId];
      setAnswers(newAnswers);
    } else {
      // Go back to entry selection
      setStep("entry");
      setEntryAnchor(null);
      setCurrentQuestionId(null);
      setQuestionHistory([]);
    }
  };

  // Start over
  const handleStartOver = () => {
    setStep("entry");
    setEntryAnchor(null);
    setCurrentQuestionId(null);
    setQuestionHistory([]);
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
      excludedHypotheses,
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

        {/* Show excluded hypotheses if any (Pro re-run mode) */}
        {excludedHypotheses.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "rgba(255,200,50,0.15)",
              borderRadius: 8,
              border: "1px solid rgba(255,200,50,0.3)",
            }}
            data-testid="excluded-hypotheses-banner"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>⭐ Pro Mode: Re-running with exclusions</strong>
                <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.9 }}>
                  Excluding: {excludedHypotheses.join(", ")}
                </p>
              </div>
              {onClearExclusions && (
                <button
                  className="button"
                  onClick={onClearExclusions}
                  style={{ padding: "6px 12px", fontSize: 13 }}
                >
                  Clear & Start Fresh
                </button>
              )}
            </div>
          </div>
        )}

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

  // Dynamic questions
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
              {questionHistory.length} question{questionHistory.length !== 1 ? "s" : ""} answered
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
