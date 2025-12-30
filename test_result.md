# Car Diagnostics App - Testing Document

## Test Environment
- Frontend: Vite + React + TypeScript running on localhost:3000
- Path: /app/car-diagnostics-app

## Features to Test

### 1. Vehicle Profiles (HARD GATE)
- [ ] Create a new vehicle profile with Name, Make, Model
- [ ] Vehicle profile persists in localStorage
- [ ] Diagnostics cannot begin without a vehicle
- [ ] Multiple vehicle profiles supported
- [ ] Clone Profile functionality
- [ ] Edit and Delete vehicle profiles

### 2. Observations System
- [ ] Observations categorized by domain (SAFETY, BATTERY, ELECTRICAL, etc.)
- [ ] Toggle observations YES/NO
- [ ] Observations persist per vehicle
- [ ] Free-text notes can be added

### 3. Diagnostic Flow
- [ ] Entry anchor selection (won't_start, noise, etc.)
- [ ] Run Diagnosis button works
- [ ] Results display with top hypothesis and confidence

### 4. Safety Hard Stops (Reroutes)
- [ ] Safety warnings display when safety-critical observations are marked YES
- [ ] User must acknowledge safety before continuing

### 5. Results + Context Panel
- [ ] Top hypothesis displayed
- [ ] Confidence band displayed
- [ ] Supporting observations shown

### 6. Maintenance
- [ ] Log maintenance events
- [ ] Update mileage
- [ ] View maintenance history

### 7. Settings
- [ ] Toggle notifications
- [ ] Toggle Pro features

## Incorporate User Feedback
- Test all navigation between tabs
- Verify localStorage persistence
- Test the complete diagnostic flow from vehicle creation to results
