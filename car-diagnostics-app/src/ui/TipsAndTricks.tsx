/**
 * /src/ui/TipsAndTricks.tsx
 * PRESENTATION ONLY
 */

import React, { useState } from 'react';
import { TIPS, type TipCategory, type Tip } from '../content/tips';
import { FAQ } from '../content/faq';

const CATEGORY_LABELS: Record<TipCategory, string> = {
  brakes: "🛑 Brakes",
  electrical: "🔋 Electrical",
  engine: "🔧 Engine",
  general: "📋 General",
  tires: "🚗 Tires & Wheels",
};

const CATEGORY_ORDER: TipCategory[] = ["brakes", "electrical", "engine", "tires", "general"];

function groupTipsByCategory(tips: Tip[]): Record<TipCategory, Tip[]> {
  const grouped: Record<TipCategory, Tip[]> = {
    brakes: [],
    electrical: [],
    engine: [],
    general: [],
    tires: [],
  };
  tips.forEach((tip) => {
    grouped[tip.category].push(tip);
  });
  return grouped;
}

export function TipsAndTricks() {
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const groupedTips = groupTipsByCategory(TIPS);

  return (
    <section className="card" data-testid="tips-panel">
      <h2 style={{ marginTop: 0 }} data-testid="tips-title">
        Tips & Tricks
      </h2>

      {TIPS.length === 0 && FAQ.length === 0 && (
        <p style={{ opacity: 0.7 }}>Tips and troubleshooting content coming soon.</p>
      )}

      {TIPS.length > 0 && (
        <div data-testid="tips-list">
          {CATEGORY_ORDER.map((category) => {
            const categoryTips = groupedTips[category];
            if (categoryTips.length === 0) return null;
            return (
              <div key={category} style={{ marginBottom: 16 }}>
                <h3 style={{ marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4 }}>
                  {CATEGORY_LABELS[category]}
                </h3>
                {categoryTips.map((tip) => (
                  <details
                    key={tip.id}
                    open={expandedTip === tip.id}
                    style={{
                      marginBottom: 8,
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 8,
                      padding: '8px 12px',
                    }}
                  >
                    <summary
                      onClick={(e) => {
                        e.preventDefault();
                        setExpandedTip(expandedTip === tip.id ? null : tip.id);
                      }}
                      style={{ cursor: 'pointer', fontWeight: 500, listStyle: 'none' }}
                    >
                      {expandedTip === tip.id ? '▼' : '▶'} {tip.title}
                    </summary>
                    <div style={{ marginTop: 8, opacity: 0.9, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                      {tip.body}
                    </div>
                  </details>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {FAQ.length > 0 && (
        <div data-testid="faq-list" style={{ marginTop: 16 }}>
          <h3>Frequently Asked Questions</h3>
          {FAQ.map((item) => (
            <details key={item.id} style={{ marginBottom: 8 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500 }}>{item.question}</summary>
              <p style={{ margin: '8px 0 0 16px', opacity: 0.9 }}>{item.answer}</p>
            </details>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, padding: 12, background: 'rgba(255,200,100,0.1)', borderRadius: 8 }}>
        <strong>General Diagnostic Tips:</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li>Always note when symptoms occur (cold start, while driving, after warming up)</li>
          <li>Document any recent changes or work done to the vehicle</li>
          <li>Check for obvious issues first: fluid levels, warning lights, loose connections</li>
          <li>Be specific when describing sounds, smells, or sensations</li>
          <li>Keep track of mileage when issues first appear</li>
        </ul>
      </div>
    </section>
  );
}
