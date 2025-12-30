/**
 * /src/ui/Settings.tsx
 * PRESENTATION ONLY
 *
 * Settings
 * - Notifications opt-in
 * - Seasonal reminders (tires, wipers)
 * - Oil reminders
 * - Pro status toggle (for development/testing)
 */

import React, { useState, useEffect } from "react";
import type { UserPreferences } from "../models/userPreferences";
import { getUserPreferences, saveUserPreferences } from "../storage/localStore";

type SettingsProps = {
  onPreferencesChange?: (prefs: UserPreferences) => void;
};

export function Settings({ onPreferencesChange }: SettingsProps) {
  const [prefs, setPrefs] = useState<UserPreferences>(getUserPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(getUserPreferences());
  }, []);

  const handleChange = (key: keyof UserPreferences, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaved(false);
  };

  const handleSave = () => {
    saveUserPreferences(prefs);
    onPreferencesChange?.(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="card" data-testid="settings-panel">
      <h2 style={{ marginTop: 0 }} data-testid="settings-title">
        Settings
      </h2>

      {/* Notification Settings */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Notifications</h3>
        <div style={{ display: "grid", gap: 12 }} data-testid="settings-form">
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              cursor: "pointer",
            }}
            data-testid="settings-notifications-label"
          >
            <input
              type="checkbox"
              checked={prefs.notificationsEnabled}
              onChange={(e) => handleChange("notificationsEnabled", e.target.checked)}
              style={{ width: 18, height: 18 }}
              data-testid="settings-notifications-checkbox"
            />
            <div>
              <div style={{ fontWeight: 500 }}>Enable Notifications</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Receive reminders and alerts</div>
            </div>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              cursor: "pointer",
              opacity: prefs.notificationsEnabled ? 1 : 0.5,
            }}
            data-testid="settings-oil-label"
          >
            <input
              type="checkbox"
              checked={prefs.oilReminder}
              onChange={(e) => handleChange("oilReminder", e.target.checked)}
              disabled={!prefs.notificationsEnabled}
              style={{ width: 18, height: 18 }}
              data-testid="settings-oil-checkbox"
            />
            <div>
              <div style={{ fontWeight: 500 }}>🛢️ Oil Change Reminders</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Get notified when oil change is due</div>
            </div>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              cursor: "pointer",
              opacity: prefs.notificationsEnabled ? 1 : 0.5,
            }}
            data-testid="settings-seasonal-label"
          >
            <input
              type="checkbox"
              checked={prefs.seasonalReminders}
              onChange={(e) => handleChange("seasonalReminders", e.target.checked)}
              disabled={!prefs.notificationsEnabled}
              style={{ width: 18, height: 18 }}
              data-testid="settings-seasonal-checkbox"
            />
            <div>
              <div style={{ fontWeight: 500 }}>🍃 Seasonal Reminders</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Tire changes, wiper blades, coolant checks</div>
            </div>
          </label>
        </div>
      </div>

      {/* Pro Status (for development/testing) */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Account</h3>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 12,
            background: prefs.isPro ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
            border: prefs.isPro ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
            borderRadius: 8,
            cursor: "pointer",
          }}
          data-testid="settings-pro-label"
        >
          <input
            type="checkbox"
            checked={prefs.isPro}
            onChange={(e) => handleChange("isPro", e.target.checked)}
            style={{ width: 18, height: 18 }}
            data-testid="settings-pro-checkbox"
          />
          <div>
            <div style={{ fontWeight: 500 }}>
              ⚡ Pro Features {prefs.isPro && <span className="badge" style={{ marginLeft: 8, fontSize: 10 }}>Active</span>}
            </div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              Enable Pro features like weight reduction for known-good components
            </div>
          </div>
        </label>
        <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
          Note: This toggle is for testing purposes. In production, Pro status would be managed via subscription.
        </p>
      </div>

      {/* Save Button */}
      <div className="row" style={{ alignItems: "center", gap: 12 }}>
        <button
          className="button"
          onClick={handleSave}
          style={{ padding: "12px 24px" }}
          data-testid="settings-save-button"
        >
          Save Settings
        </button>
        {saved && (
          <span style={{ color: "#22c55e", fontSize: 14 }} data-testid="settings-saved">
            ✓ Saved
          </span>
        )}
      </div>
    </section>
  );
}
