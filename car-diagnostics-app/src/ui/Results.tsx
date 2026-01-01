/**
 * /src/ui/Results.tsx
 * PRESENTATION ONLY
 * 
 * Results screen shows:
 * - Top hypothesis with detailed description
 * - Secondary possibility
 * - Confidence band
 * - Supporting engine signals
 * - Garage Integration (references notes/maintenance)
 * - Save to Garage / Export options
 * - "I think it's something else" button (Pro: re-run excluding)
 */

import React, { useState, useEffect } from "react";
import type { DiagnosticResult } from "../models/diagnosticResult";
import type { Vehicle } from "../models/vehicle";
import type { GarageNote } from "../models/garageNote";
import type { MaintenanceEvent } from "../models/maintenance";
import {
  saveDiagnosticResult,
  getGarageNotes,
  getMaintenanceEvents,
  getActiveVehicle,
  isProEnabled,
} from "../storage/localStore";
import { exportDiagnosticPayload, createFeedbackPayload } from "../utils/export";
import { HYPOTHESIS_FAMILY_LABELS, type HypothesisFamilyId } from "../diagnostics/hypothesisFamilies";

// Detailed hypothesis information with descriptions and related possibilities
type HypothesisInfo = {
  title: string;
  description: string;
  commonCauses: string[];
  whatToCheck: string[];
  relatedTo: string[]; // Related hypothesis family IDs
};

const HYPOTHESIS_DETAILS: Record<string, HypothesisInfo> = {
  battery: {
    title: "Battery / Charging System Issue",
    description: "Your battery may be weak, discharged, or failing. This affects the vehicle's ability to crank the engine and power electrical systems.",
    commonCauses: [
      "Battery is old (3+ years) and losing capacity",
      "Battery was drained from lights left on or parasitic draw",
      "Corroded or loose battery terminals",
      "Battery cells have failed internally"
    ],
    whatToCheck: [
      "Check battery age and condition",
      "Inspect terminals for corrosion or looseness",
      "Test battery voltage (should be 12.4-12.7V when off)",
      "Have battery load-tested at an auto parts store"
    ],
    relatedTo: ["alternator", "grounds"]
  },
  alternator: {
    title: "Alternator / Charging System Failure",
    description: "Your alternator may not be properly charging the battery while driving. This can lead to a dead battery and electrical issues.",
    commonCauses: [
      "Worn alternator brushes or bearings",
      "Failed voltage regulator",
      "Broken or slipping serpentine belt",
      "Damaged alternator diodes"
    ],
    whatToCheck: [
      "Check if battery light was on while driving",
      "Test alternator output (should be 13.5-14.5V while running)",
      "Inspect serpentine belt condition and tension",
      "Listen for grinding or whining from alternator area"
    ],
    relatedTo: ["battery", "grounds"]
  },
  grounds: {
    title: "Electrical Ground / Connection Problem",
    description: "There may be a poor electrical ground connection or corroded wiring preventing proper current flow. This can cause intermittent starting issues, clicking sounds, and erratic electrical behavior.",
    commonCauses: [
      "Corroded ground strap between engine and chassis",
      "Loose or corroded battery ground cable",
      "Starter motor connection issues",
      "Faulty starter solenoid or relay"
    ],
    whatToCheck: [
      "Inspect battery cables for corrosion or damage",
      "Check engine-to-chassis ground strap",
      "Look for loose connections at starter motor",
      "Test starter relay operation"
    ],
    relatedTo: ["battery", "starter"]
  },
  fuel: {
    title: "Fuel Delivery Problem",
    description: "The engine may not be receiving adequate fuel. This can cause hard starting, stalling, or loss of power.",
    commonCauses: [
      "Clogged fuel filter restricting flow",
      "Failing fuel pump not providing enough pressure",
      "Clogged or leaking fuel injectors",
      "Fuel pressure regulator failure"
    ],
    whatToCheck: [
      "Listen for fuel pump prime when turning key to ON",
      "Check fuel pressure at the rail",
      "Inspect for fuel leaks around engine",
      "Check when fuel filter was last replaced"
    ],
    relatedTo: ["ignition"]
  },
  ignition: {
    title: "Ignition System Issue",
    description: "The spark delivery system may be compromised, preventing proper combustion. This causes misfires, rough running, and starting difficulties.",
    commonCauses: [
      "Worn or fouled spark plugs",
      "Failed ignition coil(s)",
      "Damaged spark plug wires or boots",
      "Crankshaft or camshaft position sensor failure"
    ],
    whatToCheck: [
      "Inspect spark plugs for wear or deposits",
      "Check for spark at plug wires",
      "Scan for ignition-related trouble codes",
      "Test ignition coil resistance"
    ],
    relatedTo: ["fuel"]
  },
  brakes_heat_drag: {
    title: "Brake System Issue",
    description: "There may be a problem with your brake system causing reduced stopping power, noise, or uneven braking.",
    commonCauses: [
      "Worn brake pads or shoes",
      "Warped or worn brake rotors",
      "Sticking brake caliper causing drag",
      "Air in brake hydraulic lines",
      "Low or contaminated brake fluid"
    ],
    whatToCheck: [
      "Visually inspect brake pad thickness",
      "Check for rotor scoring or warping",
      "Feel for hot wheels after driving (indicates drag)",
      "Check brake fluid level and color"
    ],
    relatedTo: ["tires_wheels"]
  },
  tires_wheels: {
    title: "Tire or Wheel Problem",
    description: "There may be an issue with your tires or wheels causing vibration, pulling, or uneven wear.",
    commonCauses: [
      "Unbalanced wheels causing vibration",
      "Worn or damaged tires",
      "Wheel bearing failure",
      "Bent wheel rim"
    ],
    whatToCheck: [
      "Inspect tires for uneven wear patterns",
      "Check tire pressure in all four tires",
      "Look for bulges or damage on tire sidewalls",
      "Have wheel balance checked"
    ],
    relatedTo: ["suspension", "brakes_heat_drag"]
  },
  suspension: {
    title: "Suspension Component Failure",
    description: "A suspension component may be worn or damaged, causing noise over bumps, poor handling, or uneven tire wear.",
    commonCauses: [
      "Worn struts or shocks",
      "Damaged control arm bushings",
      "Failed ball joints or tie rod ends",
      "Broken sway bar links"
    ],
    whatToCheck: [
      "Bounce test: push down on each corner, should rebound once",
      "Listen for clunks when going over bumps",
      "Check for oil leaking from struts/shocks",
      "Inspect for torn rubber boots on joints"
    ],
    relatedTo: ["tires_wheels", "steering_hydraulic"]
  },
  steering_hydraulic: {
    title: "Power Steering Problem",
    description: "Your power steering system may have a leak, low fluid, or failing pump causing heavy steering feel or noise.",
    commonCauses: [
      "Low power steering fluid",
      "Power steering pump failure",
      "Leaking steering rack or lines",
      "Worn steering components"
    ],
    whatToCheck: [
      "Check power steering fluid level",
      "Look for fluid leaks under vehicle",
      "Listen for whining when turning wheel",
      "Feel for play in steering wheel"
    ],
    relatedTo: ["steering_eps", "suspension"]
  },
  steering_eps: {
    title: "Electric Power Steering Issue",
    description: "Your electric power steering system may have a fault. This can cause heavy steering, warning lights, or complete loss of power assist.",
    commonCauses: [
      "EPS motor failure",
      "Steering angle sensor malfunction",
      "Electrical connection issues",
      "EPS control module fault"
    ],
    whatToCheck: [
      "Check for steering warning light on dashboard",
      "Scan for EPS-related trouble codes",
      "Check battery voltage (EPS sensitive to voltage)",
      "Inspect steering column connections"
    ],
    relatedTo: ["steering_hydraulic", "grounds"]
  },
  hvac: {
    title: "Climate Control / HVAC Problem",
    description: "Your heating, ventilation, or air conditioning system has an issue affecting cabin comfort.",
    commonCauses: [
      "Low refrigerant in AC system",
      "Clogged cabin air filter",
      "Failed blower motor or resistor",
      "Stuck blend door actuator",
      "Heater core blockage or leak"
    ],
    whatToCheck: [
      "Check if AC compressor engages when AC is on",
      "Replace cabin air filter if not done recently",
      "Test blower on all speed settings",
      "Check coolant level for heater issues"
    ],
    relatedTo: ["exhaust"]
  },
  exhaust: {
    title: "Exhaust System Problem",
    description: "There may be an exhaust leak, catalytic converter issue, or emission system fault. This can cause smells, noise, and reduced performance.",
    commonCauses: [
      "Exhaust manifold gasket leak",
      "Rusted or damaged exhaust pipes",
      "Failing catalytic converter",
      "Oxygen sensor malfunction"
    ],
    whatToCheck: [
      "Listen for unusual exhaust noise, especially on cold start",
      "Look for black soot or rust holes in exhaust",
      "Check for exhaust smell (especially sulfur/rotten egg)",
      "Scan for exhaust-related trouble codes"
    ],
    relatedTo: ["fuel", "ignition"]
  },
  hvac_secondary: {
    title: "Climate Control Issue",
    description: "A secondary climate control issue has been detected.",
    commonCauses: ["See HVAC diagnosis"],
    whatToCheck: ["See HVAC diagnosis"],
    relatedTo: ["hvac"]
  }
};

// Component-level detailed information (more specific than system-level)
type ComponentInfo = {
  name: string;
  description: string;
  symptoms: string[];
  whatToCheck: string[];
  urgency: "low" | "medium" | "high";
  estimatedCost?: string;
};

const COMPONENT_DETAILS: Record<string, ComponentInfo> = {
  // Starting/Electrical components
  starter_motor: {
    name: "Starter Motor",
    description: "The starter motor is likely failing. When you turn the key, the solenoid engages (causing the click) but the motor itself doesn't spin to crank the engine.",
    symptoms: [
      "Single loud click when turning key",
      "Electrical system works fine (lights bright)",
      "No grinding or slow cranking sounds"
    ],
    whatToCheck: [
      "Try tapping the starter with a hammer while someone turns the key (if accessible)",
      "Check starter motor connections for corrosion",
      "Have starter bench-tested at auto parts store",
      "Check if starter spins freely when removed"
    ],
    urgency: "high",
    estimatedCost: "$150-$400 for parts + labor"
  },
  starter_solenoid: {
    name: "Starter Solenoid",
    description: "The starter solenoid is engaging but may not be making full contact to send power to the starter motor. This is often part of the starter assembly.",
    symptoms: [
      "Click sound when turning key",
      "Intermittent starting issues",
      "Sometimes works after multiple tries"
    ],
    whatToCheck: [
      "Listen for click at starter when key is turned",
      "Check voltage at solenoid during start attempt",
      "Inspect solenoid connections",
      "Often replaced with starter as a unit"
    ],
    urgency: "high",
    estimatedCost: "$100-$300 (often replaced with starter)"
  },
  battery_terminals: {
    name: "Battery Terminals",
    description: "Your battery terminal connections are corroded or loose, preventing proper current flow to the starter and electrical system.",
    symptoms: [
      "Visible corrosion (white/green buildup) on terminals",
      "Intermittent starting problems",
      "Electrical issues that come and go"
    ],
    whatToCheck: [
      "Remove and clean terminals with baking soda/water",
      "Check for tight connections after cleaning",
      "Apply dielectric grease to prevent future corrosion",
      "Inspect cable ends for damage"
    ],
    urgency: "medium",
    estimatedCost: "$0-$30 (DIY cleaning or new terminal ends)"
  },
  battery_cables: {
    name: "Battery Cables",
    description: "One or more battery cables may be damaged, corroded internally, or have a poor connection, causing intermittent power delivery.",
    symptoms: [
      "Intermittent electrical issues",
      "Power cuts out randomly",
      "Cables feel loose or look damaged"
    ],
    whatToCheck: [
      "Inspect full length of cables for damage",
      "Check both ends of each cable for corrosion",
      "Test cable resistance with multimeter",
      "Replace if cables are more than 10 years old"
    ],
    urgency: "medium",
    estimatedCost: "$50-$150 for cable replacement"
  },
  battery_dead_cell: {
    name: "Battery (Dead Cell)",
    description: "Your battery likely has one or more dead cells, causing it to hold less charge and struggle to crank the engine.",
    symptoms: [
      "Slow cranking that improves with jump start",
      "Battery dies after sitting overnight",
      "Battery is more than 3-4 years old"
    ],
    whatToCheck: [
      "Have battery load-tested (free at most auto stores)",
      "Check battery date code for age",
      "Test voltage: should be 12.6V fully charged",
      "Replace if failing load test"
    ],
    urgency: "medium",
    estimatedCost: "$100-$250 for new battery"
  },
  ground_strap: {
    name: "Engine Ground Strap",
    description: "The ground strap connecting the engine to the chassis is likely corroded or loose, causing flickering lights and electrical issues during operation.",
    symptoms: [
      "Lights flicker when engine runs",
      "Electrical accessories act erratically",
      "Issues worse when engine vibrates"
    ],
    whatToCheck: [
      "Locate ground strap (usually engine to firewall)",
      "Check both connection points for corrosion",
      "Clean or replace strap as needed",
      "Add additional ground if problem persists"
    ],
    urgency: "medium",
    estimatedCost: "$20-$80"
  },
  alternator_not_charging: {
    name: "Alternator (Not Charging)",
    description: "Your alternator is not charging the battery while driving. The battery warning light confirms this. The car may die once battery is depleted.",
    symptoms: [
      "Battery/charging light is on",
      "Battery keeps dying after charging",
      "Dim lights while driving"
    ],
    whatToCheck: [
      "Test voltage at battery while running (should be 13.5-14.5V)",
      "Check alternator belt tension and condition",
      "Have alternator tested at auto parts store",
      "Check alternator connections"
    ],
    urgency: "high",
    estimatedCost: "$200-$600 for alternator replacement"
  },
  
  // Fuel system components
  fuel_pump: {
    name: "Fuel Pump",
    description: "Your fuel pump is likely failing. You should hear a brief whine/hum from the fuel tank area when first turning the key to ON - if not, the pump isn't priming.",
    symptoms: [
      "No fuel pump prime sound (2-3 second hum when key turns to ON)",
      "Engine cranks but won't start",
      "Intermittent starting issues"
    ],
    whatToCheck: [
      "Listen for pump prime at fuel tank with key ON",
      "Check fuel pump fuse and relay",
      "Test fuel pressure at the rail",
      "Check for power at fuel pump connector"
    ],
    urgency: "high",
    estimatedCost: "$300-$800 (tank access may add labor)"
  },
  fuel_filter: {
    name: "Fuel Filter",
    description: "Your fuel filter is likely clogged, restricting fuel flow especially under load when the engine needs more fuel.",
    symptoms: [
      "Loss of power going uphill",
      "Hesitation during acceleration",
      "Engine stalls under load"
    ],
    whatToCheck: [
      "Check when filter was last replaced",
      "Test fuel pressure before and after filter",
      "Replace filter (usually every 30-50k miles)",
      "Inspect for contaminated fuel"
    ],
    urgency: "medium",
    estimatedCost: "$50-$150"
  },
  fuel_injectors: {
    name: "Fuel Injectors",
    description: "One or more fuel injectors may be clogged or leaking, causing poor fuel delivery and hard starting.",
    symptoms: [
      "Fuel smell outside vehicle",
      "Long cranking before start",
      "Rough idle or misfires"
    ],
    whatToCheck: [
      "Listen for injector clicking with stethoscope",
      "Check for external fuel leaks at injectors",
      "Consider fuel injector cleaning service",
      "Scan for misfire codes indicating affected cylinder"
    ],
    urgency: "medium",
    estimatedCost: "$100-$300 for cleaning, $200-$400+ for replacement"
  },
  
  // Ignition components
  spark_plugs: {
    name: "Spark Plugs",
    description: "Your spark plugs are likely worn, fouled, or have incorrect gap, causing misfires especially at idle.",
    symptoms: [
      "Rough idle",
      "Misfires at idle",
      "Reduced fuel economy"
    ],
    whatToCheck: [
      "Remove and inspect spark plugs",
      "Check gap against specifications",
      "Look for fouling, wear, or deposits",
      "Replace if worn or past service interval"
    ],
    urgency: "medium",
    estimatedCost: "$40-$150 for standard plugs + labor"
  },
  ignition_coil: {
    name: "Ignition Coil",
    description: "One or more ignition coils are failing, causing misfires especially under load when the engine needs stronger spark.",
    symptoms: [
      "Misfires under acceleration",
      "Check engine light flashing",
      "Reduced power"
    ],
    whatToCheck: [
      "Scan for misfire codes (P0301-P0308 indicate cylinder)",
      "Swap suspected coil with known good one",
      "Check coil resistance with multimeter",
      "Inspect coil boots for damage"
    ],
    urgency: "medium",
    estimatedCost: "$50-$200 per coil"
  },
  
  // Brake components
  brake_pads: {
    name: "Brake Pads",
    description: "Your brake pads are worn down to the metal backing plate, causing the grinding noise when braking. This requires immediate attention.",
    symptoms: [
      "Grinding or scraping noise when braking",
      "Reduced braking power",
      "Brake warning light may be on"
    ],
    whatToCheck: [
      "Visually inspect pad thickness through wheel",
      "Check for metal-on-metal contact",
      "Inspect rotors for scoring damage",
      "Replace pads immediately"
    ],
    urgency: "high",
    estimatedCost: "$100-$300 per axle (pads + labor)"
  },
  brake_rotors: {
    name: "Brake Rotors",
    description: "Your brake rotors are warped, causing the pulsation you feel in the brake pedal when stopping.",
    symptoms: [
      "Pulsation/vibration when braking",
      "Steering wheel shake during braking",
      "Uneven brake pad wear"
    ],
    whatToCheck: [
      "Measure rotor thickness variation",
      "Check rotor runout with dial indicator",
      "Inspect for hot spots or discoloration",
      "Resurface or replace rotors"
    ],
    urgency: "medium",
    estimatedCost: "$200-$500 per axle (rotors + pads + labor)"
  },
  brake_caliper: {
    name: "Brake Caliper",
    description: "A brake caliper is sticking, causing uneven braking or constant drag. The affected wheel may be noticeably hotter than others.",
    symptoms: [
      "Vehicle pulls to one side when braking",
      "One wheel hotter than others after driving",
      "Burning smell from wheel area"
    ],
    whatToCheck: [
      "Feel wheels after driving - one significantly hotter",
      "Check caliper slides for seized condition",
      "Inspect caliper piston for sticking",
      "Check brake hose for internal collapse"
    ],
    urgency: "high",
    estimatedCost: "$150-$400 per caliper"
  },
  brake_fluid: {
    name: "Brake Fluid / Hydraulics",
    description: "Your brake system may have air in the lines or low brake fluid, causing a soft, spongy pedal feel.",
    symptoms: [
      "Soft or spongy brake pedal",
      "Pedal sinks slowly when held",
      "Low brake fluid level"
    ],
    whatToCheck: [
      "Check brake fluid reservoir level",
      "Inspect for leaks at wheels and master cylinder",
      "Bleed brakes to remove air",
      "Check fluid color - replace if dark"
    ],
    urgency: "high",
    estimatedCost: "$50-$150 for fluid flush/bleed"
  },
  brake_fluid_leak: {
    name: "Brake Fluid Leak",
    description: "Your brake system is likely leaking fluid. This is serious because it can lead to brake failure. Low fluid combined with other symptoms (spongy pedal, visible wetness, warning light) strongly indicates a leak.",
    symptoms: [
      "Low brake fluid level (below MIN)",
      "Spongy or soft brake pedal",
      "Fresh fluid spots where you park",
      "Brake warning light on"
    ],
    whatToCheck: [
      "Check fluid level in reservoir - note if it drops",
      "Look for wet spots under car where you normally park",
      "Inspect around each wheel for wetness at caliper/hose",
      "Check master cylinder for external leaks",
      "DO NOT just top off fluid - find the leak first"
    ],
    urgency: "high",
    estimatedCost: "$100-$500+ depending on leak location"
  },
  brake_fluid_leak_caliper_hose: {
    name: "Brake Fluid Leak (Caliper/Hose Area)",
    description: "There appears to be a brake fluid leak at or near a wheel. This is typically from a leaking brake hose, caliper seal, or wheel cylinder. The leak location near a wheel helps narrow down the source.",
    symptoms: [
      "Wetness or fluid visible near a wheel or caliper",
      "Low brake fluid level",
      "Reduced braking power on that corner",
      "Brake warning light may be on"
    ],
    whatToCheck: [
      "Clean area and identify exact leak source",
      "Check flex hose condition and connections",
      "Inspect caliper for external fluid",
      "Check wheel cylinder (if drum brakes)",
      "Repair immediately - brake failure risk"
    ],
    urgency: "high",
    estimatedCost: "$80-$250 for hose; $150-$400 for caliper"
  },
  master_cylinder_internal: {
    name: "Master Cylinder (Internal Bypass)",
    description: "Your master cylinder is likely failing internally. When you press the brake pedal and hold steady pressure, it slowly sinks because fluid is bypassing the internal seals. This happens even with normal external fluid level because the leak is internal.",
    symptoms: [
      "Brake pedal slowly sinks when holding steady pressure",
      "Fluid level may be normal (internal leak)",
      "No visible external leaks",
      "Braking feels less effective over time"
    ],
    whatToCheck: [
      "Hold firm pedal pressure at a stop - does it sink?",
      "Check for fluid at back of master cylinder (firewall side)",
      "Test: pump pedal several times, hold firm - sinking = bad master",
      "Usually requires master cylinder replacement"
    ],
    urgency: "high",
    estimatedCost: "$200-$500 for master cylinder replacement"
  },
  air_in_brake_lines: {
    name: "Air in Brake Lines",
    description: "There is likely air trapped in your brake hydraulic system, causing a soft, spongy pedal feel. This commonly happens after recent brake work (pad replacement, caliper service, line repair) if the system wasn't properly bled.",
    symptoms: [
      "Soft or spongy brake pedal",
      "Pedal feels different after recent brake work",
      "Brake fluid level is normal",
      "No visible leaks"
    ],
    whatToCheck: [
      "Confirm recent brake work was done",
      "Bleed brakes starting from wheel furthest from master",
      "Check for loose bleeder valves",
      "May need ABS bleeding procedure on some vehicles"
    ],
    urgency: "medium",
    estimatedCost: "$50-$150 for professional brake bleed"
  },
  
  // Wheel/tire components
  wheel_bearing: {
    name: "Wheel Bearing",
    description: "A wheel bearing is failing, creating the humming/growling noise that changes with speed. The noise may change when turning.",
    symptoms: [
      "Humming or growling that increases with speed",
      "Noise changes when turning",
      "Play or looseness in wheel when jacked up"
    ],
    whatToCheck: [
      "Jack up car and spin wheel - listen for roughness",
      "Grab wheel at 12 and 6 o'clock - check for play",
      "Noise often louder turning away from bad bearing",
      "Replace bearing assembly"
    ],
    urgency: "medium",
    estimatedCost: "$150-$400 per wheel"
  },
  wheel_balance: {
    name: "Wheel Balance",
    description: "One or more wheels are out of balance, causing vibration at highway speeds, especially felt in the steering wheel.",
    symptoms: [
      "Vibration at specific speeds (often 55-70 mph)",
      "Steering wheel shake",
      "Uneven tire wear"
    ],
    whatToCheck: [
      "Have wheels balanced at tire shop",
      "Check for missing wheel weights",
      "Inspect tires for flat spots",
      "Check for bent wheels"
    ],
    urgency: "low",
    estimatedCost: "$40-$100 for all four wheels"
  },
  tires: {
    name: "Tires",
    description: "Your tires show uneven wear, indicating either alignment issues, improper inflation, or worn suspension components.",
    symptoms: [
      "Visible uneven wear patterns",
      "Vehicle pulls to one side",
      "Vibration or noise"
    ],
    whatToCheck: [
      "Inspect tread depth and wear pattern",
      "Check tire pressure (including spare)",
      "Get alignment checked",
      "Rotate tires if wear is minor"
    ],
    urgency: "medium",
    estimatedCost: "$100-$200+ per tire if replacement needed"
  },
  
  // Suspension components
  struts_shocks: {
    name: "Struts / Shocks",
    description: "Your struts or shocks are worn out, causing excessive bouncing after bumps and poor handling.",
    symptoms: [
      "Excessive bouncing after bumps",
      "Car continues bouncing when pushed down",
      "Oil visible on strut body"
    ],
    whatToCheck: [
      "Bounce test: push corner down, should rebound once",
      "Look for oil leaking from struts",
      "Check for worn strut mounts",
      "Replace in pairs (both front or both rear)"
    ],
    urgency: "medium",
    estimatedCost: "$400-$900 per pair (parts + labor)"
  },
  control_arm_bushings: {
    name: "Control Arm Bushings",
    description: "The rubber bushings in your control arms are worn, causing clunking noises over bumps.",
    symptoms: [
      "Clunking over bumps",
      "Vague steering feel",
      "Uneven tire wear"
    ],
    whatToCheck: [
      "Visually inspect bushings for cracks/deterioration",
      "Check for excessive movement with pry bar",
      "Bushings may be replaceable separately or with arm"
    ],
    urgency: "medium",
    estimatedCost: "$150-$400 per control arm"
  },
  sway_bar_links: {
    name: "Sway Bar Links",
    description: "Your sway bar end links are worn, causing rattling noises over rough roads.",
    symptoms: [
      "Rattling over bumps",
      "Noise from front or rear suspension",
      "Clunking when going over speed bumps"
    ],
    whatToCheck: [
      "Grab sway bar link and check for play",
      "Look for torn boots or loose ball joints",
      "Relatively easy DIY replacement"
    ],
    urgency: "low",
    estimatedCost: "$50-$150 per pair"
  },
  spring: {
    name: "Coil Spring",
    description: "A coil spring is broken or sagging, causing the vehicle to sit lower on one side.",
    symptoms: [
      "Vehicle sits lower on one corner",
      "Clunking noise from affected corner",
      "Poor handling"
    ],
    whatToCheck: [
      "Measure ride height at each corner",
      "Visually inspect springs for breaks",
      "Broken spring may be visible",
      "Replace in pairs"
    ],
    urgency: "medium",
    estimatedCost: "$200-$500 per spring (labor intensive)"
  },
  
  // Steering components
  power_steering_pump: {
    name: "Power Steering Pump",
    description: "Your power steering pump is whining, indicating it's low on fluid, has air in the system, or is failing.",
    symptoms: [
      "Whining noise when turning",
      "Noise worse at full lock",
      "Heavy steering at low speeds"
    ],
    whatToCheck: [
      "Check power steering fluid level",
      "Inspect for leaks at pump and lines",
      "Check belt condition and tension",
      "Flush system if fluid is dark/contaminated"
    ],
    urgency: "medium",
    estimatedCost: "$200-$500 for pump replacement"
  },
  steering_rack: {
    name: "Steering Rack",
    description: "Your steering rack may be worn, causing the steering to feel vague or wander.",
    symptoms: [
      "Steering wanders or feels loose",
      "Fluid leak at steering rack boots",
      "Clunking when turning"
    ],
    whatToCheck: [
      "Inspect rack boots for leaks",
      "Check for excessive play in steering wheel",
      "Have tie rod ends inspected",
      "Rack replacement is major repair"
    ],
    urgency: "medium",
    estimatedCost: "$500-$1500 for rack replacement"
  },
  tie_rod_ends: {
    name: "Tie Rod Ends",
    description: "Your tie rod ends are worn, affecting steering precision and causing uneven tire wear.",
    symptoms: [
      "Steering wanders",
      "Uneven tire wear (especially inner/outer edge)",
      "Clunking when turning"
    ],
    whatToCheck: [
      "Jack up front and wiggle wheel side to side",
      "Inspect tie rod boots for damage",
      "Check for play in tie rod joints",
      "Alignment needed after replacement"
    ],
    urgency: "medium",
    estimatedCost: "$100-$300 per side + alignment"
  },
  
  // Tire pressure components (common cause of vehicle pull)
  tire_pressure_low: {
    name: "Low Tire Pressure",
    description: "One of your tires has significantly low pressure. Vehicles typically pull toward the tire with lower pressure. This is the most common and easiest-to-fix cause of vehicle pulling.",
    symptoms: [
      "Vehicle pulls to one side",
      "One tire looks flatter than others",
      "TPMS light may be on",
      "Slightly heavier steering"
    ],
    whatToCheck: [
      "Check all four tire pressures when cold (before driving)",
      "Compare to door jamb sticker for correct PSI",
      "Inflate to proper pressure and retest",
      "If pressure drops again within days, check for leak"
    ],
    urgency: "medium",
    estimatedCost: "Free - $5 at gas station air pump"
  },
  tire_pressure_uneven: {
    name: "Uneven Tire Pressure",
    description: "Your tires have uneven pressure - the car pulls toward the tire with less air. This is often the simplest fix for a pulling vehicle and should always be checked first.",
    symptoms: [
      "Vehicle pulls left or right",
      "Different pressure readings across tires",
      "May worsen with temperature changes",
      "Possible TPMS warning"
    ],
    whatToCheck: [
      "Measure all four tires with accurate gauge when cold",
      "The low tire is usually the direction of pull",
      "Check for seasonal pressure changes (10°F = ~1 PSI)",
      "Ensure all tires match door sticker specification"
    ],
    urgency: "low",
    estimatedCost: "Free - just add air"
  },
  tire_slow_leak: {
    name: "Slow Tire Leak",
    description: "One of your tires has a slow leak, causing it to gradually lose pressure. This creates an imbalance that makes the vehicle pull toward the affected side.",
    symptoms: [
      "Need to add air frequently",
      "Vehicle gradually starts pulling",
      "Same tire always needs air",
      "May hear hissing near tire or valve"
    ],
    whatToCheck: [
      "Spray soapy water on tire and watch for bubbles",
      "Check valve stem for damage or looseness",
      "Inspect tire tread for nail, screw, or debris",
      "Check bead area where tire meets rim",
      "Check for sidewall damage from curb rash"
    ],
    urgency: "medium",
    estimatedCost: "$0-$30 for patch, $100-$200+ if tire replacement needed"
  },
  valve_stem: {
    name: "Valve Stem Leak",
    description: "Your tire's valve stem is damaged or leaking, causing slow air loss. Valve stems can crack with age or be damaged by road debris or tire machines.",
    symptoms: [
      "Tire loses air slowly over days/weeks",
      "May hear hissing at valve",
      "Valve core may be loose or damaged",
      "Rubber valve stem may be cracked"
    ],
    whatToCheck: [
      "Apply soapy water to valve stem - look for bubbles",
      "Check if valve core is tight (valve core tool needed)",
      "Inspect rubber valve stem for cracks",
      "Metal TPMS valve stems can also leak at seal"
    ],
    urgency: "low",
    estimatedCost: "$5-$25 per valve stem"
  },
  tire_curb_damage: {
    name: "Tire/Wheel Curb Damage",
    description: "Hitting a curb or pothole can damage the tire, bend the wheel, or knock the alignment out of spec - any of which can cause pulling.",
    symptoms: [
      "Pulling started after hitting something",
      "Visible scuff marks on tire sidewall",
      "Rim damage visible",
      "May have vibration as well"
    ],
    whatToCheck: [
      "Inspect tire sidewall for bulges or cuts",
      "Check rim for bends or cracks",
      "Look for slow leak from damaged area",
      "Have alignment checked - likely knocked out",
      "May need tire replacement if sidewall damaged"
    ],
    urgency: "medium",
    estimatedCost: "$0 for just alignment check, $100+ if parts damaged"
  },
  wheel_alignment: {
    name: "Wheel Alignment",
    description: "Your wheels are out of alignment, causing the vehicle to pull to one side. Alignment can drift over time or be knocked out by potholes and curbs.",
    symptoms: [
      "Steady pull to one side while driving",
      "Steering wheel off-center when going straight",
      "Uneven tire wear patterns",
      "Pull may change with speed"
    ],
    whatToCheck: [
      "First verify tire pressures are correct",
      "Check for uneven tire wear (alignment indicator)",
      "Have professional alignment check performed",
      "Inspect suspension components for wear (may prevent alignment)"
    ],
    urgency: "medium",
    estimatedCost: "$75-$150 for alignment"
  },
  
  // HVAC components
  blower_motor: {
    name: "Blower Motor",
    description: "Your blower motor has failed - no air comes out of the vents regardless of fan speed setting.",
    symptoms: [
      "No air from vents on any setting",
      "Motor may make noise before failing",
      "Fuse may blow repeatedly"
    ],
    whatToCheck: [
      "Check blower motor fuse",
      "Test for power at blower motor connector",
      "Listen for motor trying to run",
      "Check blower motor resistor if only some speeds work"
    ],
    urgency: "low",
    estimatedCost: "$150-$400"
  },
  cabin_air_filter: {
    name: "Cabin Air Filter",
    description: "Your cabin air filter is clogged, restricting airflow through the vents.",
    symptoms: [
      "Weak airflow from vents",
      "Musty smell from vents",
      "AC/heat less effective"
    ],
    whatToCheck: [
      "Locate and inspect cabin air filter",
      "Replace if dirty (typically every 15-20k miles)",
      "Easy DIY replacement on most vehicles"
    ],
    urgency: "low",
    estimatedCost: "$15-$50 for filter"
  },
  heater_core: {
    name: "Heater Core",
    description: "Your heater core is leaking coolant. The sweet smell is coolant entering the cabin, and you may have foggy windows or wet carpet.",
    symptoms: [
      "Sweet smell from vents",
      "No heat",
      "Foggy windows",
      "Wet carpet on passenger side"
    ],
    whatToCheck: [
      "Check for wet carpet under dash",
      "Monitor coolant level for drops",
      "Major repair - dash removal usually required"
    ],
    urgency: "medium",
    estimatedCost: "$500-$1500 (labor intensive)"
  },
  coolant_low: {
    name: "Low Coolant Level",
    description: "Your coolant level is low, which prevents the heater core from receiving enough hot coolant to produce heat. This is often the simplest cause of no-heat and should always be checked first.",
    symptoms: [
      "No heat from vents",
      "Coolant reservoir empty or below MIN line",
      "May also have engine overheating",
      "Possible coolant leak signs"
    ],
    whatToCheck: [
      "Check coolant reservoir level (when engine is cold)",
      "Top off with correct coolant type for your vehicle",
      "Check for visible leaks under car",
      "Monitor level daily - if it drops again, there's a leak",
      "Check radiator hoses for cracks or soft spots"
    ],
    urgency: "medium",
    estimatedCost: "$10-$30 for coolant, more if leak repair needed"
  },
  thermostat: {
    name: "Thermostat (Stuck Open)",
    description: "Your engine thermostat is stuck open, preventing the engine from reaching proper operating temperature. Without proper engine heat, the heater cannot produce warm air.",
    symptoms: [
      "No heat from vents",
      "Engine never warms up - gauge stays low",
      "Temperature gauge stays below normal even after driving",
      "May notice reduced fuel economy"
    ],
    whatToCheck: [
      "First verify coolant level is OK (rule this out first)",
      "Check temperature gauge while driving",
      "After 10-15 minutes of driving, gauge should reach middle",
      "If engine stays cold, thermostat is likely stuck open"
    ],
    urgency: "medium",
    estimatedCost: "$50-$200"
  },
  blend_door: {
    name: "Blend Door Actuator",
    description: "Your blend door actuator has failed or the blend door is stuck. This door controls the mix of hot and cold air - if stuck on cold, you'll get no heat even though the heater core is working.",
    symptoms: [
      "No heat even though engine warms up normally",
      "Coolant level is OK",
      "May hear clicking behind dash",
      "Temperature control has no effect"
    ],
    whatToCheck: [
      "Verify both heater hoses are hot (confirms heater core is fine)",
      "Listen for clicking noise behind dash when adjusting temp",
      "Clicking but no change = actuator failure",
      "No clicking = possible actuator or control issue"
    ],
    urgency: "low",
    estimatedCost: "$100-$400 depending on location"
  },
  ac_refrigerant: {
    name: "AC Refrigerant",
    description: "Your AC system is low on refrigerant, likely due to a leak. The system needs to be recharged after finding and fixing the leak.",
    symptoms: [
      "AC blows warm or barely cool air",
      "AC compressor cycles rapidly",
      "Gradual loss of cooling over time"
    ],
    whatToCheck: [
      "Check if AC compressor engages",
      "Have system pressure tested",
      "Look for oily residue at AC connections (leak indicator)",
      "Professional leak detection recommended"
    ],
    urgency: "low",
    estimatedCost: "$100-$300 for recharge, more if leak repair needed"
  },
  evaporator: {
    name: "AC Evaporator",
    description: "Your AC evaporator has mold/mildew growth causing the musty smell from the vents.",
    symptoms: [
      "Musty or moldy smell from vents",
      "Smell worse when first turning on AC",
      "May cause allergy symptoms"
    ],
    whatToCheck: [
      "Try running fan only (no AC) to dry evaporator",
      "Use AC evaporator cleaner spray",
      "Replace cabin air filter",
      "Professional cleaning may be needed"
    ],
    urgency: "low",
    estimatedCost: "$20-$100 for DIY treatment"
  },
  
  // Exhaust components
  catalytic_converter: {
    name: "Catalytic Converter",
    description: "Your catalytic converter is failing, producing the rotten egg (sulfur) smell. This component cleans exhaust emissions.",
    symptoms: [
      "Rotten egg or sulfur smell",
      "Check engine light",
      "Reduced performance",
      "Failed emissions test"
    ],
    whatToCheck: [
      "Scan for catalyst efficiency codes (P0420, P0430)",
      "Check for exhaust leaks before converter",
      "Inspect for physical damage",
      "Required for emissions compliance"
    ],
    urgency: "medium",
    estimatedCost: "$500-$2500 depending on vehicle"
  },
  exhaust_manifold: {
    name: "Exhaust Manifold",
    description: "Your exhaust manifold or its gasket is leaking, allowing exhaust gases to escape before reaching the catalytic converter.",
    symptoms: [
      "Exhaust smell, especially on cold start",
      "Ticking noise from engine bay on cold start",
      "Smell worse when stopped"
    ],
    whatToCheck: [
      "Listen for exhaust leak sound near engine",
      "Look for black soot around manifold",
      "Check manifold bolts and gasket",
      "Inspect for cracks in manifold"
    ],
    urgency: "medium",
    estimatedCost: "$200-$600 for gasket, $400-$1200 for manifold"
  },
  oil_leak: {
    name: "Oil Leak (Burning)",
    description: "You have an oil leak that is dripping onto hot exhaust components, causing the burning oil smell.",
    symptoms: [
      "Burning oil smell",
      "Smoke from engine bay",
      "Oil spots under vehicle"
    ],
    whatToCheck: [
      "Check oil level",
      "Look for oil dripping on exhaust manifold",
      "Common leak points: valve cover, oil pan, rear main seal",
      "Fix leak and clean residue from exhaust"
    ],
    urgency: "medium",
    estimatedCost: "Varies widely based on leak location"
  },
};

// Helper to get component info
function getComponentInfo(component: string | undefined): ComponentInfo | null {
  if (!component) return null;
  return COMPONENT_DETAILS[component] || null;
}

// Helper to get detailed hypothesis info
function getHypothesisInfo(hypothesis: string | null | undefined): HypothesisInfo {
  if (!hypothesis) {
    return {
      title: "Unable to Determine",
      description: "The diagnostic system could not determine a specific cause. Please provide more information or try different symptom combinations.",
      commonCauses: [],
      whatToCheck: ["Review your symptoms and try again", "Consult a professional mechanic"],
      relatedTo: []
    };
  }
  
  const info = HYPOTHESIS_DETAILS[hypothesis];
  if (info) return info;
  
  // Fallback for unknown hypotheses
  const label = HYPOTHESIS_FAMILY_LABELS[hypothesis as HypothesisFamilyId];
  return {
    title: label || hypothesis.replace(/_/g, " "),
    description: `A potential issue has been identified in the ${label || hypothesis} system.`,
    commonCauses: ["Further diagnosis recommended"],
    whatToCheck: ["Consult vehicle documentation", "Visit a qualified mechanic"],
    relatedTo: []
  };
}

// Helper to get display label for hypothesis (simple version)
function getHypothesisLabel(hypothesis: string | null | undefined): string {
  if (!hypothesis) return "Unable to determine";
  const info = HYPOTHESIS_DETAILS[hypothesis];
  if (info) return info.title;
  const label = HYPOTHESIS_FAMILY_LABELS[hypothesis as HypothesisFamilyId];
  return label || hypothesis.replace(/_/g, " ");
}

type ResultsProps = {
  result: DiagnosticResult;
  vehicleId: string | null;
  vehicle?: Vehicle | null;
  diagnosticAnswers?: Record<string, string>;
  excludedHypotheses?: string[];
  onBackToFlow?: () => void;
  onRerunExcluding?: (hypothesis: string) => void;
  onStartFresh?: () => void;
};

export function Results({
  result,
  vehicleId,
  vehicle,
  diagnosticAnswers = {},
  excludedHypotheses = [],
  onBackToFlow,
  onRerunExcluding,
  onStartFresh,
}: ResultsProps) {
  const [saved, setSaved] = useState(false);
  const [showFeedbackOptions, setShowFeedbackOptions] = useState(false);
  const [userNotes, setUserNotes] = useState("");
  const [relevantNotes, setRelevantNotes] = useState<GarageNote[]>([]);
  const [relevantMaintenance, setRelevantMaintenance] = useState<MaintenanceEvent[]>([]);
  const [proEnabled, setProEnabled] = useState(false);

  // Check Pro status
  useEffect(() => {
    setProEnabled(isProEnabled());
  }, []);

  // Load relevant garage data
  useEffect(() => {
    if (vehicleId) {
      const notes = getGarageNotes(vehicleId);
      const maintenance = getMaintenanceEvents(vehicleId);

      // Filter for recent/relevant items (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      setRelevantNotes(
        notes
          .filter((n) => !n.resolved)
          .slice(0, 5)
      );

      setRelevantMaintenance(
        maintenance
          .filter((m) => new Date(m.date) > sixMonthsAgo)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
      );
    }
  }, [vehicleId]);

  // Get confidence band label
  const getConfidenceBand = (confidence: number): { label: string; color: string } => {
    if (confidence >= 0.7) return { label: "High", color: "rgba(100,200,100,0.3)" };
    if (confidence >= 0.4) return { label: "Medium", color: "rgba(200,200,100,0.3)" };
    return { label: "Low", color: "rgba(200,100,100,0.3)" };
  };

  const confidenceBand = getConfidenceBand(result.confidence);

  // Handle save to garage
  const handleSave = () => {
    if (!vehicleId) return;

    saveDiagnosticResult({
      vehicleId,
      result,
      userNotes: userNotes || undefined,
    });
    setSaved(true);
  };

  // Handle export
  const handleExport = () => {
    const activeVehicle = vehicle || (vehicleId ? getActiveVehicle() : null);
    const payload = exportDiagnosticPayload(
      result,
      userNotes || undefined,
      activeVehicle || undefined,
      vehicleId ? relevantNotes : undefined,
      vehicleId ? relevantMaintenance : undefined,
      diagnosticAnswers
    );

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostic-${result.id?.slice(0, 8) || "result"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle re-run excluding (Pro feature)
  const handleRerunExcluding = () => {
    if (result.topHypothesis && onRerunExcluding) {
      onRerunExcluding(result.topHypothesis);
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = () => {
    const activeVehicle = vehicle || (vehicleId ? getActiveVehicle() : null);
    const payload = createFeedbackPayload(
      result,
      "submit_feedback",
      userNotes || undefined,
      activeVehicle || undefined,
      diagnosticAnswers
    );

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-${result.id?.slice(0, 8) || "result"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowFeedbackOptions(false);
  };

  return (
    <section className="card" data-testid="results-panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }} data-testid="results-title">
          Diagnostic Results
        </h2>
        {onBackToFlow && (
          <button
            className="button"
            onClick={onBackToFlow}
            data-testid="back-to-flow-button"
            style={{ padding: "8px 16px" }}
          >
            ← Back to Questions
          </button>
        )}
      </div>

      {/* Show excluded hypotheses if re-running */}
      {excludedHypotheses.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "rgba(255,200,50,0.15)",
            borderRadius: 8,
            border: "1px solid rgba(255,200,50,0.3)",
          }}
          data-testid="exclusions-banner"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>⭐ Pro: Re-run Results</strong>
              <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.9 }}>
                Excluded from consideration: {excludedHypotheses.join(", ")}
              </p>
            </div>
            {onStartFresh && (
              <button
                className="button"
                onClick={onStartFresh}
                style={{ padding: "6px 12px", fontSize: 13 }}
              >
                Start Fresh
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Hypothesis - Main Result */}
      {(() => {
        // Check for specific component first (more precise diagnosis)
        const componentInfo = getComponentInfo(result.specificComponent);
        const hypothesisInfo = getHypothesisInfo(result.topHypothesis);
        const secondaryHypothesis = hypothesisInfo.relatedTo[0];
        const secondaryInfo = secondaryHypothesis ? getHypothesisInfo(secondaryHypothesis) : null;
        
        // Use component info if available, otherwise fall back to system-level
        const displayTitle = componentInfo ? componentInfo.name : hypothesisInfo.title;
        const displayDescription = componentInfo ? componentInfo.description : hypothesisInfo.description;
        const displayChecks = componentInfo ? componentInfo.whatToCheck : hypothesisInfo.whatToCheck;
        const displaySymptoms = componentInfo ? componentInfo.symptoms : hypothesisInfo.commonCauses;
        
        return (
          <>
            {/* Primary Diagnosis Card */}
            <div
              className="card"
              style={{
                background: componentInfo 
                  ? "rgba(100,200,150,0.15)"  // Green tint for component-level
                  : "rgba(100,150,255,0.15)", // Blue tint for system-level
                marginBottom: 16,
                border: componentInfo 
                  ? "1px solid rgba(100,200,150,0.3)"
                  : "1px solid rgba(100,150,255,0.3)",
              }}
              data-testid="top-hypothesis-card"
            >
              {/* Component-level badge */}
              {componentInfo && (
                <div style={{
                  display: "inline-block",
                  background: "rgba(100,200,150,0.3)",
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: "bold",
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  🎯 Component Identified
                </div>
              )}
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>🔧</span>
                <h3 style={{ margin: 0, opacity: 0.7, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {componentInfo ? "Specific Component" : "Most Likely Cause"}
                </h3>
              </div>
              <div style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }} data-testid="results-top-hypothesis">
                {displayTitle}
              </div>
              <p style={{ margin: "0 0 16px", opacity: 0.85, lineHeight: 1.5 }}>
                {displayDescription}
              </p>
              
              {/* Urgency indicator for component-level */}
              {componentInfo && componentInfo.urgency && (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 6,
                  marginBottom: 12,
                  background: componentInfo.urgency === "high" 
                    ? "rgba(255,100,100,0.2)"
                    : componentInfo.urgency === "medium"
                    ? "rgba(255,180,100,0.2)"
                    : "rgba(100,200,100,0.2)",
                  fontSize: 13,
                }}>
                  <span>{componentInfo.urgency === "high" ? "⚠️" : componentInfo.urgency === "medium" ? "⏱️" : "ℹ️"}</span>
                  <strong>
                    {componentInfo.urgency === "high" ? "High Priority - Address Soon" 
                      : componentInfo.urgency === "medium" ? "Medium Priority"
                      : "Low Priority - Not Urgent"}
                  </strong>
                </div>
              )}
              
              {/* Estimated cost for component-level */}
              {componentInfo && componentInfo.estimatedCost && (
                <div style={{
                  display: "block",
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 6,
                  marginBottom: 12,
                  fontSize: 14,
                }}>
                  <strong>💰 Estimated Cost:</strong> {componentInfo.estimatedCost}
                </div>
              )}
              
              {/* Symptoms / Common Causes */}
              {displaySymptoms.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 13, opacity: 0.7 }}>
                    {componentInfo ? "Typical symptoms:" : "Common causes:"}
                  </strong>
                  <ul style={{ margin: "8px 0 0", paddingLeft: 20, opacity: 0.85 }}>
                    {displaySymptoms.slice(0, 3).map((item, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* What to Check */}
              {displayChecks.length > 0 && (
                <div
                  style={{
                    padding: 12,
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 8,
                    marginTop: 12,
                  }}
                >
                  <strong style={{ fontSize: 13 }}>✓ What to check:</strong>
                  <ul style={{ margin: "8px 0 0", paddingLeft: 20, opacity: 0.9 }}>
                    {displayChecks.slice(0, 4).map((check, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{check}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* System context when showing component */}
              {componentInfo && (
                <div style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 13,
                  opacity: 0.7,
                }}>
                  <strong>System:</strong> {hypothesisInfo.title}
                </div>
              )}
            </div>

            {/* Secondary Possibility */}
            {secondaryInfo && (
              <div
                className="card"
                style={{
                  background: "rgba(255,200,100,0.08)",
                  marginBottom: 16,
                  border: "1px solid rgba(255,200,100,0.2)",
                }}
                data-testid="secondary-hypothesis-card"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>🔍</span>
                  <h4 style={{ margin: 0, opacity: 0.7, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Also Consider
                  </h4>
                </div>
                <div style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
                  {secondaryInfo.title}
                </div>
                <p style={{ margin: 0, opacity: 0.75, fontSize: 14, lineHeight: 1.4 }}>
                  {secondaryInfo.description}
                </p>
                {secondaryInfo.whatToCheck.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
                    <strong>Quick check:</strong> {secondaryInfo.whatToCheck[0]}
                  </div>
                )}
              </div>
            )}
          </>
        );
      })()}

      {/* Confidence Band */}
      <div className="row" style={{ marginBottom: 16 }} data-testid="results-summary-row">
        <div
          className="badge"
          style={{ background: confidenceBand.color, padding: "8px 16px" }}
          data-testid="results-confidence"
        >
          Confidence: {confidenceBand.label} ({Math.round(result.confidence * 100)}%)
        </div>
        <div className="badge" style={{ padding: "8px 16px" }}>
          Entry: {result.entryAnchor.replace(/_/g, " ")}
        </div>
        {proEnabled && (
          <div className="badge" style={{ padding: "8px 16px", background: "rgba(255,200,50,0.3)" }}>
            ⭐ Pro
          </div>
        )}
      </div>

      {/* Confidence explanation */}
      <p style={{ opacity: 0.8, fontSize: 14, marginBottom: 16 }}>
        {confidenceBand.label === "High" &&
          "The diagnosis has high confidence based on the symptoms you reported."}
        {confidenceBand.label === "Medium" &&
          "The diagnosis has moderate confidence. Consider verifying with additional checks."}
        {confidenceBand.label === "Low" &&
          "The diagnosis has low confidence. More information may be needed for a reliable diagnosis."}
      </p>

      {/* Safety Notes */}
      {Array.isArray(result.safetyNotes) && result.safetyNotes.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "rgba(255,100,100,0.15)",
            borderRadius: 8,
          }}
          data-testid="results-notes"
        >
          <h3 style={{ margin: "0 0 8px", color: "#ff6b6b" }} data-testid="results-safety-notes-title">
            ⚠️ Safety Notes
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20 }} data-testid="results-safety-notes-list">
            {result.safetyNotes.map((n, i) => (
              <li key={i} data-testid="results-safety-note-item">
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Garage Context - Relevant Notes */}
      {relevantNotes.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
          }}
          data-testid="relevant-notes"
        >
          <h3 style={{ margin: "0 0 8px" }}>Related Garage Notes</h3>
          <p style={{ opacity: 0.7, fontSize: 12, margin: "0 0 8px" }}>
            These notes from your garage may be relevant (informational only)
          </p>
          {relevantNotes.map((note) => (
            <div
              key={note.id}
              style={{
                padding: "8px",
                marginBottom: 4,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 4,
              }}
            >
              <span className="badge" style={{ textTransform: "capitalize", marginRight: 8 }}>
                {note.category}
              </span>
              {note.text}
            </div>
          ))}
        </div>
      )}

      {/* Garage Context - Recent Maintenance */}
      {relevantMaintenance.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
          }}
          data-testid="relevant-maintenance"
        >
          <h3 style={{ margin: "0 0 8px" }}>Recent Maintenance</h3>
          <p style={{ opacity: 0.7, fontSize: 12, margin: "0 0 8px" }}>
            Recent work done on this vehicle (informational only)
          </p>
          {relevantMaintenance.map((event) => (
            <div
              key={event.id}
              style={{
                padding: "8px",
                marginBottom: 4,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 4,
              }}
            >
              <strong>{event.type}</strong>
              <span style={{ opacity: 0.7, marginLeft: 8 }}>{event.date}</span>
              {event.mileage > 0 && (
                <span className="badge" style={{ marginLeft: 8 }}>
                  {event.mileage.toLocaleString()} mi
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* User Notes Input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Add notes (optional):
        </label>
        <textarea
          className="button"
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          placeholder="Add any additional notes about this diagnosis..."
          style={{ width: "100%", minHeight: 80, resize: "vertical" }}
          data-testid="user-notes-input"
        />
      </div>

      {/* Action Buttons */}
      <div className="row" style={{ marginBottom: 16 }} data-testid="result-actions">
        {vehicleId && !saved && (
          <button
            className="button"
            onClick={handleSave}
            style={{ padding: "12px 20px" }}
            data-testid="save-result-btn"
          >
            💾 Save to Garage
          </button>
        )}
        {saved && (
          <span
            className="badge"
            style={{ background: "rgba(100,200,100,0.3)", padding: "12px 20px" }}
          >
            ✓ Saved to Garage
          </span>
        )}
        <button
          className="button"
          onClick={handleExport}
          style={{ padding: "12px 20px" }}
          data-testid="export-result-btn"
        >
          📤 Export
        </button>
      </div>

      {/* Post-Result Actions */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: 16,
          marginTop: 16,
        }}
      >
        <button
          className="button"
          onClick={() => setShowFeedbackOptions(!showFeedbackOptions)}
          style={{ width: "100%", textAlign: "left", padding: "14px 16px" }}
          data-testid="feedback-toggle-btn"
        >
          🤔 I think it's something else
          <span style={{ float: "right" }}>{showFeedbackOptions ? "▲" : "▼"}</span>
        </button>

        {showFeedbackOptions && (
          <div
            className="card"
            style={{
              marginTop: 8,
              background: "rgba(255,255,255,0.04)",
            }}
            data-testid="feedback-options"
          >
            <p style={{ marginTop: 0, opacity: 0.8 }}>
              If you believe the diagnosis is incorrect:
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {/* Re-run excluding - Pro feature */}
              <button
                className="button"
                onClick={proEnabled ? handleRerunExcluding : undefined}
                style={{
                  textAlign: "left",
                  padding: "12px",
                  opacity: proEnabled ? 1 : 0.6,
                  cursor: proEnabled ? "pointer" : "not-allowed",
                }}
                data-testid="rerun-excluding-btn"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>Re-run excluding "{result.topHypothesis}"</strong>
                    <br />
                    <span style={{ opacity: 0.7, fontSize: 13 }}>
                      Run diagnosis again without considering this hypothesis
                    </span>
                  </div>
                  {proEnabled ? (
                    <span className="badge" style={{ background: "rgba(255,200,50,0.3)" }}>⭐ Pro</span>
                  ) : (
                    <span className="badge" style={{ background: "rgba(255,255,255,0.1)" }}>
                      Pro Only
                    </span>
                  )}
                </div>
                {!proEnabled && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, opacity: 0.7 }}>
                    Enable Pro Mode in Settings to use this feature
                  </p>
                )}
              </button>

              <button
                className="button"
                onClick={handleSubmitFeedback}
                style={{ textAlign: "left", padding: "12px" }}
                data-testid="submit-feedback-btn"
              >
                <strong>Submit feedback to developer</strong>
                <br />
                <span style={{ opacity: 0.7, fontSize: 13 }}>
                  Help us improve by sharing this diagnostic session
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
