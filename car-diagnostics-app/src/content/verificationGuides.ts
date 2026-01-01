/**
 * /src/content/verificationGuides.ts
 * CONTENT-ONLY DATA FILE
 * 
 * Provides "How to check / verify this" guides for diagnosed components.
 * Keyed by componentId (matches engine refinement output).
 * 
 * RULES:
 * - NO logic, NO imports from engine
 * - Safe, observable checks ONLY (no specialized tools unless stated)
 * - Suitable for non-mechanic users
 * 
 * TODO: Add images/video links in future iteration
 */

export interface VerificationGuide {
  /** Brief description of what the part does */
  description: string;
  /** Safe, observable verification steps */
  checks: string[];
  /** Optional warnings or cautions */
  notes?: string;
  /** TODO: Future - image URLs or video links */
  // mediaUrls?: string[];
}

/**
 * Verification guides keyed by componentId
 * Component IDs must match those used in engine refinement output
 */
export const VERIFICATION_GUIDES: Record<string, VerificationGuide> = {
  // ===== STARTING / ELECTRICAL =====
  starter_motor: {
    description: "The starter motor cranks the engine when you turn the key. It's a heavy-duty electric motor mounted to the transmission bellhousing.",
    checks: [
      "Listen for a single loud click from the engine bay when turning the key - this indicates the solenoid engages but the motor doesn't spin",
      "Have someone turn the key while you listen near the starter location (lower engine, where engine meets transmission)",
      "Check if dashboard lights stay bright during start attempt - if yes, battery is likely fine and starter is suspect",
      "Try starting multiple times - if it occasionally works, the starter may be failing intermittently",
      "Look for any visible damage or loose wires at the starter (if accessible)"
    ],
    notes: "Do NOT attempt to tap or hit the starter yourself unless you're experienced. The starter is near hot engine components and moving parts."
  },

  starter_solenoid: {
    description: "The starter solenoid is an electromagnetic switch that engages the starter motor. It's usually mounted on or near the starter itself.",
    checks: [
      "Listen for a click sound when turning the key - a click without cranking suggests solenoid engages but doesn't make full contact",
      "Try turning the key multiple times - intermittent starting often indicates a failing solenoid",
      "Check if the clicking is coming from the starter area vs the fuse box (relay clicks come from fuse box)",
      "Verify battery connections are clean and tight - poor connections can mimic solenoid issues"
    ],
    notes: "The solenoid is often replaced as a unit with the starter motor."
  },

  battery_terminals: {
    description: "Battery terminals are the connection points where cables attach to the battery. Corrosion or looseness here can cause starting and electrical problems.",
    checks: [
      "Open the hood and locate the battery (usually in engine bay, sometimes in trunk)",
      "Look for white, green, or blue crusty buildup on the terminals - this is corrosion",
      "Check if terminals feel loose - try to wiggle them gently (with engine off)",
      "Look at the cable ends for damage or green discoloration",
      "Check if the hold-down clamp is secure - a loose battery can cause terminal damage"
    ],
    notes: "If cleaning terminals, disconnect negative (-) first, then positive (+). Reconnect in reverse order. Wear gloves and eye protection."
  },

  battery_cables: {
    description: "Battery cables carry power from the battery to the starter and electrical system. Internal corrosion can cause intermittent issues.",
    checks: [
      "Trace the cables from battery to their endpoints - look for cuts, fraying, or damage",
      "Check cable ends at both the battery and where they connect to the body/engine",
      "Look for swelling or bulging in the cable insulation - indicates internal damage",
      "Feel cables (engine off, key out) - they should be firm, not spongy",
      "Check ground cable connection to engine block or frame - often corroded"
    ],
    notes: "Internal cable corrosion isn't always visible. If cables are original and vehicle is 10+ years old, consider replacement if other tests pass."
  },

  battery_dead_cell: {
    description: "Car batteries have 6 internal cells. If one fails, the battery can't hold a proper charge even though it may test 'okay' sometimes.",
    checks: [
      "Check battery age - most batteries last 3-5 years. Date code is often on a sticker or stamped on case",
      "Look at battery case for bulging or swelling - indicates internal damage",
      "Note if the car starts fine after driving but struggles after sitting overnight",
      "Check if headlights dim noticeably when starting - suggests weak battery",
      "Take battery to auto parts store for free load testing - this is the definitive test"
    ],
    notes: "A battery can show 12.6V (full charge) and still fail under load if a cell is dead. Load testing is the only reliable way to confirm."
  },

  ground_strap: {
    description: "The ground strap provides the electrical return path from the engine to the chassis/battery. A bad ground causes erratic electrical behavior.",
    checks: [
      "Locate the ground strap - usually a braided cable from engine block to firewall or frame",
      "Check connection points at both ends for corrosion, rust, or looseness",
      "Look for frayed or broken strands in the braided cable",
      "Check if the mounting bolts are tight and making good contact",
      "Look for paint or rust under the mounting point - ground needs bare metal contact"
    ],
    notes: "Ground issues can be tricky. Multiple ground paths exist. If one is bad, adding a supplemental ground strap often solves the problem."
  },

  alternator_not_charging: {
    description: "The alternator charges the battery while the engine runs. If it fails, the car runs on battery power until depleted.",
    checks: [
      "Check if battery/charging warning light was illuminated while driving",
      "Listen for whining or grinding noise from the front of the engine (alternator area)",
      "Check serpentine belt condition - cracked, glazed, or loose belt won't spin alternator properly",
      "With engine running, check if headlights dim at idle and brighten when revving - suggests charging issue",
      "Take to auto parts store for free alternator testing (usually done in parking lot)"
    ],
    notes: "Don't disconnect the battery while running to 'test' the alternator - this can damage electronics on modern vehicles."
  },

  // ===== BRAKES =====
  brake_pads: {
    description: "Brake pads are friction material that press against rotors to slow the car. They wear down over time and must be replaced.",
    checks: [
      "Listen for high-pitched squealing when braking - wear indicators make this sound when pads are low",
      "Listen for metal grinding sound - indicates pads are worn through and metal is contacting rotor",
      "Look through wheel spokes at the brake assembly - pad material should be at least 3-4mm thick",
      "Check if brake dust on wheels has changed from gray to more metallic/shiny - indicates metal-on-metal",
      "Note if braking distance has increased or pedal travel has changed"
    ],
    notes: "Grinding noise means pads are completely worn and rotors are being damaged. Drive minimally and get this fixed immediately."
  },

  brake_rotors: {
    description: "Brake rotors are the metal discs that brake pads clamp onto. They can warp from heat or wear unevenly.",
    checks: [
      "Feel for pulsation/vibration in the brake pedal when stopping - indicates warped rotors",
      "Feel for pulsation in the steering wheel when braking (front rotors)",
      "Look at rotor surface through wheel spokes - check for deep grooves, scoring, or blue discoloration (heat damage)",
      "Run your finger across rotor surface (when cool and car secured) - should feel relatively smooth",
      "Check for lip at edge of rotor - indicates significant wear"
    ],
    notes: "Some minor grooves are normal. Rotors can sometimes be 'turned' (resurfaced) rather than replaced if thick enough."
  },

  brake_caliper: {
    description: "The brake caliper houses the pads and uses hydraulic pressure to squeeze them against the rotor. A sticking caliper causes drag and uneven braking.",
    checks: [
      "After driving, carefully feel each wheel (don't touch center) - one significantly hotter than others indicates sticking caliper",
      "Check if car pulls to one side when braking - pulls toward the side with more braking force",
      "Look for uneven pad wear between left and right sides",
      "Check for brake fluid wetness around the caliper body",
      "Note if you smell burning from one wheel area after driving"
    ],
    notes: "Hot wheels after driving can also indicate stuck parking brake. Try this test after driving without using parking brake."
  },

  brake_fluid: {
    description: "Brake fluid transmits pedal pressure to the calipers. Low fluid, air bubbles, or moisture contamination affects braking performance.",
    checks: [
      "Check fluid level in reservoir (under hood, near firewall) - should be between MIN and MAX",
      "Check fluid color - should be clear to light amber. Dark brown or black means it needs replacement",
      "Note if pedal feels spongy or soft - may indicate air in lines",
      "Check for wet spots at master cylinder (attached to brake booster on firewall)",
      "Check usual parking spot for fluid drips"
    ],
    notes: "Brake fluid absorbs moisture over time, lowering its boiling point. Even if level is fine, fluid should be flushed every 2-3 years."
  },

  brake_fluid_leak: {
    description: "A brake fluid leak means hydraulic fluid is escaping from somewhere in the brake system. This is serious - it leads to brake failure.",
    checks: [
      "Check brake fluid reservoir level - is it dropping?",
      "Look under the car where you normally park for wet spots (brake fluid is clear/amber)",
      "Inspect around each wheel's brake assembly for wetness or staining",
      "Check master cylinder (under hood, at firewall) for external wetness",
      "Trace brake lines along undercarriage for wet spots or damage"
    ],
    notes: "A brake fluid leak is a safety-critical issue. If level drops quickly or you see active leaking, do not drive. Have it towed."
  },

  brake_fluid_leak_caliper_hose: {
    description: "Brake fluid is leaking at or near a wheel, typically from a flex hose, caliper seal, or wheel cylinder.",
    checks: [
      "Look at the inner side of each wheel/tire for wet staining",
      "Inspect the rubber flex hose that connects to the caliper - look for cracks, bulges, or wetness at fittings",
      "Check the caliper body for external fluid weeping",
      "Look at hard brake lines near the wheel for corrosion or damage",
      "If drum brakes (rear), check for wetness at the backing plate"
    ],
    notes: "Brake hoses deteriorate from the inside. Age (rubber gets brittle) and road damage are common causes. Replace in pairs for even braking."
  },

  master_cylinder_internal: {
    description: "The master cylinder converts pedal pressure into hydraulic pressure. Internal seal failure causes the pedal to slowly sink without external leakage.",
    checks: [
      "With car running, press brake pedal firmly and hold at a stop - does it slowly sink toward the floor?",
      "Check brake fluid level - may be normal since leak is internal",
      "Look at back of master cylinder (toward firewall) for external wetness",
      "Note if pedal feels different when first pressed vs after holding",
      "Pump pedal several times, then hold firm - sinking after pump indicates internal bypass"
    ],
    notes: "Internal master cylinder failure is not visible externally. The 'sink test' is the primary way to identify this issue."
  },

  air_in_brake_lines: {
    description: "Air bubbles in the brake hydraulic system compress (unlike fluid), causing a soft, spongy pedal feel.",
    checks: [
      "Press brake pedal - does it feel soft or spongy instead of firm?",
      "Pump pedal several times - does it feel firmer after pumping? (Air compressing then recovering)",
      "Check if pedal travel has increased (goes down further than before)",
      "Confirm brake work was done recently - air entry usually happens during service",
      "Check fluid level - air can enter if reservoir ran dry"
    ],
    notes: "Bleeding brakes removes air from the system. Start from the wheel furthest from master cylinder. Some ABS systems require special procedures."
  },

  // ===== WHEELS / TIRES =====
  wheel_bearing: {
    description: "Wheel bearings allow the wheel to spin smoothly on the axle. When they fail, they create noise and can eventually cause wheel separation.",
    checks: [
      "Listen for humming, growling, or rumbling that increases with speed - bearing noise is speed-dependent",
      "Note if the noise changes when turning - bearing noise often gets louder when turning away from the bad side",
      "Jack up the wheel (safely on stands), grab at 12 and 6 o'clock, push/pull to check for play",
      "Spin the wheel by hand while listening for roughness or grinding",
      "Check for heat at wheel hub center after driving - bearing failure generates heat"
    ],
    notes: "Wheel bearing failure is progressive. Noise may come and go initially. Don't ignore it - severe failure can cause wheel separation."
  },

  tire_pressure_low: {
    description: "Low tire pressure affects handling, increases tire wear, reduces fuel economy, and can lead to tire failure.",
    checks: [
      "Use a tire pressure gauge on each tire - compare to placard on driver door jamb",
      "Look at tire sidewalls - bulging or unusual flex indicates low pressure",
      "Check if TPMS light is illuminated on dashboard",
      "Compare how far the tire 'squishes' at the contact patch between tires",
      "Check for obvious damage, nails, or punctures in the tire"
    ],
    notes: "Check pressure when tires are cold (haven't driven more than a mile). Driving heats tires and increases pressure reading by 3-5 PSI."
  },

  tire_slow_leak: {
    description: "A slow leak causes gradual pressure loss. Common causes are nail punctures, valve stem issues, or bead seal problems.",
    checks: [
      "Inflate tire to proper pressure, mark it, and check again in 24-48 hours",
      "Mix soapy water and apply to tire surface, valve stem, and bead area - watch for bubbles",
      "Inspect tread carefully for embedded nails, screws, or glass",
      "Check valve stem for cracks or damage - press valve core and listen for hissing",
      "Look for damage at the tire bead (where tire meets rim)"
    ],
    notes: "A slow leak from a nail can often be repaired if it's in the tread area. Sidewall damage usually means tire replacement."
  },

  valve_stem: {
    description: "The valve stem is where you add air. It can crack, leak at the core, or corrode where it meets the wheel.",
    checks: [
      "Apply soapy water to the valve stem - bubbles indicate a leak",
      "Check valve cap is present and seals properly - missing caps let dirt in",
      "Look for cracks in rubber valve stems (common on older tires)",
      "Press the valve core briefly - should release air and seal immediately when released",
      "Check where stem meets the rim for corrosion (especially on alloy wheels)"
    ],
    notes: "Valve stems should be replaced when getting new tires. TPMS-equipped vehicles have sensor valve stems that cost more to replace."
  },

  // ===== SUSPENSION =====
  struts_shocks: {
    description: "Struts and shocks dampen suspension movement. When worn, the car bounces excessively and handling suffers.",
    checks: [
      "Push down firmly on each corner of the car and release - it should bounce once and settle. Multiple bounces indicate worn dampers",
      "Look at strut/shock bodies for oil leaking - wet or oily appearance indicates failure",
      "Check for uneven tire wear - worn struts cause cupping/scalloping pattern",
      "Note if car nose-dives excessively when braking or squats when accelerating",
      "Listen for clunking or knocking over bumps"
    ],
    notes: "Replace struts/shocks in pairs (both fronts or both rears) for balanced handling. Worn struts also accelerate tire wear."
  },

  control_arm_bushings: {
    description: "Control arm bushings are rubber mounts that allow controlled movement while absorbing vibration. When worn, they cause clunks and poor alignment.",
    checks: [
      "Listen for clunking or knocking when going over bumps, especially at low speeds",
      "Look at bushings for cracks, tears, or separation of rubber from metal",
      "Check if rubber looks dry, cracked, or is missing chunks",
      "Note if alignment goes bad frequently - worn bushings prevent proper alignment",
      "Have someone rock the car while you look for excessive movement in the bushings"
    ],
    notes: "Bushing replacement often requires a press. Some control arms are replaced as a unit with bushings pre-installed."
  },

  sway_bar_links: {
    description: "Sway bar links connect the sway bar to the suspension. They reduce body roll in turns but can wear out and make noise.",
    checks: [
      "Listen for rattling or clunking, especially when turning or going over uneven surfaces",
      "Have someone rock the car side-to-side while you watch the links for play",
      "Check link ends for torn boots or loose ball joints",
      "Grab the link and try to move it - excessive play indicates wear",
      "Look for rust or damage on the links themselves"
    ],
    notes: "Sway bar links are relatively inexpensive and easy to replace. They're often replaced in pairs."
  },

  // ===== STEERING =====
  tie_rod_ends: {
    description: "Tie rod ends connect the steering rack to the wheels. They allow the wheels to pivot while transmitting steering input.",
    checks: [
      "Look for uneven tire wear, especially on the inner or outer edges",
      "Jack up the front and grab the tire at 3 and 9 o'clock - try to wiggle. Play indicates worn tie rods",
      "Check tie rod boots for tears - torn boots allow grease out and dirt in",
      "Have someone turn the steering wheel while you watch tie rod ends for play",
      "Listen for clicking or popping when turning the steering wheel"
    ],
    notes: "After tie rod replacement, an alignment is required. Inner and outer tie rod ends are different parts."
  },

  power_steering_pump: {
    description: "The power steering pump provides hydraulic pressure for power assist. When failing, steering becomes heavy and the pump may whine.",
    checks: [
      "Check power steering fluid level - low fluid can cause pump damage and noise",
      "Listen for whining noise that changes when turning the wheel - pump noise is speed and load dependent",
      "Note if steering feels heavy, especially at low speeds or when parking",
      "Check for fluid leaks around the pump and hoses",
      "Look at fluid color - should be clear/red, not dark brown or foamy"
    ],
    notes: "Running a power steering pump dry will damage it quickly. Always check fluid level first if steering issues arise."
  },

  steering_rack: {
    description: "The steering rack converts steering wheel rotation into side-to-side movement of the wheels. Leaks or wear cause poor steering feel.",
    checks: [
      "Look for fluid drips or wetness on the steering rack boots (accordion-like covers at each end)",
      "Check power steering fluid level - a dropping level with no visible pump leak may indicate rack leak",
      "Feel for excessive play in the steering wheel (movement before wheels respond)",
      "Listen for clunking from the front when turning wheel at a stop",
      "Note if steering feels loose or vague at highway speeds"
    ],
    notes: "Rack leaks often show at the boots because fluid travels inside them before dripping. Rack replacement is labor-intensive."
  },

  // ===== DRIVETRAIN =====
  cv_axle: {
    description: "CV (constant velocity) axles transfer power from the transmission to the wheels while allowing for suspension movement and steering.",
    checks: [
      "Listen for clicking or popping when turning sharply, especially during acceleration",
      "Look at CV boots (rubber covers at each end of axle) for tears, cracks, or grease splatter",
      "Check inside of wheels for grease thrown from a torn boot",
      "Note if clicking happens only in one direction of turn",
      "Check for vibration that changes with speed - can indicate CV joint wear"
    ],
    notes: "A torn boot lets grease out and dirt in, destroying the joint. Caught early, just the boot can be replaced. Once clicking, the whole axle typically needs replacement."
  },

  // ===== HVAC =====
  blower_motor: {
    description: "The blower motor pushes air through the vents for heating and cooling. When failing, it may make noise, run intermittently, or stop working.",
    checks: [
      "Turn on fan at different speeds - does it work on all settings?",
      "Listen for squealing, grinding, or rattling from behind the dashboard",
      "Note if the motor only works on high (often indicates resistor failure, not motor)",
      "Feel for airflow at vents - weak airflow at all speeds suggests motor issue",
      "Check if the noise changes when you tap on the dashboard near the glovebox"
    ],
    notes: "If only high speed works, the blower resistor (not the motor) is usually the problem. Much cheaper and easier to replace."
  },

  cabin_air_filter: {
    description: "The cabin air filter cleans air entering through the vents. When clogged, it reduces airflow and can cause odors.",
    checks: [
      "Check if airflow from vents is weaker than normal, even with fan on high",
      "Note any musty or unpleasant smell when HVAC runs",
      "Locate and remove the filter (usually behind glovebox or under hood) - check for dirt buildup",
      "Look for debris, leaves, or excessive dust on the filter surface",
      "Check if filter has been replaced according to maintenance schedule (typically every 15-30k miles)"
    ],
    notes: "Cabin air filter replacement is usually a DIY-friendly task. Check your owner's manual for location and procedure."
  },

  heater_core: {
    description: "The heater core is a small radiator inside the dashboard that provides cabin heat using engine coolant.",
    checks: [
      "Check if heat works - cold air from vents when heat is on suggests heater core issue",
      "Look for fogging on inside of windshield - leaking heater core puts moisture in cabin air",
      "Check for sweet smell (coolant) inside the cabin",
      "Look for wet carpet on passenger side floor - common leak location",
      "Check engine coolant level - unexplained drops may indicate heater core leak"
    ],
    notes: "Heater core replacement is labor-intensive as it's buried in the dashboard. Some bypass it temporarily if leak is found."
  },

  thermostat: {
    description: "The thermostat regulates engine coolant flow to maintain operating temperature. When stuck, it causes overheating or no heat.",
    checks: [
      "Check if engine takes too long to warm up or never reaches normal temperature",
      "Note if temperature gauge fluctuates erratically",
      "Check if heater output is weak or cold even after engine warms up",
      "Look for overheating issues, especially in traffic (thermostat stuck closed)",
      "With cold engine, start it and feel upper radiator hose - should stay cool until thermostat opens"
    ],
    notes: "A stuck-closed thermostat causes overheating. Stuck-open causes slow warmup and poor heater output. Thermostats are relatively cheap and often replaced as preventive maintenance."
  },
};

/**
 * Helper to check if a guide exists for a component
 * @param componentId - The component ID from diagnostic result
 * @returns boolean indicating if guide is available
 */
export function hasVerificationGuide(componentId: string | undefined): boolean {
  if (!componentId) return false;
  return componentId in VERIFICATION_GUIDES;
}

/**
 * Get verification guide for a component
 * @param componentId - The component ID from diagnostic result
 * @returns VerificationGuide or undefined if not found
 */
export function getVerificationGuide(componentId: string | undefined): VerificationGuide | undefined {
  if (!componentId) return undefined;
  return VERIFICATION_GUIDES[componentId];
}
