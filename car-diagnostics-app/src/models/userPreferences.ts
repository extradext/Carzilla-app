/**
 * /src/models/userPreferences.ts
 * DATA CONTRACTS (backend-ready)
 */

export type UserPreferences = {
  notificationsEnabled: boolean;
  oilReminder: boolean;
  seasonalReminders: boolean;
  isPro: boolean;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  notificationsEnabled: false,
  oilReminder: false,
  seasonalReminders: false,
  isPro: false,
};
