/**
 * /src/ui/ProControls.tsx
 * PRESENTATION ONLY
 *
 * PRO FEATURE (EXPLICIT + WARNED)
 * - Reduced-Weight / Exclusion Tool
 * - Pro-only
 * - Per-run only (never permanent)
 * - User can mark hypothesis or component as "known good"
 * - Cannot affect safety families
 * - Must show warning
 */

import React, { useState } from "react";
import { HYPOTHESIS_FAMILIES, HYPOTHESIS_FAMILY_LABELS, type HypothesisFamilyId } from "../diagnostics/hypothesisFamilies";

type ProControlsProps = {
  isPro: boolean;
  excludedFamilies: Set<HypothesisFamilyId>;
  onExcludedChange: (excluded: Set<HypothesisFamilyId>) => void;
};

// Families that cannot be excluded (safety-related)
const PROTECTED_FAMILIES: HypothesisFamilyId[] = [
  // No specific safety families in hypothesis families, but we keep brakes protected
  HYPOTHESIS_FAMILIES.BRAKES_HEAT_DRAG,
];

const EXCLUDABLE_FAMILIES: HypothesisFamilyId[] = Object.values(HYPOTHESIS_FAMILIES).filter(
  (f) => !PROTECTED_FAMILIES.includes(f) && f !== HYPOTHESIS_FAMILIES.HVAC_SECONDARY
);

export function ProControls({ isPro, excludedFamilies, onExcludedChange }: ProControlsProps) {
  const [showWarning, setShowWarning] = useState(false);

  const handleToggle = (family: HypothesisFamilyId) => {
    if (!isPro) return;

    const newExcluded = new Set(excludedFamilies);
    if (newExcluded.has(family)) {
      newExcluded.delete(family);
    } else {
      newExcluded.add(family);
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
          <span style={{ fontWeight: 600, fontSize: 14 }}>Known Good (Pro)</span>
        </div>
        {excludedFamilies.size > 0 && (
          <button
            className="button"
            onClick={handleClearAll}
            style={{ padding: "4px 10px", fontSize: 11 }}
            data-testid="btn-clear-exclusions"
          >
            Clear All
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 12 }}>
        Mark components you've recently replaced or verified as "known good". Their diagnostic weight will be reduced for this run only.
      </p>

      {/* Warning */}
      {showWarning && excludedFamilies.size > 0 && (
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
          ⚠️ <strong>Warning:</strong> Excluding components may reduce diagnostic accuracy and could lead to misdiagnosis. Use only when you're certain a component is functioning correctly.
        </div>
      )}

      {/* Excludable families */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
        {EXCLUDABLE_FAMILIES.map((family) => {
          const isExcluded = excludedFamilies.has(family);
          return (
            <button
              key={family}
              className="button"
              onClick={() => handleToggle(family)}
              style={{
                padding: "8px 12px",
                fontSize: 12,
                textAlign: "left",
                background: isExcluded ? "rgba(139,92,246,0.3)" : undefined,
                borderColor: isExcluded ? "rgba(139,92,246,0.6)" : undefined,
              }}
              data-testid={`btn-exclude-${family}`}
            >
              {isExcluded ? "✓ " : ""}{HYPOTHESIS_FAMILY_LABELS[family]}
            </button>
          );
        })}
      </div>

      {/* Protected notice */}
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 12, marginBottom: 0 }}>
        Note: Safety-critical systems (brakes) cannot be excluded.
      </p>
    </div>
  );
}
