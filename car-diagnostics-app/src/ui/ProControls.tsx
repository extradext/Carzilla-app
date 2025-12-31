/**
 * /src/ui/ProControls.tsx
 * PRESENTATION ONLY
 *
 * PRO FEATURE — REDUCED WEIGHT / EXCLUSION
 * - Pro-only
 * - COMPONENT-LEVEL, not system-level
 *   (e.g., alternator, battery, caliper, fuel pump)
 * - Per-run only (never permanent)
 * - Cannot affect safety-critical items
 * - Warning required: "May reduce accuracy or cause misdiagnosis"
 */

import React, { useState } from "react";

type ProControlsProps = {
  isPro: boolean;
  excludedComponents: Set<string>;
  onExcludedChange: (excluded: Set<string>) => void;
};

// Component-level exclusions (NOT system-level)
const EXCLUDABLE_COMPONENTS = [
  { id: "alternator", label: "Alternator", category: "electrical" },
  { id: "battery", label: "Battery", category: "electrical" },
  { id: "starter", label: "Starter Motor", category: "electrical" },
  { id: "spark_plugs", label: "Spark Plugs", category: "ignition" },
  { id: "ignition_coils", label: "Ignition Coils", category: "ignition" },
  { id: "fuel_pump", label: "Fuel Pump", category: "fuel" },
  { id: "fuel_filter", label: "Fuel Filter", category: "fuel" },
  { id: "fuel_injectors", label: "Fuel Injectors", category: "fuel" },
  { id: "water_pump", label: "Water Pump", category: "cooling" },
  { id: "thermostat", label: "Thermostat", category: "cooling" },
  { id: "radiator", label: "Radiator", category: "cooling" },
  { id: "serpentine_belt", label: "Serpentine Belt", category: "mechanical" },
  { id: "timing_belt", label: "Timing Belt/Chain", category: "mechanical" },
  { id: "wheel_bearing", label: "Wheel Bearing", category: "suspension" },
  { id: "cv_joint", label: "CV Joint/Axle", category: "drivetrain" },
  { id: "mass_airflow", label: "MAF Sensor", category: "sensors" },
  { id: "o2_sensor", label: "O2 Sensor", category: "sensors" },
  { id: "catalytic_converter", label: "Catalytic Converter", category: "exhaust" },
  { id: "ac_compressor", label: "A/C Compressor", category: "hvac" },
  { id: "blower_motor", label: "Blower Motor", category: "hvac" },
];

// Safety-critical components that CANNOT be excluded
const PROTECTED_COMPONENTS = [
  "brake_pads",
  "brake_rotors",
  "brake_calipers",
  "brake_lines",
  "master_cylinder",
  "abs_module",
  "steering_rack",
  "tie_rods",
  "ball_joints",
];

export function ProControls({ isPro, excludedComponents, onExcludedChange }: ProControlsProps) {
  const [showWarning, setShowWarning] = useState(false);

  const handleToggle = (componentId: string) => {
    if (!isPro) return;

    const newExcluded = new Set(excludedComponents);
    if (newExcluded.has(componentId)) {
      newExcluded.delete(componentId);
    } else {
      newExcluded.add(componentId);
      if (!showWarning) setShowWarning(true);
    }
    onExcludedChange(newExcluded);
  };

  const handleClearAll = () => {
    onExcludedChange(new Set());
  };

  // Free user view
  if (!isPro) {
    return (
      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 8,
          border: "1px dashed rgba(255,255,255,0.15)",
        }}
        data-testid="pro-controls-locked"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Pro Feature</span>
        </div>
        <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>
          Upgrade to Pro to mark components as "known good" and reduce their diagnostic weight.
        </p>
      </div>
    );
  }

  // Group components by category
  const grouped = EXCLUDABLE_COMPONENTS.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, typeof EXCLUDABLE_COMPONENTS>);

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        background: "rgba(139,92,246,0.1)",
        borderRadius: 8,
        border: "1px solid rgba(139,92,246,0.3)",
      }}
      data-testid="pro-controls"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Known Good Components (Pro)</span>
        </div>
        {excludedComponents.size > 0 && (
          <button
            className="button"
            onClick={handleClearAll}
            style={{ padding: "4px 10px", fontSize: 11 }}
            data-testid="btn-clear-exclusions"
          >
            Clear All ({excludedComponents.size})
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 12 }}>
        Mark specific components you've recently replaced or verified. Their diagnostic weight will be reduced for this run only.
      </p>

      {/* Warning */}
      {showWarning && excludedComponents.size > 0 && (
        <div
          style={{
            padding: 10,
            background: "rgba(234,179,8,0.2)",
            borderRadius: 6,
            marginBottom: 12,
            fontSize: 12,
          }}
          data-testid="pro-warning"
        >
          ⚠️ <strong>Warning:</strong> May reduce accuracy or cause misdiagnosis. Only exclude components you are certain are functioning correctly.
        </div>
      )}

      {/* Component groups */}
      <div style={{ display: "grid", gap: 12 }}>
        {Object.entries(grouped).map(([category, components]) => (
          <div key={category}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6, textTransform: "uppercase" }}>
              {category}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {components.map((comp) => {
                const isExcluded = excludedComponents.has(comp.id);
                return (
                  <button
                    key={comp.id}
                    className="button"
                    onClick={() => handleToggle(comp.id)}
                    style={{
                      padding: "6px 10px",
                      fontSize: 11,
                      background: isExcluded ? "rgba(139,92,246,0.3)" : undefined,
                      borderColor: isExcluded ? "rgba(139,92,246,0.6)" : undefined,
                    }}
                    data-testid={`btn-exclude-${comp.id}`}
                  >
                    {isExcluded ? "✓ " : ""}{comp.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Protected notice */}
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 12, marginBottom: 0 }}>
        Note: Safety-critical components (brakes, steering) cannot be excluded.
      </p>
    </div>
  );
}
