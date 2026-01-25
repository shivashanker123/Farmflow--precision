# Smart Irrigation Features - Implementation Plan

## Executive Summary
After analyzing the FarmFlow codebase, I've identified what exists and what needs to be added to implement the 7 requested features.

---

## Current Codebase Analysis

### ✅ Verified: Features ARE Dynamically Used on Frontend

| Feature | Status | Frontend Usage | Verified |
|---------|--------|----------------|----------|
| Water Budget | 🟡 Basic | `WaterBudget.tsx` line 12: `const budgetStatus = getWaterBudgetStatus()` | ✅ Yes |
| Recommendations | 🟡 Basic | `Dashboard.tsx` line 48: `const recommendation = getRecommendation()` | ✅ Yes |
| Remaining Days | 🟡 Basic | `WaterBudget.tsx` lines 80, 283: displays days left | ✅ Yes |
| Rain Awareness | 🟡 Basic | `Dashboard.tsx` line 792: toggle switch for `rainExpected` | ✅ Yes |
| Pump Lock | ✅ Done | `Dashboard.tsx` line 50: `const pumpLockStatus = isPumpLocked()` | ✅ Yes |

**Conclusion:** All 5 existing features are properly wired to the frontend and dynamically calculated.

### Current Logic (Needs Enhancement)

**`getWaterBudgetStatus()`** - Only checks tank percentage:
```typescript
if (percentage > 50) return 'high';
if (percentage > 20) return 'medium';
return 'low';
```

**`getRecommendation()`** - Very simple logic:
```typescript
if (!isDry) return 'skip';        // moisture >= 40%
if (budget === 'high') return 'full';
return 'partial';                 // no percentages!
```

**`getRemainingDays()`** - Basic calculation:
```typescript
const remaining = tankCapacity - usedWater;
const dailyUsage = dailyWaterNeed * fieldSize * 100;
return Math.floor(remaining / dailyUsage);
```

---

## Feature Implementation Plan

### 1️⃣ Water Budget Engine (CRITICAL)

**Gap:** Current system only checks tank percentage. No seasonal planning.

**Changes:**

#### [MODIFY] `FarmContext.tsx`
Add new state and calculations:
```typescript
// New data fields
cropDuration: number;          // days (e.g., 90 for corn)
cropStartDate: string;         // ISO date
seasonalWaterNeeded: number;   // total liters for season
dailyWaterQuota: number;       // liters/day budget
todayWaterUsed: number;        // liters used today
```

Add new functions:
```typescript
getSeasonalBudget() → { needed, available, remaining, daysLeft }
getDailyQuota() → number (liters allowed today)
isWithinDailyBudget(liters: number) → boolean
getQuotaStatus() → 'on-track' | 'over-budget' | 'under-budget'
```

#### [MODIFY] `FarmSetupWizard.tsx`
Add step for crop duration input.

#### [MODIFY] `WaterBudget.tsx`
Display seasonal vs daily budget breakdown.

---

### 2️⃣ Deficit Irrigation Intelligence

**Gap:** Current `getRecommendation()` only returns 3 options without percentages.

**Changes:**

#### [MODIFY] `FarmContext.tsx`
Replace simple recommendation with graduated system:
```typescript
interface IrrigationRecommendation {
  action: 'irrigate' | 'skip';
  intensity: 100 | 70 | 40 | 0;    // percentage
  reason: string;
  volume: number;                   // recommended liters
}

getSmartRecommendation(): IrrigationRecommendation
```

Logic:
```
IF soilMoisture >= 70 → skip (0%)
ELSE IF budget=high AND stage='flowering' → full (100%)
ELSE IF budget=medium → reduced (70%)
ELSE IF budget=low → deficit (40%)
ELSE IF budget=critical → skip (0%)
```

#### [MODIFY] Dashboard indicator
Show percentage dial instead of just traffic light.

---

### 3️⃣ Crop Growth Stage Awareness

**Gap:** No crop lifecycle tracking.

**Changes:**

#### [MODIFY] `FarmContext.tsx`
Add growth stage logic:
```typescript
type CropStage = 'initial' | 'vegetative' | 'flowering' | 'maturity';

const STAGE_CONFIG = {
  corn: { initial: 0.2, vegetative: 0.35, flowering: 0.25, maturity: 0.2 },
  wheat: { initial: 0.15, vegetative: 0.3, flowering: 0.35, maturity: 0.2 },
  tomato: { initial: 0.2, vegetative: 0.3, flowering: 0.3, maturity: 0.2 },
};

const STRESS_TOLERANCE = {
  initial: 0.7,      // 70% tolerance
  vegetative: 0.5,   // 50% tolerance
  flowering: 0.1,    // 10% tolerance (critical!)
  maturity: 0.6,     // 60% tolerance
};

getCropStage(): CropStage
getStressToleranceToday(): number
```

#### [NEW] `CropStageIndicator.tsx`
Visual timeline showing current stage + water priority.

---

### 4️⃣ Rainfall Awareness Enhancement

**Gap:** Only has a manual boolean flag.

**Changes:**

#### [MODIFY] `FarmContext.tsx`
```typescript
rainfallToday: number;           // mm recorded
lastRainfallDate: string | null;
rainfallCredited: number;        // mm credited to budget

recordRainfall(mm: number): void
getRainfallCredit(): number      // reduces irrigation need
```

#### [MODIFY] `DeviceSettings.tsx` / Dashboard
Add "It Rained" button with mm input.

#### [OPTIONAL] Weather API integration
Fetch forecast and auto-set `rainExpected`.

---

### 5️⃣ Advisory Messages (EASY WIN)

**Gap:** No explanation of system decisions.

**Changes:**

#### [MODIFY] `FarmContext.tsx`
```typescript
interface Advisory {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'action';
  timestamp: Date;
}

getActiveAdvisories(): Advisory[]
```

Examples:
- "Irrigation skipped: soil moisture at 72%, above threshold"
- "Partial irrigation applied (70%): conserving water for flowering stage"
- "Water budget on track: 18 days remaining at current rate"

#### [NEW] `AdvisoryPanel.tsx`
Card on dashboard showing current advisories.

---

### 6️⃣ Water Savings & Impact Metrics

**Gap:** No tracking of savings vs traditional methods.

**Changes:**

#### [MODIFY] `FarmContext.tsx`
```typescript
interface ImpactMetrics {
  waterSavedLiters: number;
  waterSavedPercent: number;
  skippedIrrigations: number;
  deficitIrrigations: number;
  estimatedDaysExtended: number;
}

getImpactMetrics(): ImpactMetrics
logIrrigationEvent(type: 'full'|'partial'|'skip', liters: number): void
```

Calculation:
```
Traditional = dailyNeed × fieldSize × daysElapsed
Actual = totalWaterUsed
Saved = Traditional - Actual
Percent = (Saved / Traditional) × 100
```

#### [NEW] `ImpactDashboard.tsx`
Visual cards showing savings percentage, days extended, etc.

---

### 7️⃣ Fail-Safe Logic

**Gap:** No sensor failure detection.

**Changes:**

#### [MODIFY] `FarmContext.tsx`
```typescript
lastSensorReading: Date | null;
sensorStatus: 'healthy' | 'stale' | 'failed';
manualOverrideActive: boolean;

getSensorHealth(): { status, lastUpdate, isStale }
activateManualOverride(): void
getDefaultSafeIrrigation(): number  // fallback liters
```

Logic:
```
IF no reading change for 2+ hours → 'stale' warning
IF no reading for 6+ hours → 'failed' status
IF failed → use formula-based fallback
```

#### [MODIFY] `DeviceSettings.tsx`
Add sensor health indicator + manual override toggle.

---

## Database Schema Updates

```sql
-- Add to farm_settings
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS crop_duration INTEGER DEFAULT 90;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS crop_start_date DATE;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS today_water_used FLOAT DEFAULT 0;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS rainfall_today FLOAT DEFAULT 0;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS last_rainfall_date DATE;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS total_water_saved FLOAT DEFAULT 0;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS skipped_irrigations INTEGER DEFAULT 0;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS last_sensor_reading TIMESTAMP;
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS manual_override BOOLEAN DEFAULT FALSE;
```

---

## Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Water Budget Engine | Medium | 🔥 Critical |
| 2 | Advisory Messages | Low | High |
| 3 | Impact Metrics | Low | High |
| 4 | Deficit Irrigation | Medium | High |
| 5 | Crop Stage Awareness | Medium | Medium |
| 6 | Fail-Safe Logic | Low | Medium |
| 7 | Rainfall Enhancement | Low | Medium |

---

## Estimated Timeline
- **Phase 1 (Features 1, 2, 5, 6):** ~2-3 hours
- **Phase 2 (Features 3, 4, 7):** ~2 hours
- **Testing & Polish:** ~1 hour

**Total:** ~5-6 hours of implementation
