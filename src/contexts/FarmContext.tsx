import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type SoilType = 'sandy' | 'clay' | 'loam' | 'black';
export type IrrigationSource = 'tank' | 'borewell';
export type DataSource = 'live' | 'fallback';

export interface FarmData {
  cropType: 'wheat' | 'corn' | 'tomato';
  fieldSize: number; // acres
  tankCapacity: number; // liters (for tank)
  dailyWaterNeed: number; // mm/day based on crop
  usedWater: number; // liters used
  soilMoisture: number; // percentage
  temperature: number; // celsius
  humidity: number; // percentage
  sensorOnline: boolean;
  pumpActive: boolean;
  farmerName: string;
  soilType: SoilType;
  irrigationSource: IrrigationSource;
  flowRate: number; // liters/hour (for borewell)
  pumpRunTime: number; // hours pumped today
  dataSource: DataSource; // live sensor or fallback API
  espIP: string; // ESP32 IP address
  rainExpected: boolean; // Mock rain prediction
}

const CROP_WATER_NEEDS: Record<string, number> = {
  wheat: 5,
  corn: 7,
  tomato: 6,
};

const DEFAULT_FARM_DATA: FarmData = {
  cropType: 'corn',
  fieldSize: 10,
  tankCapacity: 50000,
  dailyWaterNeed: 7,
  usedWater: 0,
  soilMoisture: 65,
  temperature: 28,
  humidity: 65,
  sensorOnline: true,
  pumpActive: false,
  farmerName: 'Farmer',
  soilType: 'loam',
  irrigationSource: 'tank',
  flowRate: 5000,
  pumpRunTime: 0,
  dataSource: 'fallback',
  espIP: '192.168.4.1',
  rainExpected: false,
};

interface FarmSetupParams {
  cropType: string;
  fieldSize: number;
  farmerName: string;
  soilType: SoilType;
  irrigationSource: IrrigationSource;
  tankCapacity?: number;
  flowRate?: number;
}

interface FarmContextType {
  farmData: FarmData;
  isSetupComplete: boolean;
  isLoading: boolean;
  completeFarmSetup: (params: FarmSetupParams) => void;
  updateSoilMoisture: (value: number) => void;
  updateSensorData: (data: { soilMoisture?: number; temperature?: number; humidity?: number }) => void;
  setDataSource: (source: DataSource) => void;
  togglePump: () => void;
  setPumpActive: (active: boolean) => void;
  toggleSensorOnline: () => void;
  useWater: (liters: number) => void;
  addPumpRunTime: (hours: number) => void;
  getWaterBudgetStatus: () => 'high' | 'medium' | 'low';
  getRecommendation: () => 'full' | 'partial' | 'skip';
  getRemainingDays: () => number;
  getTotalPumped: () => number;
  setRainExpected: (expected: boolean) => void;
  setEspIP: (ip: string) => void;
  isPumpLocked: () => { locked: boolean; reason: string | null };
  syncToBackend: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

// Backend API URL - empty for Vercel serverless (same domain)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const FarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [farmData, setFarmData] = useState<FarmData>(DEFAULT_FARM_DATA);
  const [syncTimeout, setSyncTimeout] = useState<NodeJS.Timeout | null>(null);

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
        // If farm has been configured (field size > 0 and crop type set), mark as complete
        setIsSetupComplete(data.field_size > 0);
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

  const isPumpLocked = (): { locked: boolean; reason: string | null } => {
    if (farmData.soilMoisture > 80) {
      return { locked: true, reason: 'Moisture levels optimal' };
    }
    if (farmData.rainExpected) {
      return { locked: true, reason: 'Rain expected' };
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

  return (
    <FarmContext.Provider
      value={{
        farmData,
        isSetupComplete,
        isLoading,
        completeFarmSetup,
        updateSoilMoisture,
        updateSensorData,
        setDataSource,
        togglePump,
        setPumpActive,
        toggleSensorOnline,
        useWater,
        addPumpRunTime,
        getWaterBudgetStatus,
        getRecommendation,
        getRemainingDays,
        getTotalPumped,
        setRainExpected,
        setEspIP,
        isPumpLocked,
        syncToBackend,
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
