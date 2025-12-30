/**
 * /src/ui/SafetyPanel.tsx
 * PRESENTATION ONLY
 *
 * Safety Hard Stops (REROUTES, NOT BLOCKS)
 * - Safety triggers DO NOT block diagnosis
 * - Display contextual safety instructions
 * - Require user acknowledgment
 * - Then allow diagnosis to continue
 */

import React from "react";
import type { SafetyEvaluation, SafetyTriggerId } from "../core/safety";
import { OBSERVATION_IDS } from "../core/observations";

type SafetyPanelProps = {
  safety: SafetyEvaluation;
  onAcknowledge: () => void;
  acknowledged: boolean;
};

type SafetyGuidance = {
  title: string;
  icon: string;
  instructions: string[];
  acknowledgmentText: string;
};

const SAFETY_GUIDANCE: Record<SafetyTriggerId, SafetyGuidance> = {
  [OBSERVATION_IDS.OIL_PRESSURE_WARNING]: {
    title: "Oil Pressure Warning",
    icon: "🛢️",
    instructions: [
      "Stop the engine immediately if safe to do so",
      "Check oil level with the dipstick",
      "Look for visible leaks under the vehicle",
      "Allow the engine to cool before investigating",
      "Do NOT restart until the issue is resolved",
    ],
    acknowledgmentText: "I understand and will check safely",
  },
  [OBSERVATION_IDS.OVERHEATING_WARNING]: {
    title: "Engine Overheating",
    icon: "🌡️",
    instructions: [
      "Pull over safely and turn off the engine",
      "Open the hood to allow heat to escape (once safe)",
      "Turn on the heater to maximum to help dissipate heat",
      "DO NOT open the radiator cap when hot — risk of burns",
      "Check coolant level only when engine has cooled",
      "Look for steam, leaks, or puddles under vehicle",
    ],
    acknowledgmentText: "I understand and will check safely",
  },
  [OBSERVATION_IDS.FLASHING_CEL]: {
    title: "Flashing Check Engine Light",
    icon: "⚠️",
    instructions: [
      "A flashing CEL indicates active misfiring",
      "Stop driving as soon as safely possible",
      "Continuing to drive can cause severe catalytic converter damage",
      "Have the vehicle towed or diagnosed before driving further",
    ],
    acknowledgmentText: "I understand — engine damage risk",
  },
  [OBSERVATION_IDS.EXHAUST_SMELL_IN_CABIN]: {
    title: "Exhaust Smell in Cabin",
    icon: "💨",
    instructions: [
      "Roll down all windows immediately",
      "Turn off recirculation mode on HVAC",
      "Exit the vehicle and get fresh air",
      "Carbon monoxide poisoning is a serious risk",
      "Have the exhaust system inspected before driving",
    ],
    acknowledgmentText: "I am safe / vehicle ventilated",
  },
  [OBSERVATION_IDS.BRAKE_FAILURE_WARNING]: {
    title: "Brake Failure / Warning",
    icon: "🛑",
    instructions: [
      "Pump the brake pedal rapidly — this may restore pressure",
      "Downshift to use engine braking",
      "Use the emergency/parking brake gradually",
      "Steer toward an uphill grade or safe area",
      "DO NOT turn off the engine — you'll lose power steering/brakes",
      "Call for a tow — do not attempt to drive",
    ],
    acknowledgmentText: "I am stopped / vehicle is safe",
  },
};

export function SafetyPanel({ safety, onAcknowledge, acknowledged }: SafetyPanelProps) {
  if (!safety.safetyOverride) return null;

  return (
    <div
      style={{
        background: "rgba(239, 68, 68, 0.15)",
        border: "2px solid rgba(239, 68, 68, 0.5)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}
      data-testid="safety-panel"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>⚠️</span>
        <h3 style={{ margin: 0, color: "#fca5a5" }}>Safety Alert</h3>
      </div>

      <p style={{ fontSize: 14, marginBottom: 16, opacity: 0.9 }}>
        One or more safety-critical conditions have been detected. Please review the guidance below before proceeding.
      </p>

      {/* Guidance for each triggered warning */}
      <div style={{ display: "grid", gap: 12 }}>
        {safety.warnings.map((triggerId) => {
          const guidance = SAFETY_GUIDANCE[triggerId];
          if (!guidance) return null;

          return (
            <div
              key={triggerId}
              style={{
                background: "rgba(0,0,0,0.2)",
                borderRadius: 8,
                padding: 12,
              }}
              data-testid={`safety-guidance-${triggerId}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{guidance.icon}</span>
                <span style={{ fontWeight: 600 }}>{guidance.title}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, opacity: 0.9 }}>
                {guidance.instructions.map((instruction, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Acknowledgment */}
      {!acknowledged ? (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            className="button"
            onClick={onAcknowledge}
            style={{
              background: "rgba(239, 68, 68, 0.3)",
              borderColor: "rgba(239, 68, 68, 0.6)",
              padding: "12px 24px",
            }}
            data-testid="btn-acknowledge-safety"
          >
            I am safe / vehicle not in motion — Continue
          </button>
          <p style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
            Diagnosis will continue with safety information displayed.
          </p>
        </div>
      ) : (
        <div
          style={{
            marginTop: 16,
            padding: 8,
            background: "rgba(34, 197, 94, 0.2)",
            borderRadius: 6,
            textAlign: "center",
            fontSize: 13,
          }}
          data-testid="safety-acknowledged"
        >
          ✓ Acknowledged — Diagnosis may proceed
        </div>
      )}
    </div>
  );
}
