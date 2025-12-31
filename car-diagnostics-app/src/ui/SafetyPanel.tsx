/**
 * /src/ui/SafetyPanel.tsx
 * PRESENTATION ONLY
 *
 * Safety Panel (ADVISORY ONLY)
 * - NO hard stops
 * - NO blocking
 * - NO forced acknowledgments
 * - Safety guidance is informational only
 */

import React from "react";
import type { SafetyEvaluation, SafetyTriggerId } from "../core/safety";
import { OBSERVATION_IDS } from "../core/observations";

type SafetyPanelProps = {
  safety: SafetyEvaluation;
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

export function SafetyPanel({ safety }: SafetyPanelProps) {
  if (!safety.safetyOverride) return null;

  return (
    <div
      style={{
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
      data-testid="safety-panel"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <h3 style={{ margin: 0, color: "#fca5a5", fontSize: 15 }}>Safety Information</h3>
      </div>

      <p style={{ fontSize: 13, marginBottom: 12, opacity: 0.8 }}>
        The following safety-related observations have been noted. Review this guidance as needed.
      </p>

      {/* Guidance for each triggered warning */}
      <div style={{ display: "grid", gap: 10 }}>
        {safety.warnings.map((triggerId) => {
          const guidance = SAFETY_GUIDANCE[triggerId];
          if (!guidance) return null;

          return (
            <details
              key={triggerId}
              style={{
                background: "rgba(0,0,0,0.15)",
                borderRadius: 6,
                padding: 10,
              }}
              data-testid={`safety-guidance-${triggerId}`}
            >
              <summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{guidance.icon}</span>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{guidance.title}</span>
              </summary>
              <ul style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 12, opacity: 0.85 }}>
                {guidance.instructions.map((instruction, i) => (
                  <li key={i} style={{ marginBottom: 3 }}>
                    {instruction}
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}
