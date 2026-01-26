import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type SoilType = 'sandy' | 'clay' | 'loam' | 'black';
export type IrrigationSource = 'tank' | 'borewell';
export type DataSource = 'live' | 'fallback';

/**
 * CROP GROWTH STAGES
 * Each stage has different water requirements and stress tolerance
 * - initial: Seedling establishment (high tolerance to mild stress)
 * - vegetative: Active growth phase (moderate tolerance)
 * - flowering: Critical reproductive stage (MINIMAL tolerance - must irrigate)
 * - maturity: Ripening phase (high tolerance, reducing water)
 */
export type CropStage = 'initial' | 'vegetative' | 'flowering' | 'maturity';

/**
 * SENSOR HEALTH STATUS
 * - healthy: Receiving readings within normal intervals (<2 hours)
 * - stale: No new reading for 2-6 hours (warning)
 * - failed: No reading for 6+ hours (use fallback logic)
 */
export type SensorHealth = 'healthy' | 'stale' | 'failed';

/**
 * IRRIGATION RECOMMENDATION (Graduated Deficit Irrigation)
 * Instead of simple on/off, we provide graduated recommendations:
 * - 100%: Full irrigation (soil very dry, budget available)
 * - 70%: Reduced irrigation (moderate stress, conserving water)
 * - 40%: Deficit irrigation (budget low, non-critical stage)
 * - 0%: Skip irrigation (soil wet or critical conservation)
 */
export interface IrrigationRecommendation {
  action: 'irrigate' | 'skip';
  intensity: 100 | 70 | 40 | 0;       // Percentage of full irrigation
  reason: string;                      // Human-readable explanation
  volume: number;                      // Recommended liters to apply
}

/**
 * ADVISORY MESSAGE
 * Explains WHY the system made a decision (builds farmer trust)
 */
export interface Advisory {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'action';
  timestamp: Date;
}

/**
 * IMPACT METRICS
 * Track water savings vs traditional scheduled irrigation
 * ASSUMPTION: Traditional = fixed daily schedule regardless of soil moisture
 */
export interface ImpactMetrics {
  waterSavedLiters: number;           // Actual savings in liters
  waterSavedPercent: number;          // Percentage saved vs traditional
  skippedIrrigations: number;         // Count of times we skipped
  deficitIrrigations: number;         // Count of partial irrigations
  estimatedDaysExtended: number;      // Extra days of water due to savings
}

/**
 * SEASONAL BUDGET
 * Calculates water requirements for entire crop season
 */
export interface SeasonalBudget {
  totalNeeded: number;                // Total liters needed for season
  totalAvailable: number;             // Tank capacity or seasonal allotment
  used: number;                        // Already consumed
  remaining: number;                   // What's left
  dailyQuota: number;                 // Allowed per day to last the season
  daysRemaining: number;              // Crop days left
  onTrack: boolean;                   // Are we within budget?
}

export interface FarmData {
  // ===== BASIC FARM INFO =====
  cropType: 'wheat' | 'corn' | 'tomato';
  fieldSize: number;                   // acres
  farmerName: string;
  soilType: SoilType;

  // ===== WATER SOURCE =====
  irrigationSource: IrrigationSource;
  tankCapacity: number;                // liters (for tank irrigation)
  flowRate: number;                    // liters/hour (for borewell)

  // ===== WATER USAGE TRACKING =====
  dailyWaterNeed: number;              // mm/day based on crop (from agronomic tables)
  usedWater: number;                   // liters used this season
  todayWaterUsed: number;              // liters used today (resets daily)
  pumpRunTime: number;                 // hours pumped today

  // ===== CROP LIFECYCLE (NEW: Water Budget Engine) =====
  /**
   * ASSUMPTION: Crop duration is provided during setup wizard
   * Common values: wheat=120, corn=90, tomato=75 days
   */
  cropDuration: number;                // Total days from sowing to harvest
  cropStartDate: string | null;        // ISO date string when crop was planted

  // ===== SENSOR DATA =====
  soilMoisture: number;                // percentage (0-100)
  temperature: number;                 // celsius
  humidity: number;                    // percentage
  sensorOnline: boolean;               // Is sensor connected?
  dataSource: DataSource;              // 'live' from ESP or 'fallback' from DB
  espIP: string;                       // ESP32/8266 IP address

  // ===== SENSOR HEALTH (NEW: Fail-Safe Logic) =====
  lastSensorReading: string | null;    // ISO timestamp of last reading
  sensorHealth: SensorHealth;          // healthy/stale/failed
  manualOverrideActive: boolean;       // Farmer override mode

  // ===== RAINFALL TRACKING (NEW: Rainfall Awareness) =====
  /**
   * ASSUMPTION: Farmer manually records rainfall via "It Rained" button
   * TODO: Future enhancement - integrate weather API for automatic detection
   */
  rainfallToday: number;               // mm of rain recorded today
  lastRainfallDate: string | null;     // ISO date of last rainfall
  rainfallCredited: number;            // mm credited to reduce irrigation

  // ===== WEATHER =====
  rainExpected: boolean;               // From weather forecast or manual toggle

  // ===== PUMP CONTROL =====
  pumpActive: boolean;                 // Is pump currently running?

  // ===== IMPACT TRACKING (NEW: Water Savings Metrics) =====
  /**
   * Track decisions for impact visualization
   * These accumulate over the season
   */
  totalWaterSaved: number;             // Cumulative liters saved
  skippedIrrigationCount: number;      // Times we recommended skip
  deficitIrrigationCount: number;      // Times we recommended partial
  fullIrrigationCount: number;         // Times we recommended full
}

const CROP_WATER_NEEDS: Record<string, number> = {
  wheat: 5,
  corn: 7,
  tomato: 6,
};

const DEFAULT_FARM_DATA: FarmData = {
  // ===== BASIC FARM INFO =====
  cropType: 'corn',
  fieldSize: 10,
  farmerName: 'Farmer',
  soilType: 'loam',

  // ===== WATER SOURCE =====
  irrigationSource: 'tank',
  tankCapacity: 50000,
  flowRate: 5000,

  // ===== WATER USAGE TRACKING =====
  dailyWaterNeed: 7,          // mm/day for corn (from CROP_WATER_NEEDS)
  usedWater: 0,
  todayWaterUsed: 0,
  pumpRunTime: 0,

  // ===== CROP LIFECYCLE =====
  /**
   * DEFAULT: 90 days for corn
   * ASSUMPTION: User will update during setup wizard
   */
  cropDuration: 90,
  cropStartDate: null,        // Will be set when farmer starts season

  // ===== SENSOR DATA =====
  soilMoisture: 65,
  temperature: 28,
  humidity: 65,
  sensorOnline: true,
  dataSource: 'fallback',
  espIP: '192.168.4.1',

  // ===== SENSOR HEALTH =====
  lastSensorReading: null,
  sensorHealth: 'healthy',
  manualOverrideActive: false,

  // ===== RAINFALL TRACKING =====
  rainfallToday: 0,
  lastRainfallDate: null,
  rainfallCredited: 0,

  // ===== WEATHER =====
  rainExpected: false,

  // ===== PUMP CONTROL =====
  pumpActive: false,

  // ===== IMPACT TRACKING =====
  totalWaterSaved: 0,
  skippedIrrigationCount: 0,
  deficitIrrigationCount: 0,
  fullIrrigationCount: 0,
};

interface FarmSetupParams {
  cropType: string;
  fieldSize: number;
  farmerName: string;
  soilType: SoilType;
  irrigationSource: IrrigationSource;
  tankCapacity?: number;
  flowRate?: number;
  cropDuration?: number;             // NEW: Days from sowing to harvest
  cropStartDate?: string;            // NEW: ISO date string
}

/**
 * FARM CONTEXT TYPE
 * Exposes all state and functions to React components
 */
interface FarmContextType {
  farmData: FarmData;
  isSetupComplete: boolean;
  isLoading: boolean;

  // ===== SETUP & SYNC =====
  completeFarmSetup: (params: FarmSetupParams) => void;
  syncToBackend: () => Promise<void>;

  // ===== SENSOR DATA UPDATES =====
  updateSoilMoisture: (value: number) => void;
  updateSensorData: (data: { soilMoisture?: number; temperature?: number; humidity?: number }) => void;
  setDataSource: (source: DataSource) => void;
  setEspIP: (ip: string) => void;
  toggleSensorOnline: () => void;

  // ===== PUMP CONTROL =====
  togglePump: () => void;
  setPumpActive: (active: boolean) => void;
  isPumpLocked: () => { locked: boolean; reason: string | null };

  // ===== WATER USAGE =====
  useWater: (liters: number) => void;
  addPumpRunTime: (hours: number) => void;
  getTotalPumped: () => number;

  // ===== WEATHER =====
  setRainExpected: (expected: boolean) => void;
  recordRainfall: (mm: number) => void;              // NEW: Log rainfall

  // ===== WATER BUDGET ENGINE (SMART IRRIGATION) =====
  /**
   * Returns high/medium/low based on remaining water vs seasonal need
   * EXISTING function - kept for backward compatibility
   */
  getWaterBudgetStatus: () => 'high' | 'medium' | 'low';

  /**
   * EXISTING: Simple recommendation (kept for backward compatibility)
   */
  getRecommendation: () => 'full' | 'partial' | 'skip';

  /**
   * NEW: Full seasonal budget breakdown
   * Returns detailed budget info for WaterBudget page
   */
  getSeasonalBudget: () => SeasonalBudget;

  /**
   * NEW: Smart recommendation with graduated percentages
   * Takes into account: soil moisture, water budget, crop stage, rainfall
   */
  getSmartRecommendation: () => IrrigationRecommendation;

  /**
   * EXISTING: Days of water remaining
   */
  getRemainingDays: () => number;

  // ===== CROP STAGE AWARENESS =====
  /**
   * NEW: Calculate current crop growth stage based on days since planting
   * Returns: initial | vegetative | flowering | maturity
   */
  getCropStage: () => CropStage;

  /**
   * NEW: Get stress tolerance for current stage (0.0 to 1.0)
   * Lower = more critical (flowering is 0.1 = only 10% tolerance)
   */
  getStressTolerance: () => number;

  // ===== ADVISORIES =====
  /**
   * NEW: Get current advisory messages explaining system decisions
   * Displayed on dashboard to build farmer trust
   */
  getActiveAdvisories: () => Advisory[];

  // ===== IMPACT METRICS =====
  /**
   * NEW: Calculate water savings vs traditional irrigation
   */
  getImpactMetrics: () => ImpactMetrics;

  /**
   * NEW: Log an irrigation event for impact tracking
   */
  logIrrigationEvent: (type: 'full' | 'partial' | 'skip', liters: number) => void;

  // ===== SENSOR HEALTH =====
  /**
   * NEW: Check sensor health status
   * Used for fail-safe logic and UI warnings
   */
  getSensorHealth: () => { status: SensorHealth; lastUpdate: Date | null; isStale: boolean };

  /**
   * NEW: Toggle manual override mode
   * When active, farmer can bypass smart recommendations
   */
  toggleManualOverride: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

// Backend API URL - empty for Vercel serverless (same domain)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const FarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  // Initialize from localStorage to prevent redirect loops
  const [isSetupComplete, setIsSetupCompleteState] = useState(() => {
    return localStorage.getItem('farmflow_setup_complete') === 'true';
  });
  const [farmData, setFarmData] = useState<FarmData>(DEFAULT_FARM_DATA);
  const [syncTimeout, setSyncTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Wrapper to persist setup complete state
  const setIsSetupComplete = (value: boolean) => {
    setIsSetupCompleteState(value);
    if (value) {
      localStorage.setItem('farmflow_setup_complete', 'true');
    } else {
      localStorage.removeItem('farmflow_setup_complete');
    }
  };

  // Fetch farm data from backend when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchFarmData();
    } else {
      // Reset to defaults when logged out
      setFarmData(DEFAULT_FARM_DATA);
      setIsSetupComplete(false);
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  // Update farmer name when user changes
  useEffect(() => {
    if (user) {
      setFarmData(prev => ({ ...prev, farmerName: user.name }));
    }
  }, [user]);

  const fetchFarmData = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/farm`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFarmData(prev => ({
          ...prev,
          cropType: data.crop_type as FarmData['cropType'],
          fieldSize: data.field_size,
          tankCapacity: data.tank_capacity,
          dailyWaterNeed: data.daily_water_need,
          usedWater: data.used_water,
          soilMoisture: data.soil_moisture,
          sensorOnline: data.sensor_online,
          pumpActive: data.pump_active,
          soilType: data.soil_type as SoilType,
          irrigationSource: data.irrigation_source as IrrigationSource,
          flowRate: data.flow_rate,
          pumpRunTime: data.pump_run_time,
          espIP: data.esp_ip,
          rainExpected: data.rain_expected,
        }));
        // If farm has been configured (field size > 0 AND crop type is set), mark as complete
        const isConfigured = data.field_size > 0 && data.crop_type && data.crop_type !== '';
        setIsSetupComplete(isConfigured);
      }
    } catch (error) {
      console.error('Failed to fetch farm data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced sync to backend
  const syncToBackend = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    try {
      await fetch(`${API_BASE_URL}/api/farm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Core farm settings
          crop_type: farmData.cropType,
          field_size: farmData.fieldSize,
          tank_capacity: farmData.tankCapacity,
          daily_water_need: farmData.dailyWaterNeed,
          used_water: farmData.usedWater,
          soil_moisture: farmData.soilMoisture,
          sensor_online: farmData.sensorOnline,
          pump_active: farmData.pumpActive,
          soil_type: farmData.soilType,
          irrigation_source: farmData.irrigationSource,
          flow_rate: farmData.flowRate,
          pump_run_time: farmData.pumpRunTime,
          esp_ip: farmData.espIP,
          rain_expected: farmData.rainExpected,

          // NEW: Crop Lifecycle
          crop_duration: farmData.cropDuration,
          crop_start_date: farmData.cropStartDate,
          today_water_used: farmData.todayWaterUsed,

          // NEW: Sensor Health
          last_sensor_reading: farmData.lastSensorReading,
          sensor_health: farmData.sensorHealth,
          manual_override_active: farmData.manualOverrideActive,

          // NEW: Rainfall Tracking
          rainfall_today: farmData.rainfallToday,
          last_rainfall_date: farmData.lastRainfallDate,
          rainfall_credited: farmData.rainfallCredited,

          // NEW: Impact Tracking
          total_water_saved: farmData.totalWaterSaved,
          skipped_irrigation_count: farmData.skippedIrrigationCount,
          deficit_irrigation_count: farmData.deficitIrrigationCount,
          full_irrigation_count: farmData.fullIrrigationCount,
        }),
      });
    } catch (error) {
      console.error('Failed to sync farm data:', error);
    }
  }, [token, isAuthenticated, farmData]);

  // Auto-sync to backend when farm data changes (debounced)
  const scheduleSync = useCallback(() => {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    const timeout = setTimeout(() => {
      syncToBackend();
    }, 2000); // Wait 2 seconds after last change before syncing
    setSyncTimeout(timeout);
  }, [syncTimeout, syncToBackend]);

  const completeFarmSetup = async (params: FarmSetupParams) => {
    const dailyNeed = CROP_WATER_NEEDS[params.cropType] || 5;
    const newData = {
      ...farmData,
      cropType: params.cropType as FarmData['cropType'],
      fieldSize: params.fieldSize,
      tankCapacity: params.tankCapacity || 50000,
      dailyWaterNeed: dailyNeed,
      farmerName: params.farmerName,
      soilType: params.soilType,
      irrigationSource: params.irrigationSource,
      flowRate: params.flowRate || 5000,
      pumpRunTime: 0,
      usedWater: 0,
      // NEW: Crop lifecycle from wizard
      cropDuration: params.cropDuration || 90,
      cropStartDate: params.cropStartDate || new Date().toISOString().split('T')[0],
    };
    setFarmData(newData);
    setIsSetupComplete(true);

    // Immediately sync to backend
    if (token && isAuthenticated) {
      try {
        await fetch(`${API_BASE_URL}/api/farm`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            crop_type: newData.cropType,
            field_size: newData.fieldSize,
            tank_capacity: newData.tankCapacity,
            daily_water_need: newData.dailyWaterNeed,
            used_water: newData.usedWater,
            soil_type: newData.soilType,
            irrigation_source: newData.irrigationSource,
            flow_rate: newData.flowRate,
            pump_run_time: newData.pumpRunTime,
            // NEW: Crop lifecycle
            crop_duration: newData.cropDuration,
            crop_start_date: newData.cropStartDate,
          }),
        });
      } catch (error) {
        console.error('Failed to save farm setup:', error);
      }
    }
  };

  const updateSoilMoisture = (value: number) => {
    setFarmData(prev => ({ ...prev, soilMoisture: value }));
    scheduleSync();
  };

  const updateSensorData = (data: { soilMoisture?: number; temperature?: number; humidity?: number }) => {
    setFarmData(prev => ({
      ...prev,
      soilMoisture: data.soilMoisture ?? prev.soilMoisture,
      temperature: data.temperature ?? prev.temperature,
      humidity: data.humidity ?? prev.humidity,
    }));
  };

  const setDataSource = (source: DataSource) => {
    setFarmData(prev => ({ ...prev, dataSource: source }));
  };

  const togglePump = () => {
    const { locked } = isPumpLocked();
    if (!locked) {
      setFarmData(prev => ({ ...prev, pumpActive: !prev.pumpActive }));
      scheduleSync();
    }
  };

  const setPumpActive = (active: boolean) => {
    const { locked } = isPumpLocked();
    if (!locked || !active) {
      setFarmData(prev => ({ ...prev, pumpActive: active }));
      scheduleSync();
    }
  };

  const toggleSensorOnline = () => {
    setFarmData(prev => ({ ...prev, sensorOnline: !prev.sensorOnline }));
    scheduleSync();
  };

  const setRainExpected = (expected: boolean) => {
    setFarmData(prev => ({ ...prev, rainExpected: expected }));
    scheduleSync();
  };

  const setEspIP = (ip: string) => {
    setFarmData(prev => ({ ...prev, espIP: ip }));
    scheduleSync();
  };

  // SAFETY CONSTANTS
  const PUMP_SAFETY = {
    maxDurationHours: 1,      // Max 1 hour continuous operation
    cooldownMinutes: 15,      // 15 min cooldown between cycles
  };

  const isPumpLocked = (): { locked: boolean; reason: string | null } => {
    // Safety: Max moisture threshold
    if (farmData.soilMoisture > 80) {
      return { locked: true, reason: 'Moisture levels optimal (>80%)' };
    }

    // Safety: Rain expected
    if (farmData.rainExpected) {
      return { locked: true, reason: 'Rain expected - irrigation not needed' };
    }

    // Safety: Max pump duration exceeded
    if (farmData.pumpRunTime >= PUMP_SAFETY.maxDurationHours) {
      return { locked: true, reason: `Max pump duration reached (${PUMP_SAFETY.maxDurationHours}h). Allow cooldown.` };
    }

    // Safety: Water budget critically low
    const budgetStatus = getWaterBudgetStatus();
    if (budgetStatus === 'low' && farmData.soilMoisture > 40) {
      return { locked: true, reason: 'Water budget low - conserving for critical need' };
    }

    return { locked: false, reason: null };
  };

  const useWater = (liters: number) => {
    setFarmData(prev => ({
      ...prev,
      usedWater: Math.min(prev.usedWater + liters, prev.tankCapacity),
    }));
    scheduleSync();
  };

  const addPumpRunTime = (hours: number) => {
    setFarmData(prev => ({
      ...prev,
      pumpRunTime: prev.pumpRunTime + hours,
    }));
    scheduleSync();
  };

  const getTotalPumped = (): number => {
    return farmData.pumpRunTime * farmData.flowRate;
  };

  const getWaterBudgetStatus = (): 'high' | 'medium' | 'low' => {
    if (farmData.irrigationSource === 'borewell') {
      const dailyTarget = 8;
      const usageRatio = farmData.pumpRunTime / dailyTarget;
      if (usageRatio < 0.3) return 'high';
      if (usageRatio < 0.7) return 'medium';
      return 'low';
    }
    const remaining = farmData.tankCapacity - farmData.usedWater;
    const percentage = (remaining / farmData.tankCapacity) * 100;
    if (percentage > 50) return 'high';
    if (percentage > 20) return 'medium';
    return 'low';
  };

  const getRecommendation = (): 'full' | 'partial' | 'skip' => {
    const isDry = farmData.soilMoisture < 40;
    const budget = getWaterBudgetStatus();

    if (!isDry) return 'skip';
    if (budget === 'high') return 'full';
    return 'partial';
  };

  const getRemainingDays = (): number => {
    if (farmData.irrigationSource === 'borewell') {
      const dailyUsage = farmData.dailyWaterNeed * farmData.fieldSize * 100;
      const pumpedPerDay = farmData.flowRate * 4;
      return Math.floor(pumpedPerDay / dailyUsage * 30);
    }
    const remaining = farmData.tankCapacity - farmData.usedWater;
    const dailyUsage = farmData.dailyWaterNeed * farmData.fieldSize * 100;
    return Math.floor(remaining / dailyUsage);
  };

  // ============================================================
  // NEW SMART IRRIGATION FUNCTIONS
  // ============================================================

  /**
   * RECORD RAINFALL
   * Farmer manually logs rainfall via "It Rained" button
   * 
   * ASSUMPTION: 1mm of rain ≈ 1L/m² reduces irrigation need
   * FORMULA: rainfallCredited = mm * efficiency (70% absorption)
   * TODO: Future - integrate weather API for automatic detection
   */
  const recordRainfall = (mm: number): void => {
    const RAINFALL_EFFICIENCY = 0.7; // 70% of rainfall is absorbed by soil
    const creditedMm = mm * RAINFALL_EFFICIENCY;

    setFarmData(prev => ({
      ...prev,
      rainfallToday: prev.rainfallToday + mm,
      rainfallCredited: prev.rainfallCredited + creditedMm,
      lastRainfallDate: new Date().toISOString(),
    }));
    scheduleSync();
  };

  /**
   * GET SEASONAL BUDGET
   * Calculates water requirements for entire crop season
   * 
   * FORMULA:
   * - totalNeeded = dailyWaterNeed (mm) × fieldSize (acres) × 4047 (m²/acre) × cropDuration
   * - dailyQuota = totalAvailable / daysRemaining
   * 
   * ASSUMPTION: Farmer has limited water (tank) or unlimited (borewell)
   * For borewell: totalAvailable is estimated from sustainable pump hours/day
   */
  const getSeasonalBudget = (): SeasonalBudget => {
    const now = new Date();
    const startDate = farmData.cropStartDate ? new Date(farmData.cropStartDate) : now;
    const daysSincePlanting = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(1, farmData.cropDuration - daysSincePlanting);

    // Calculate total water needed for season
    // Formula: mm/day × acres × 4047 m²/acre × days (liters, since 1mm = 1L/m²)
    const SQMETERS_PER_ACRE = 4047;
    const totalNeeded = farmData.dailyWaterNeed * farmData.fieldSize * SQMETERS_PER_ACRE * farmData.cropDuration;

    // Available water depends on source
    let totalAvailable: number;
    if (farmData.irrigationSource === 'tank') {
      totalAvailable = farmData.tankCapacity;
    } else {
      // Borewell: estimate 4 hours/day × flowRate × remaining days
      // ASSUMPTION: Sustainable pumping is ~4 hours per day
      const SUSTAINABLE_PUMP_HOURS = 4;
      totalAvailable = farmData.flowRate * SUSTAINABLE_PUMP_HOURS * daysRemaining;
    }

    const used = farmData.usedWater;
    const remaining = Math.max(0, totalAvailable - used);
    const dailyQuota = daysRemaining > 0 ? remaining / daysRemaining : 0;

    // Check if on track: used should be proportional to days elapsed
    const expectedUsage = (daysSincePlanting / farmData.cropDuration) * totalNeeded;
    const onTrack = used <= expectedUsage * 1.1; // Allow 10% buffer

    return {
      totalNeeded: Math.round(totalNeeded),
      totalAvailable: Math.round(totalAvailable),
      used: Math.round(used),
      remaining: Math.round(remaining),
      dailyQuota: Math.round(dailyQuota),
      daysRemaining,
      onTrack,
    };
  };

  /**
   * GET CROP STAGE
   * Determines current growth stage based on days since planting
   * 
   * CROP STAGE PERCENTAGES (typical):
   * - initial: 0-20% of duration (seedling establishment)
   * - vegetative: 20-55% (active growth)
   * - flowering: 55-80% (reproductive, CRITICAL for water)
   * - maturity: 80-100% (ripening, reducing water)
   * 
   * ASSUMPTION: All crops follow similar patterns (simplified)
   * TODO: Add crop-specific stage configurations
   */
  const getCropStage = (): CropStage => {
    if (!farmData.cropStartDate) return 'vegetative'; // Default if no start date

    const now = new Date();
    const startDate = new Date(farmData.cropStartDate);
    const daysSincePlanting = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progress = daysSincePlanting / farmData.cropDuration;

    if (progress < 0.2) return 'initial';
    if (progress < 0.55) return 'vegetative';
    if (progress < 0.8) return 'flowering';
    return 'maturity';
  };

  /**
   * GET STRESS TOLERANCE
   * Returns how much water stress the crop can tolerate at current stage
   * 
   * VALUES:
   * - 0.7 (70%): High tolerance - can skip irrigation
   * - 0.5 (50%): Moderate tolerance
   * - 0.1 (10%): Critical - MUST irrigate (flowering stage)
   * - 0.6 (60%): Reducing water for maturity
   */
  const getStressTolerance = (): number => {
    const STRESS_TOLERANCE_BY_STAGE: Record<CropStage, number> = {
      initial: 0.7,      // Seedlings can tolerate mild stress
      vegetative: 0.5,   // Moderate tolerance
      flowering: 0.1,    // CRITICAL - minimal tolerance
      maturity: 0.6,     // Can reduce water for ripening
    };

    const stage = getCropStage();
    return STRESS_TOLERANCE_BY_STAGE[stage];
  };

  /**
   * GET SMART RECOMMENDATION
   * Graduated deficit irrigation based on multiple factors
   * 
   * DECISION TREE:
   * 1. If soil moisture >= 70% → SKIP (already wet)
   * 2. If rain expected → SKIP (wait for rain)
   * 3. If flowering stage + moisture < 50% → FULL (critical period)
   * 4. If budget is high → based on moisture level
   * 5. If budget is medium → REDUCED (70%)
   * 6. If budget is low → DEFICIT (40%)
   * 7. If budget is critical → SKIP (conserve)
   * 
   * ASSUMPTION: Thresholds are simplified for demo
   * TODO: Add soil type adjustments (sandy drains faster)
   */
  const getSmartRecommendation = (): IrrigationRecommendation => {
    const budget = getSeasonalBudget();
    const stage = getCropStage();
    const stressTolerance = getStressTolerance();
    const moisture = farmData.soilMoisture;

    // Calculate base irrigation volume
    // Formula: dailyNeed × fieldSize × 4047 (liters)
    const SQMETERS_PER_ACRE = 4047;
    const fullVolume = farmData.dailyWaterNeed * farmData.fieldSize * SQMETERS_PER_ACRE;

    // Decision 1: Already wet
    if (moisture >= 70) {
      return {
        action: 'skip',
        intensity: 0,
        reason: `Soil moisture at ${moisture}% - already optimal`,
        volume: 0,
      };
    }

    // Decision 2: Rain expected
    if (farmData.rainExpected) {
      return {
        action: 'skip',
        intensity: 0,
        reason: 'Rain expected - saving water',
        volume: 0,
      };
    }

    // Decision 3: Flowering stage is critical
    if (stage === 'flowering' && moisture < 50) {
      return {
        action: 'irrigate',
        intensity: 100,
        reason: '⚠️ Critical flowering stage - full irrigation required',
        volume: Math.round(fullVolume),
      };
    }

    // Decision 4-7: Based on budget status
    const budgetRatio = budget.remaining / budget.totalAvailable;

    if (budgetRatio > 0.5) {
      // High budget
      if (moisture < 30) {
        return {
          action: 'irrigate',
          intensity: 100,
          reason: 'Low moisture + high budget - full irrigation',
          volume: Math.round(fullVolume),
        };
      } else {
        return {
          action: 'irrigate',
          intensity: 70,
          reason: 'Moderate moisture - reduced irrigation',
          volume: Math.round(fullVolume * 0.7),
        };
      }
    } else if (budgetRatio > 0.2) {
      // Medium budget
      return {
        action: 'irrigate',
        intensity: 70,
        reason: 'Conserving water - 70% irrigation',
        volume: Math.round(fullVolume * 0.7),
      };
    } else if (budgetRatio > 0.1) {
      // Low budget
      return {
        action: 'irrigate',
        intensity: 40,
        reason: '⚠️ Low water budget - deficit irrigation (40%)',
        volume: Math.round(fullVolume * 0.4),
      };
    } else {
      // Critical - conserve
      return {
        action: 'skip',
        intensity: 0,
        reason: '🚨 Critical water shortage - skipping to preserve supply',
        volume: 0,
      };
    }
  };

  /**
   * GET ACTIVE ADVISORIES
   * Generates context-aware messages explaining system decisions
   * Displayed on dashboard to build farmer trust
   */
  const getActiveAdvisories = (): Advisory[] => {
    const advisories: Advisory[] = [];
    const now = new Date();

    // Advisory 1: Irrigation recommendation
    const rec = getSmartRecommendation();
    advisories.push({
      id: 'irrigation-rec',
      title: rec.action === 'irrigate' ? 'Irrigation Recommended' : 'Irrigation Skipped',
      message: rec.reason,
      type: rec.action === 'irrigate' ? 'action' : 'info',
      timestamp: now,
    });

    // Advisory 2: Crop stage
    const stage = getCropStage();
    if (stage === 'flowering') {
      advisories.push({
        id: 'flowering-warning',
        title: 'Critical Growth Stage',
        message: 'Crop is in flowering stage - water stress will impact yield significantly',
        type: 'warning',
        timestamp: now,
      });
    }

    // Advisory 3: Budget status
    const budget = getSeasonalBudget();
    if (!budget.onTrack) {
      advisories.push({
        id: 'budget-warning',
        title: 'Over Budget',
        message: `Water usage is higher than planned. ${budget.daysRemaining} days remaining with ${Math.round(budget.remaining)} liters.`,
        type: 'warning',
        timestamp: now,
      });
    }

    // Advisory 4: Sensor health
    const health = getSensorHealth();
    if (health.status !== 'healthy') {
      advisories.push({
        id: 'sensor-health',
        title: health.status === 'stale' ? 'Sensor Data Stale' : 'Sensor Offline',
        message: health.status === 'stale'
          ? 'No new readings for 2+ hours. Using last known values.'
          : 'Sensor offline for 6+ hours. Using formula-based fallback.',
        type: 'warning',
        timestamp: now,
      });
    }

    // Advisory 5: Recent rainfall
    if (farmData.rainfallToday > 0) {
      advisories.push({
        id: 'rainfall',
        title: 'Rainfall Recorded',
        message: `${farmData.rainfallToday}mm of rain today. Irrigation needs reduced.`,
        type: 'success',
        timestamp: now,
      });
    }

    return advisories;
  };

  /**
   * GET IMPACT METRICS
   * Calculate water savings vs traditional scheduled irrigation
   * 
   * ASSUMPTION: Traditional = fixed daily irrigation regardless of moisture
   * FORMULA: Saved = Traditional - Actual
   */
  const getImpactMetrics = (): ImpactMetrics => {
    const now = new Date();
    const startDate = farmData.cropStartDate ? new Date(farmData.cropStartDate) : now;
    const daysSincePlanting = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Traditional usage: daily water need × field size × days
    const SQMETERS_PER_ACRE = 4047;
    const traditionalDailyUsage = farmData.dailyWaterNeed * farmData.fieldSize * SQMETERS_PER_ACRE;
    const traditionalTotal = traditionalDailyUsage * daysSincePlanting;

    // Actual usage
    const actualTotal = farmData.usedWater;

    // Savings
    const savedLiters = Math.max(0, traditionalTotal - actualTotal);
    const savedPercent = traditionalTotal > 0 ? (savedLiters / traditionalTotal) * 100 : 0;

    // Days extended: how many extra days of water we have due to savings
    const dailyQuota = getSeasonalBudget().dailyQuota;
    const daysExtended = dailyQuota > 0 ? Math.floor(savedLiters / dailyQuota) : 0;

    return {
      waterSavedLiters: Math.round(savedLiters),
      waterSavedPercent: Math.round(savedPercent),
      skippedIrrigations: farmData.skippedIrrigationCount,
      deficitIrrigations: farmData.deficitIrrigationCount,
      estimatedDaysExtended: daysExtended,
    };
  };

  /**
   * LOG IRRIGATION EVENT
   * Called when pump is turned on/off to track impact metrics
   */
  const logIrrigationEvent = (type: 'full' | 'partial' | 'skip', liters: number): void => {
    setFarmData(prev => {
      const updates = { ...prev };

      switch (type) {
        case 'full':
          updates.fullIrrigationCount = prev.fullIrrigationCount + 1;
          updates.usedWater = prev.usedWater + liters;
          break;
        case 'partial':
          updates.deficitIrrigationCount = prev.deficitIrrigationCount + 1;
          updates.usedWater = prev.usedWater + liters;
          // Track water saved (full - partial)
          const SQMETERS_PER_ACRE = 4047;
          const fullVolume = prev.dailyWaterNeed * prev.fieldSize * SQMETERS_PER_ACRE;
          updates.totalWaterSaved = prev.totalWaterSaved + (fullVolume - liters);
          break;
        case 'skip':
          updates.skippedIrrigationCount = prev.skippedIrrigationCount + 1;
          // Track water saved (full volume)
          const fullVol = prev.dailyWaterNeed * prev.fieldSize * 4047;
          updates.totalWaterSaved = prev.totalWaterSaved + fullVol;
          break;
      }

      return updates;
    });
    scheduleSync();
  };

  /**
   * GET SENSOR HEALTH
   * Determines sensor status based on time since last reading
   * 
   * THRESHOLDS:
   * - healthy: <2 hours since last reading
   * - stale: 2-6 hours (warning)
   * - failed: >6 hours (use fallback)
   */
  const getSensorHealth = (): { status: SensorHealth; lastUpdate: Date | null; isStale: boolean } => {
    if (!farmData.lastSensorReading) {
      // No reading yet - assume healthy if sensor is marked online
      return {
        status: farmData.sensorOnline ? 'healthy' : 'failed',
        lastUpdate: null,
        isStale: !farmData.sensorOnline,
      };
    }

    const lastReading = new Date(farmData.lastSensorReading);
    const now = new Date();
    const hoursSinceReading = (now.getTime() - lastReading.getTime()) / (1000 * 60 * 60);

    let status: SensorHealth;
    if (hoursSinceReading < 2) {
      status = 'healthy';
    } else if (hoursSinceReading < 6) {
      status = 'stale';
    } else {
      status = 'failed';
    }

    return {
      status,
      lastUpdate: lastReading,
      isStale: status !== 'healthy',
    };
  };

  /**
   * TOGGLE MANUAL OVERRIDE
   * When active, farmer can bypass smart recommendations
   * Used when farmer knows conditions better than sensors
   */
  const toggleManualOverride = (): void => {
    setFarmData(prev => ({
      ...prev,
      manualOverrideActive: !prev.manualOverrideActive,
    }));
    scheduleSync();
  };

  return (
    <FarmContext.Provider
      value={{
        farmData,
        isSetupComplete,
        isLoading,

        // Setup & Sync
        completeFarmSetup,
        syncToBackend,

        // Sensor Data
        updateSoilMoisture,
        updateSensorData,
        setDataSource,
        setEspIP,
        toggleSensorOnline,

        // Pump Control
        togglePump,
        setPumpActive,
        isPumpLocked,

        // Water Usage
        useWater,
        addPumpRunTime,
        getTotalPumped,

        // Weather
        setRainExpected,
        recordRainfall,

        // Water Budget Engine
        getWaterBudgetStatus,
        getRecommendation,
        getSeasonalBudget,
        getSmartRecommendation,
        getRemainingDays,

        // Crop Stage
        getCropStage,
        getStressTolerance,

        // Advisories & Metrics
        getActiveAdvisories,
        getImpactMetrics,
        logIrrigationEvent,

        // Sensor Health
        getSensorHealth,
        toggleManualOverride,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
