/**
 * /src/ui/ContextPanel.tsx
 * PRESENTATION ONLY
 *
 * Context Panel (INFORMATIONAL ONLY)
 * - Uses contextEvaluator
 * - Displays: + supports, ± related, – contradicts
 * - Never alters scoring
 */

import React from "react";
import type { ContextEvaluation, KnownIssueClassification } from "../engine/contextEvaluator";

type ContextPanelProps = {
  context: ContextEvaluation | null;
};

const CLASSIFICATION_STYLES: Record<KnownIssueClassification, { label: string; color: string; bg: string }> = {
  "+": { label: "Supports", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  "±": { label: "Related", color: "#eab308", bg: "rgba(234,179,8,0.15)" },
  "–": { label: "Contradicts", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

export function ContextPanel({ context }: ContextPanelProps) {
  if (!context || context.items.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      data-testid="context-panel"
    >
      <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Known Issues Context</h3>
      <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
        How your known issues relate to the diagnosis (informational only — does not affect scoring).
      </p>

      <div style={{ display: "grid", gap: 8 }}>
        {context.items.map((item) => {
          const style = CLASSIFICATION_STYLES[item.classification];
          return (
            <div
              key={item.issueId}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "10px 12px",
                background: style.bg,
                borderRadius: 6,
              }}
              data-testid={`context-item-${item.issueId}`}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: style.color,
                  minWidth: 24,
                  textAlign: "center",
                }}
              >
                {item.classification}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{item.issueLabel}</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{item.explanation}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer notes */}
      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.5 }}>
        {context.notes.map((note, i) => (
          <div key={i}>• {note}</div>
        ))}
      </div>
    </div>
  );
}
