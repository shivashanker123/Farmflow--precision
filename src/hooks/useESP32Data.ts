import { useState, useEffect, useCallback, useRef } from 'react';

// ESP32 Configuration
export const ESP32_CONFIG = {
  IP: '192.168.4.1', // Default ESP32 AP mode IP - can be configured
  TIMEOUT: 3000, // 3 second timeout
  POLL_INTERVAL: 10000, // Poll every 10 seconds (increased for stability)
};

export interface SensorData {
  soilMoisture: number;
  temperature: number;
  humidity: number;
}

export interface ESP32State {
  isLive: boolean;
  sensorData: SensorData;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
}

// Stable fallback values (no random)
const FALLBACK_DATA: SensorData = {
  soilMoisture: 55,
  temperature: 28,
  humidity: 65,
};

// Last known values for persistence
let lastKnownData: SensorData = { ...FALLBACK_DATA };

export const useESP32Data = (espIP: string = ESP32_CONFIG.IP) => {
  const [state, setState] = useState<ESP32State>({
    isLive: false,
    sensorData: lastKnownData,
    lastUpdated: null,
    isLoading: false, // Start as not loading to prevent initial flicker
    error: null,
  });

  // Track consecutive failures for stable state transitions
  const failureCountRef = useRef(0);
  const successCountRef = useRef(0);
  const isInitializedRef = useRef(false);

  const fetchESP32Data = useCallback(async (): Promise<SensorData | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ESP32_CONFIG.TIMEOUT);

    try {
      const response = await fetch(`http://${espIP}/data`, {
        signal: controller.signal,
        mode: 'cors',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ESP32 returned ${response.status}`);
      }

      const data = await response.json();

      // Update last known data
      lastKnownData = {
        soilMoisture: data.soilMoisture ?? data.soil_moisture ?? lastKnownData.soilMoisture,
        temperature: data.temperature ?? data.temp ?? lastKnownData.temperature,
        humidity: data.humidity ?? lastKnownData.humidity,
      };

      return lastKnownData;
    } catch (error) {
      clearTimeout(timeoutId);
      return null;
    }
  }, [espIP]);

  const fetchData = useCallback(async () => {
    // Only show loading on initial fetch
    if (!isInitializedRef.current) {
      setState(prev => ({ ...prev, isLoading: true }));
    }

    const esp32Data = await fetchESP32Data();

    if (esp32Data) {
      // Success - reset failure count, increment success count
      failureCountRef.current = 0;
      successCountRef.current++;

      // Only switch to live after 2 consecutive successes (to prevent flicker)
      const shouldBeLive = successCountRef.current >= 2;

      setState(prev => ({
        isLive: shouldBeLive,
        sensorData: esp32Data,
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
      }));
    } else {
      // Failure - increment failure count, reset success count
      successCountRef.current = 0;
      failureCountRef.current++;

      // Only switch to fallback after 2 consecutive failures (to prevent flicker)
      const shouldBeFallback = failureCountRef.current >= 2;

      if (shouldBeFallback) {
        setState(prev => ({
          ...prev,
          isLive: false,
          isLoading: false,
          error: 'ESP32 offline - using fallback data',
        }));
      } else {
        // Keep previous state during transition period
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    }

    isInitializedRef.current = true;
  }, [fetchESP32Data]);

  // Initial fetch and polling
  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, ESP32_CONFIG.POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
};

// Motor/Pump control hook
export interface MotorState {
  isOn: boolean;
  isLoading: boolean;
  isLocked: boolean;
  lockReason: string | null;
}

export interface MotorControlOptions {
  soilMoisture: number;
  rainExpected: boolean;
}

export const useMotorControl = (
  espIP: string = ESP32_CONFIG.IP,
  options: MotorControlOptions
) => {
  const [motorState, setMotorState] = useState<MotorState>({
    isOn: false,
    isLoading: false,
    isLocked: false,
    lockReason: null,
  });

  // Check auto-lock conditions
  useEffect(() => {
    if (options.soilMoisture > 80) {
      setMotorState(prev => ({
        ...prev,
        isLocked: true,
        lockReason: 'Moisture levels optimal',
        isOn: false,
      }));
    } else if (options.rainExpected) {
      setMotorState(prev => ({
        ...prev,
        isLocked: true,
        lockReason: 'Rain expected',
        isOn: false,
      }));
    } else {
      setMotorState(prev => ({
        ...prev,
        isLocked: false,
        lockReason: null,
      }));
    }
  }, [options.soilMoisture, options.rainExpected]);

  const sendMotorCommand = useCallback(async (turnOn: boolean): Promise<boolean> => {
    if (motorState.isLocked) return false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ESP32_CONFIG.TIMEOUT);

    try {
      const endpoint = turnOn ? '/pump/on' : '/pump/off';
      const response = await fetch(`http://${espIP}${endpoint}`, {
        method: 'POST',
        signal: controller.signal,
        mode: 'cors',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      clearTimeout(timeoutId);
      // In demo mode, allow toggle even if ESP32 is offline
      return true;
    }
  }, [espIP, motorState.isLocked]);

  const toggleMotor = useCallback(async () => {
    if (motorState.isLocked) return;

    setMotorState(prev => ({ ...prev, isLoading: true }));

    const newState = !motorState.isOn;
    const success = await sendMotorCommand(newState);

    if (success) {
      setMotorState(prev => ({
        ...prev,
        isOn: newState,
        isLoading: false,
      }));
    } else {
      setMotorState(prev => ({ ...prev, isLoading: false }));
    }
  }, [motorState.isOn, motorState.isLocked, sendMotorCommand]);

  const turnOn = useCallback(async () => {
    if (motorState.isLocked || motorState.isOn) return;
    setMotorState(prev => ({ ...prev, isLoading: true }));
    const success = await sendMotorCommand(true);
    setMotorState(prev => ({
      ...prev,
      isOn: success ? true : prev.isOn,
      isLoading: false,
    }));
  }, [motorState.isLocked, motorState.isOn, sendMotorCommand]);

  const turnOff = useCallback(async () => {
    if (!motorState.isOn) return;
    setMotorState(prev => ({ ...prev, isLoading: true }));
    const success = await sendMotorCommand(false);
    setMotorState(prev => ({
      ...prev,
      isOn: success ? false : prev.isOn,
      isLoading: false,
    }));
  }, [motorState.isOn, sendMotorCommand]);

  return {
    ...motorState,
    toggleMotor,
    turnOn,
    turnOff,
  };
};
