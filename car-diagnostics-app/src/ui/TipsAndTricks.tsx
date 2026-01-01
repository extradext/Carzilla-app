/**
 * /src/ui/TipsAndTricks.tsx
 * PRESENTATION ONLY
 */

import React from 'react';
import { TIPS } from '../content/tips';
import { FAQ } from '../content/faq';

export function TipsAndTricks() {
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
          <h3>Troubleshooting Tips</h3>
          {TIPS.map((tip) => (
            <div key={tip.id} className="card" style={{ marginBottom: 8, background: 'rgba(255,255,255,0.04)' }}>
              <h4 style={{ margin: '0 0 8px' }}>{tip.title}</h4>
              <p style={{ margin: 0, opacity: 0.9 }}>{tip.body}</p>
            </div>
          ))}
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
        <strong>General Tips:</strong>
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
