/**
 * /src/utils/mileageAveraging.ts
 * PURE HELPER FUNCTIONS
 */

import type { MileageEntry } from "../models/maintenance";
import type { MaintenanceEvent } from "../models/maintenance";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_IN_WEEK = 7;

/**
 * Calculate rolling weekly mileage average from mileage entries.
 * Looks at entries from the last 4 weeks.
 */
export function calculateWeeklyMileageAvg(entries: MileageEntry[]): number {
  if (entries.length < 2) return 0;

  // Sort by date descending
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get entries from last 4 weeks
  const fourWeeksAgo = Date.now() - 28 * MS_PER_DAY;
  const recentEntries = sorted.filter(
    (e) => new Date(e.date).getTime() >= fourWeeksAgo
  );

  if (recentEntries.length < 2) {
    // Fall back to all entries if not enough recent data
    const oldest = sorted[sorted.length - 1];
    const newest = sorted[0];
    const daysDiff = Math.max(
      1,
      (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / MS_PER_DAY
    );
    const mileageDiff = newest.mileage - oldest.mileage;
    return Math.round((mileageDiff / daysDiff) * DAYS_IN_WEEK);
  }

  // Calculate from recent entries
  const oldest = recentEntries[recentEntries.length - 1];
  const newest = recentEntries[0];
  const daysDiff = Math.max(
    1,
    (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / MS_PER_DAY
  );
  const mileageDiff = newest.mileage - oldest.mileage;

  return Math.round((mileageDiff / daysDiff) * DAYS_IN_WEEK);
}

/**
 * Calculate miles until next oil change.
 * Assumes 5000 mile oil change interval by default.
 */
export function calculateMilesUntilOilChange(
  currentMileage: number,
  maintenanceEvents: MaintenanceEvent[],
  intervalMiles: number = 5000
): number | null {
  const oilChanges = maintenanceEvents
    .filter((e) => e.type === "oil_change")
    .sort((a, b) => b.mileage - a.mileage);

  if (oilChanges.length === 0) return null;

  const lastOilChange = oilChanges[0];
  const milesSinceLastChange = currentMileage - lastOilChange.mileage;
  const milesRemaining = intervalMiles - milesSinceLastChange;

  return Math.max(0, milesRemaining);
}

/**
 * Estimate days until next oil change based on weekly average.
 */
export function estimateDaysUntilOilChange(
  milesRemaining: number,
  weeklyMileageAvg: number
): number | null {
  if (weeklyMileageAvg <= 0) return null;

  const dailyAvg = weeklyMileageAvg / DAYS_IN_WEEK;
  return Math.round(milesRemaining / dailyAvg);
}

/**
 * Format miles remaining for display.
 */
export function formatMilesRemaining(miles: number | null): string {
  if (miles === null) return "Unknown";
  if (miles <= 0) return "Overdue!";
  return `${miles.toLocaleString()} miles`;
}

/**
 * Format days remaining for display.
 */
export function formatDaysRemaining(days: number | null): string {
  if (days === null) return "";
  if (days <= 0) return "Overdue!";
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  const weeks = Math.round(days / 7);
  if (weeks === 1) return "~1 week";
  return `~${weeks} weeks`;
}
