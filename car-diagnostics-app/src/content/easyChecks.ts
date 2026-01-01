/**
 * /src/content/easyChecks.ts
 * CONTENT-ONLY DATA FILE
 * 
 * "Easy checks before replacing parts" - informational content for Results screen.
 * 
 * PURPOSE:
 * - Cheap, fast, low-risk checks often overlooked
 * - Supportive information only (never primary causes)
 * - Honorable mentions, not diagnoses
 * 
 * RULES:
 * - NO logic in this file
 * - NO imports from engine/core/diagnostics
 * - Does NOT affect scoring or diagnosis
 * - Content safe for non-mechanics
 */

export interface EasyCheckCategory {
  title: string;
  items: string[];
  note?: string;
}

/**
 * Easy checks organized by system/category.
 * These are general maintenance items that can improve symptoms
 * even when they are not the root cause.
 */
export const EASY_CHECKS: Record<string, EasyCheckCategory> = {
  // ===== ENGINE / AIR INTAKE =====
  air_intake_sanity: {
    title: "Quick air intake checks",
    items: [
      "Inspect air filter for blockage, dirt buildup, or collapse",
      "Check for disconnected or cracked vacuum hoses",
      "Look for debris in the throttle body opening (carbon buildup causes rough idle)",
      "If equipped, check PCV valve for sticking (should rattle when shaken)",
    ],
    note: "These checks are inexpensive and often improve drivability symptoms even when they are not the root cause.",
  },

  // ===== FUEL SYSTEM =====
  fuel_sanity: {
    title: "Basic fuel system checks",
    items: [
      "Confirm you have fuel - gauge may be inaccurate",
      "Try a different gas station if you just filled up (bad fuel happens)",
      "Check for fuel smell around the engine bay (leaking injector/line)",
      "Listen for fuel pump prime (2-3 second hum) when turning key to ON",
    ],
    note: "Fuel delivery issues are common but often simple to verify before replacing expensive parts.",
  },

  // ===== ELECTRICAL / BATTERY =====
  electrical_sanity: {
    title: "Quick electrical checks",
    items: [
      "Clean battery terminals - corrosion causes many intermittent issues",
      "Check that battery hold-down clamp is secure",
      "Wiggle battery cables at both ends while someone tries to start",
      "Look for green corrosion on ground connections at the body/frame",
    ],
    note: "Most 'electrical gremlins' are actually connection issues, not failed components.",
  },

  // ===== BRAKES =====
  brake_sanity: {
    title: "Basic brake sanity checks",
    items: [
      "Check brake fluid level - fluid does not get 'used up' like gas",
      "If fluid is low, inspect for leaks or worn pads before topping off",
      "Look for fluid spots where the car is usually parked",
      "Check if parking brake is fully released",
    ],
    note: "Low brake fluid indicates a reason (worn pads or leak), not normal consumption.",
  },

  // ===== COOLING SYSTEM =====
  cooling_sanity: {
    title: "Quick cooling system checks",
    items: [
      "Check coolant level in overflow reservoir (NOT the radiator cap when hot)",
      "Look for crusty white/green residue around hoses - indicates slow leak",
      "Feel radiator hoses when warm - should be firm, not spongy or hard/brittle",
      "Check for coolant smell (sweet) inside cabin - may indicate heater core leak",
    ],
    note: "Coolant doesn't evaporate. If it's low, it's going somewhere.",
  },

  // ===== TIRES / WHEELS =====
  tire_sanity: {
    title: "Quick tire and wheel checks",
    items: [
      "Check all four tire pressures with a gauge (visual inspection is unreliable)",
      "Look for nails, screws, or objects embedded in tread",
      "Check for uneven wear patterns (indicates alignment or suspension issues)",
      "Inspect valve stems for cracks (common on older tires)",
    ],
    note: "Tire pressure affects handling, braking, and fuel economy more than most people realize.",
  },

  // ===== FLUIDS / GENERAL =====
  fluid_sanity: {
    title: "General fluid checks",
    items: [
      "Check oil level - low oil causes many engine issues",
      "Check power steering fluid if steering feels heavy",
      "Look under the car where you normally park for any new wet spots",
      "Check windshield washer fluid if wipers smear instead of clean",
    ],
    note: "A 5-minute fluid check can prevent expensive repairs.",
  },

  // ===== BELTS / HOSES =====
  belt_hose_sanity: {
    title: "Belt and hose inspection",
    items: [
      "Look for cracks, fraying, or glazing on serpentine belt",
      "Check belt tension - should deflect about 1/2 inch when pressed",
      "Inspect coolant hoses for bulges, soft spots, or cracks",
      "Check for oil or coolant residue on belts (causes slipping)",
    ],
    note: "A failed belt or hose can leave you stranded. Prevention is cheap.",
  },
};

/**
 * Get all easy check categories as an array for rendering.
 * Returns entries sorted by a logical inspection order.
 */
export function getEasyChecksArray(): Array<{ id: string } & EasyCheckCategory> {
  const order = [
    "electrical_sanity",
    "fluid_sanity",
    "fuel_sanity",
    "air_intake_sanity",
    "cooling_sanity",
    "brake_sanity",
    "tire_sanity",
    "belt_hose_sanity",
  ];
  
  return order
    .filter(id => id in EASY_CHECKS)
    .map(id => ({ id, ...EASY_CHECKS[id] }));
}
