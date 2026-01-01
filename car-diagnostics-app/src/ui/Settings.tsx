/**
 * /src/ui/Settings.tsx
 * PRESENTATION ONLY
 */

import React, { useState, useEffect } from "react";
import { getPreferences, savePreferences } from "../storage/localStore";
import type { UserPreferences } from "../models/userPreferences";

export function Settings() {
  const [prefs, setPrefs] = useState<UserPreferences>({
    notificationsEnabled: false,
    oilReminder: false,
    seasonalReminders: false,
    proEnabled: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loaded = getPreferences();
    setPrefs(loaded);
  }, []);

  const handleSave = () => {
    savePreferences(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = (key: keyof UserPreferences, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  return (
    <section className="card" data-testid="settings-panel">
      <h2 style={{ marginTop: 0 }} data-testid="settings-title">
        Settings
      </h2>

      <div style={{ display: "grid", gap: 16 }} data-testid="settings-form">
        {/* Pro Mode Toggle */}
        <div
          style={{
            padding: 16,
            background: prefs.proEnabled ? "rgba(255,200,50,0.15)" : "rgba(255,255,255,0.04)",
            borderRadius: 8,
            border: prefs.proEnabled ? "1px solid rgba(255,200,50,0.4)" : "1px solid transparent",
          }}
        >
          <label
            style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
            data-testid="settings-pro-label"
          >
            <input
              type="checkbox"
              checked={prefs.proEnabled}
              onChange={(e) => handleChange("proEnabled", e.target.checked)}
              data-testid="settings-pro-checkbox"
              style={{ width: 24, height: 24 }}
            />
            <div>
              <strong style={{ fontSize: 16 }}>
                ⭐ Pro Mode {prefs.proEnabled && <span style={{ color: "#ffd700" }}>(Active)</span>}
              </strong>
              <p style={{ margin: "4px 0 0", opacity: 0.8, fontSize: 14 }}>
                Enable advanced features:
              </p>
              <ul style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 13, opacity: 0.8 }}>
                <li>Re-run diagnosis excluding top hypothesis</li>
                <li>Component-level exclusions (coming soon)</li>
                <li>Advanced diagnostic insights (coming soon)</li>
              </ul>
            </div>
          </label>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Notifications</h3>
          
          <label
            style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 12 }}
            data-testid="settings-notifications-label"
          >
            <input
              type="checkbox"
              checked={prefs.notificationsEnabled}
              onChange={(e) => handleChange("notificationsEnabled", e.target.checked)}
              data-testid="settings-notifications-checkbox"
              style={{ width: 20, height: 20 }}
            />
            <div>
              <strong>Enable Notifications</strong>
              <p style={{ margin: "4px 0 0", opacity: 0.7, fontSize: 14 }}>
                Get maintenance reminders and alerts
              </p>
            </div>
          </label>

          <label
            style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 12 }}
            data-testid="settings-oil-label"
          >
            <input
              type="checkbox"
              checked={prefs.oilReminder}
              onChange={(e) => handleChange("oilReminder", e.target.checked)}
              data-testid="settings-oil-checkbox"
              style={{ width: 20, height: 20 }}
            />
            <div>
              <strong>Oil Change Reminder</strong>
              <p style={{ margin: "4px 0 0", opacity: 0.7, fontSize: 14 }}>
                Remind me when oil change is due
              </p>
            </div>
          </label>

          <label
            style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
            data-testid="settings-seasonal-label"
          >
            <input
              type="checkbox"
              checked={prefs.seasonalReminders}
              onChange={(e) => handleChange("seasonalReminders", e.target.checked)}
              data-testid="settings-seasonal-checkbox"
              style={{ width: 20, height: 20 }}
            />
            <div>
              <strong>Seasonal Reminders</strong>
              <p style={{ margin: "4px 0 0", opacity: 0.7, fontSize: 14 }}>
                Remind me about seasonal maintenance
              </p>
            </div>
          </label>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16, marginTop: 8 }}>
          <button
            className="button"
            data-testid="settings-save-button"
            onClick={handleSave}
            style={{ padding: "12px 24px" }}
          >
            {saved ? "✓ Saved" : "Save Settings"}
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 8,
        }}
      >
        <h3 style={{ margin: "0 0 12px" }}>About</h3>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Car Diagnostics App v1.0
          <br />
          Local-first architecture with sync-ready design.
          <br />
          All data is stored locally on your device.
        </p>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: "rgba(255,100,100,0.1)",
          borderRadius: 8,
        }}
      >
        <h3 style={{ margin: "0 0 12px", color: "#ff6b6b" }}>Data Management</h3>
        <p style={{ margin: "0 0 12px", opacity: 0.8 }}>
          Clear all local data. This will remove all vehicles, notes, maintenance records, and saved
          diagnostics.
        </p>
        <button
          className="button"
          onClick={() => {
            if (
              confirm(
                "Are you sure you want to clear all data? This action cannot be undone."
              )
            ) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          style={{ background: "rgba(255,100,100,0.2)" }}
          data-testid="clear-data-button"
        >
          Clear All Data
        </button>
      </div>
    </section>
  );
}
