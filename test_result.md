# Test Results - Car Diagnostics App

## Testing Protocol
- Test File: Manual E2E testing via Playwright
- Backend: Local-first app, no backend required

## Test Cases - COMPLETED ✅

### 1-9. Previous Tests (All Passing) ✅
[Previous test details maintained]

### 10. Diagnostic Question Phrasing & UX Refinement ✅ (NEW)

**Directive Implementation Status:**

#### 1️⃣ Engine Temperature Question - FIXED ✅
- Old: "What does the engine temperature gauge show?" ❌
- New: "🌡️ What does the engine temperature gauge on the dashboard show?" ✅
- Subtext: "Look at the temperature gauge in the instrument cluster"
- InfoText: "The engine temperature gauge reflects coolant temperature, not cabin air."
- All answers describe observable gauge behavior

#### 2️⃣ Question Lint Rule Applied ✅
Questions now follow: [Observable Object] + [Physical Location] + [State/Condition]
- ✅ "What sound do you hear from the engine bay when turning the key?"
- ✅ "What do the dashboard warning lights look like?"
- ✅ "Using a tire pressure gauge, what are the pressure readings?"
- ✅ "Looking at the coolant overflow reservoir under the hood..."
- ✅ "Looking at the battery terminals under the hood..."

#### 3️⃣ Phrasing Review Flags - IMPLEMENTED ✅
- Added `phrasingApproved: boolean` to Question type
- Questions with `phrasingApproved: false` show ⚠️ badge
- Tooltip: "Phrasing under review — verify instrument/source clarity"
- Does NOT affect diagnostics
- Removable in cleanup commit

#### 4️⃣ Contextual Helper Content - IMPLEMENTED ✅
InfoText displays beneath questions with relevant guidance:
- Engine temp: "The engine temperature gauge reflects coolant temperature, not cabin air."
- Tire pull: "Vehicles typically pull toward the tire with LOWER pressure."
- Brake heat: "One wheel being hotter than others may indicate dragging brakes."
- Dashboard lights: "Dashboard lights should illuminate brightly at key-on."

#### Scope Compliance ✅
- ❌ Did NOT modify /src/core/*
- ❌ Did NOT modify /src/diagnostics/*
- ❌ Did NOT change scoring, safety, confidence, or engine behavior
- ✅ UI presentation only
- ✅ Fixed phrasing without adding tooltips as workarounds

## Implementation Summary

### Files Modified:
- `/src/ui/DiagnosticFlow.tsx`:
  - Added `phrasingApproved?: boolean` to Question type
  - Added ⚠️ badge rendering for unapproved questions
  - Updated 20+ questions with proper phrasing
  - Added contextual infoText to relevant questions

### Key Phrasing Changes:
| Before | After |
|--------|-------|
| "What happens when you turn the key?" | "What sound do you hear from the engine bay when turning the key?" |
| "Are all the dashboard lights bright?" | "With the key turned to ON, what do the dashboard warning lights look like?" |
| "What does the engine temperature gauge show?" | "🌡️ What does the engine temperature gauge on the dashboard show?" |
| "Have you checked tire pressures?" | "Using a tire pressure gauge, what are the pressure readings?" |
| "Can you check the coolant level?" | "Looking at the coolant overflow reservoir under the hood, what is the fluid level?" |

## Last Test Run
- Status: PASSED ✅
- Date: 2026-01-01
- UX phrasing directive fully implemented

## System Correction Verification - PASSED ✅
- Date: 2026-01-01
- Test Flow: Won't Start → Single Click → Bright Lights → Lights Stay Bright → Sudden Failure → No Previous Issues
- **Top Hypothesis:** Starter Motor (NOT battery) ✅
- **Confidence:** 60% (Medium) - Appropriately modest ✅
- **Secondary:** Battery/Charging System correctly shown in "Also Consider" ✅
- **Core Principle Verified:** Confidence capped by remaining uncertainty, not boosted by hypothesis strength

## Brake Fluid Logic Upgrade - PASSED ✅
- Date: 2026-01-01
- Implementation: ENGINE-DATA OPTION (A) - Observations + Component Refinements

### Files Modified:
1. `/src/core/observations.ts` - Added 6 new observations:
   - `brake_pedal_sinks`, `brake_fluid_level_low`, `brake_fluid_level_normal`
   - `recent_brake_service`, `visible_fluid_under_car`, `visible_fluid_near_wheel`

2. `/src/diagnostics/rules.ts` - Added observation→family mappings

3. `/src/engine/diagnosticEngine.ts` - Added 15 component refinement rules:
   - Master cylinder internal bypass
   - Air in brake lines
   - Brake fluid leak (general)
   - Brake fluid leak (caliper/hose area)
   - Updated pad/rotor/caliper rules

4. `/src/ui/Results.tsx` - Added 5 new component details + educational section

5. `/src/ui/DiagnosticFlow.tsx` - Added 5 new brake questions:
   - Pedal sink check, Fluid level check, Recent service check
   - Visible fluid under car, Visible fluid near wheel
   - Added Copy Block A (educational tip)

6. `/src/content/tips.ts` - Added 9 educational tips (brakes, electrical, general)

7. `/src/ui/TipsAndTricks.tsx` - Added category-based tip display

8. `/src/ui/MyGarage.tsx` - Added Copy Block D tip + brake maintenance types

### Test Cases Verified:
| Test Case | Input | Expected Result | Actual Result | Status |
|-----------|-------|-----------------|---------------|--------|
| 4. Pedal sinks + normal fluid | Spongy→Sinks→Normal fluid→No service→No leaks | Master Cylinder Internal | ✅ Master Cylinder (Internal Bypass) | PASSED |
| 5. Visible wetness near wheel | Spongy→Holds→Low fluid→No service→Wet near wheel | Leak at caliper/hose | ✅ Brake Fluid Leak (Caliper/Hose Area) | PASSED |
| 3. Recent service + spongy + normal | Spongy→Holds→Normal fluid→Recent service→No leaks | Air in lines | ✅ Air in Brake Lines | PASSED |

### Scope Compliance:
- ✅ Did NOT change scoring math/weights in /src/core/scoring.ts
- ✅ Did NOT add invented heuristics outside observation-driven mapping
- ✅ Used observations + mapping rather than altering algorithms
- ✅ UI does not decide outcomes - only collects inputs & displays engine outputs
- ✅ Safety UX remains advisory only
