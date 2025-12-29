/**
 * /src/diagnostics/commonlyMistakenFor.ts
 * DOMAIN DEFINITIONS — STATIC
 *
 * Rules:
 * - Declarative content only.
 * - Explain common false overlaps between hypothesis families.
 * - No logic, no scoring, no safety rules, no measurements.
 * - Content is used for context in results, not decision-making.
 */

export type CommonlyMistakenFor = {
  /** Stable key for export/render. */
  id: string;
  /** UI section title. */
  title: string;
  /** Mechanic-friendly explanation (symptom-based; avoid asserting a diagnosis). */
  explanation: string;
  /** Optional bullet hints. */
  hints?: string[];
  /** Related families (for UI grouping only; not used for decisions). */
  relatedFamilyIds?: string[];
};

export const COMMONLY_MISTAKEN_FOR: CommonlyMistakenFor[] = [
  {
    id: "wheel-bearings-vs-tires",
    title: "Wheel bearings vs tires",
    explanation:
      "A humming/growling noise can sound similar whether it comes from a wheel bearing or from a tire. Both may get louder with speed, and road noise can mask changes. Use symptom patterns (not assumptions) to narrow it down.",
    hints: [
      "Tire-related noise may change with road surface (smooth vs rough).",
      "Bearing-related noise may change when you gently load/unload the vehicle side-to-side (e.g., slight steering inputs).",
      "If unsure, treat the observation as low reliability and seek inspection.",
    ],
    relatedFamilyIds: ["tires_wheels", "suspension"],
  },
  {
    id: "brake-drag-vs-alignment-vs-tire-pressure",
    title: "Brake drag vs alignment vs tire pressure",
    explanation:
      "A vehicle pulling to one side can be caused by brake drag, alignment, or uneven tire pressure. These can feel similar from the driver’s seat, especially at low speeds.",
    hints: [
      "If the pull happens mainly while braking, that points more toward braking-related issues.",
      "If the pull is present during steady driving, check tire pressure and tire condition first.",
      "A noticeably hotter wheel after normal driving can be a strong drag indicator (use caution when checking heat).",
    ],
    relatedFamilyIds: ["brakes_heat_drag", "tires_wheels", "steering_hydraulic", "steering_eps"],
  },
  {
    id: "battery-vs-alternator-vs-grounds",
    title: "Battery vs alternator vs grounds",
    explanation:
      "Low-voltage symptoms can overlap between a weak battery, charging issues, and poor electrical connections (grounds). Dim lights, flickering, intermittent resets, and starting trouble can occur in multiple cases.",
    hints: [
      "Intermittent total power loss is often confused with a weak battery; it can also be connection-related.",
      "A battery/charging light can be a hint, but dash lights are usually support-only (unless safety-critical).",
      "If lights brighten with RPM, that can change suspicion between battery vs charging vs connections—but treat it as a symptom, not a diagnosis.",
    ],
    relatedFamilyIds: ["battery", "alternator", "grounds"],
  },
  {
    id: "hvac-smell-vs-exhaust-routing",
    title: "HVAC smell vs exhaust routing",
    explanation:
      "Smells that appear inside the cabin can be confusing. Some are drawn in through the HVAC intake, while others may come from outside air or exhaust routing leaks. The same smell can seem stronger depending on fan settings and driving speed.",
    hints: [
      "If a smell is mostly noticeable when the HVAC blower is on, it may be related to airflow routing (not necessarily the source).",
      "Exhaust smell in the cabin is a safety concern regardless of the suspected source.",
      "Avoid guessing the source; record the symptom patterns (fan on/off, windows open/closed, speed).",
    ],
    relatedFamilyIds: ["hvac", "exhaust"],
  },
  {
    id: "suspension-vs-tires-cupping-balance",
    title: "Suspension vs tires (cupping / balance)",
    explanation:
      "Vibration, shaking, and some noises can overlap between suspension issues and tire/wheel issues. Tire cupping, balance problems, and worn suspension components can each cause similar sensations.",
    hints: [
      "If vibration is strongly speed-related, tires/wheels often come up as a common overlap.",
      "If symptoms change more with road surface than speed, suspension/loose components can overlap.",
      "Uneven tire wear patterns can be a clue, but visual inspection can be incomplete.",
    ],
    relatedFamilyIds: ["suspension", "tires_wheels"],
  },
  {
    id: "misfire-vs-wheel-imbalance",
    title: "Engine misfire vs wheel imbalance",
    explanation:
      "A shake or vibration can be mistaken for an engine misfire when it is actually related to tires/wheels, and vice versa. Both can feel like a ‘shudder,’ especially to non-experts.",
    hints: [
      "If the vibration is present at a consistent road speed regardless of engine RPM, it can overlap more with tires/wheels.",
      "If the symptom is tied to engine load/acceleration more than road speed, it can overlap more with engine-related concerns.",
      "If unsure, treat the observation as medium/weak reliability and gather additional symptoms.",
    ],
    relatedFamilyIds: ["ignition", "fuel", "tires_wheels"],
  },
];
