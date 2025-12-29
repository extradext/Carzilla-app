/**
 * /src/ui/Settings.tsx
 * PRESENTATION ONLY
 */

import React, { useState } from "react";

export function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [oilReminder, setOilReminder] = useState(false);
  const [seasonalReminders, setSeasonalReminders] = useState(false);

  return (
    <section className="card" data-testid="settings-panel">
      <h2 style={{ marginTop: 0 }} data-testid="settings-title">
        Settings (Placeholder)
      </h2>

      <div style={{ display: "grid", gap: 10 }} data-testid="settings-form">
        <label data-testid="settings-notifications-label">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            data-testid="settings-notifications-checkbox"
          />{" "}
          Notifications enabled
        </label>

        <label data-testid="settings-oil-label">
          <input
            type="checkbox"
            checked={oilReminder}
            onChange={(e) => setOilReminder(e.target.checked)}
            data-testid="settings-oil-checkbox"
          />{" "}
          Oil reminder
        </label>

        <label data-testid="settings-seasonal-label">
          <input
            type="checkbox"
            checked={seasonalReminders}
            onChange={(e) => setSeasonalReminders(e.target.checked)}
            data-testid="settings-seasonal-checkbox"
          />{" "}
          Seasonal reminders
        </label>

        <button
          className="button"
          data-testid="settings-save-button"
          onClick={() => {
            // TODO: Persist to /storage when implemented.
            // eslint-disable-next-line no-console
            console.log("TODO: save prefs", { notificationsEnabled, oilReminder, seasonalReminders });
          }}
        >
          Save (TODO)
        </button>
      </div>

      <p style={{ opacity: 0.85 }} data-testid="settings-todo">
        TODO: Backed by <code>/src/models/userPreferences.ts</code> + <code>/src/storage</code>.
      </p>
    </section>
  );
}
