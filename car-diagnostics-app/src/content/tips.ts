/**
 * /src/content/tips.ts
 * STATIC COPY
 * 
 * Educational tips and tricks for car diagnostics.
 * These are advisory content only - they do NOT affect diagnostic scoring.
 */

export type TipCategory = "brakes" | "electrical" | "engine" | "general" | "tires";

export interface Tip {
  id: string;
  title: string;
  body: string;
  category: TipCategory;
}

export const TIPS: Tip[] = [
  // ===== BRAKES CATEGORY =====
  {
    id: "brake_fluid_topping_off",
    title: "Should I top off brake fluid?",
    body: `Brake fluid doesn't normally drop for no reason. A lower level can happen as brake pads wear (the system holds more fluid in the calipers), but it can also mean a leak.

If you top it off without checking why it's low, you might hide a leak or cause overflow later when pads are replaced.

If it's below MIN:
1. Look for fresh wet spots where you park.
2. Check near each wheel for wetness.
3. If the pedal is soft/spongy or the warning light is on, treat it as urgent.

If you add fluid, document it in Maintenance so you can track whether it drops again.`,
    category: "brakes",
  },
  {
    id: "brake_fluid_not_consumed",
    title: "Why doesn't brake fluid 'run out' like gas?",
    body: `Unlike engine oil or washer fluid, brake fluid operates in a closed hydraulic system. It doesn't get "used up" during normal operation.

The fluid level in your reservoir may drop slightly as brake pads wear because the caliper pistons extend further out, keeping more fluid in the calipers. This is normal.

However, a sudden or significant drop usually indicates:
• A leak somewhere in the system (dangerous!)
• Recent brake work that wasn't properly refilled
• Very worn brake pads

If your brake fluid is low, don't assume it just "went somewhere." Investigate why.`,
    category: "brakes",
  },
  {
    id: "spongy_brake_pedal",
    title: "What causes a spongy brake pedal?",
    body: `A soft or spongy brake pedal usually means one of three things:

1. Air in the brake lines - Most common after brake work. Air compresses (unlike fluid), making the pedal feel soft. Solution: bleed the brakes.

2. Brake fluid leak - If fluid is escaping, there's less hydraulic pressure. Check for wet spots near wheels or under the car. This is urgent!

3. Master cylinder failure - Internal seals fail, causing the pedal to slowly sink when held. Fluid level may look normal because the leak is internal.

A spongy pedal is never normal and should be addressed promptly.`,
    category: "brakes",
  },
  {
    id: "brake_pedal_sinks",
    title: "My brake pedal slowly sinks when I hold it - is that bad?",
    body: `Yes. If your brake pedal sinks toward the floor while you hold steady pressure at a stop, this typically indicates a failing master cylinder.

The master cylinder has internal seals that can wear out. When they fail, fluid bypasses internally (pedal sinks) even though the external fluid level looks normal.

This is different from a soft/spongy pedal, which often indicates air in the lines.

A sinking pedal is a safety concern - get it inspected soon.`,
    category: "brakes",
  },
  {
    id: "grinding_brakes",
    title: "Why are my brakes grinding?",
    body: `A grinding noise when braking almost always means your brake pads are worn down to the metal backing plate.

At this point:
• The metal backing is scraping against the rotor
• Your rotors are being damaged with every stop
• Braking distances are longer
• It will only get more expensive the longer you wait

Brake pads have wear indicators (small metal tabs) that squeal when pads get low. Grinding means you're past that warning.

Get this fixed immediately - it's both a safety issue and a "fix it now or pay more later" situation.`,
    category: "brakes",
  },

  // ===== ELECTRICAL CATEGORY =====
  {
    id: "battery_vs_alternator",
    title: "How do I know if it's the battery or alternator?",
    body: `Here's a quick way to tell the difference:

BATTERY problem signs:
• Car was fine yesterday, dead today
• Jump start works but dies after days of sitting
• Battery is more than 3-4 years old
• Clicking sound when you turn the key

ALTERNATOR problem signs:
• Battery/charging warning light is on
• Dims while driving (headlights, dash)
• Battery keeps dying even when new
• Whining noise from engine bay

Quick test: Jump start the car. If it runs fine for days, battery is weak. If the warning light comes on or it dies while driving, alternator isn't charging.`,
    category: "electrical",
  },
  {
    id: "clicking_no_start",
    title: "Car clicks but won't start - what does it mean?",
    body: `The clicking sound tells you a lot:

RAPID clicking (like a machine gun):
• Battery doesn't have enough power to turn the starter
• Usually battery or connection issue
• Check for corrosion on terminals

SINGLE loud click, then nothing:
• Starter solenoid engages but motor doesn't spin
• Usually starter motor failure
• Could also be bad connection at starter

COMPLETE silence:
• No power reaching starter at all
• Check battery, fuses, ignition switch
• Could be severe battery/connection issue

Bright dashboard lights + clicking usually means the battery has some charge but not enough to crank. Dim/no lights means very low or dead battery.`,
    category: "electrical",
  },

  // ===== GENERAL CATEGORY =====
  {
    id: "check_parking_spot",
    title: "Check your parking spot regularly",
    body: `One of the easiest ways to catch problems early is to look at where you normally park. Fresh spots under your car can indicate:

• Clear/amber fluid = brake fluid or power steering fluid (urgent!)
• Green/orange/pink fluid = coolant (overheating risk)
• Dark brown/black = engine oil (monitor level)
• Red/pink = transmission fluid (if automatic)
• Water = usually just AC condensation (normal)

Get in the habit of glancing at your parking spot when you leave. A fresh wet spot that wasn't there before is worth investigating.`,
    category: "general",
  },
];
