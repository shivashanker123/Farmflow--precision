import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useFarm } from '@/contexts/FarmContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Wifi,
  WifiOff,
  Radio,
  Signal,
  ThermometerSun,
  RefreshCcw,
  CheckCircle,
  AlertTriangle,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeviceSettingsComponent from '@/components/farm/DeviceSettings';
import SensorGraph from '@/components/farm/SensorGraph';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface Device {
  id: string;
  user_id: number;
  name: string;
  created_at: string;
}

interface DeviceReading {
  device_id: string;
  soil_moisture: number;
  temperature: number | null;
  humidity: number | null;
  timestamp: string;
}

interface DeviceStatus {
  device: Device;
  isOnline: boolean;
  lastReading: DeviceReading | null;
  timeSinceReading: string;
}

const DeviceSettings = () => {
  const { farmData } = useFarm();
  const { token } = useAuth();
  const [deviceStatuses, setDeviceStatuses] = useState<DeviceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all devices and their latest readings
  const fetchDevicesWithStatus = async () => {
    if (!token) return;

    try {
      // Fetch devices
      const devicesResponse = await fetch(`${API_BASE_URL}/api/devices`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!devicesResponse.ok) {
        setDeviceStatuses([]);
        return;
      }

      const devicesData = await devicesResponse.json();
      const devices: Device[] = devicesData.devices || [];

      // For each device, fetch latest reading
      const statuses: DeviceStatus[] = await Promise.all(
        devices.map(async (device) => {
          try {
            const readingsResponse = await fetch(
              `${API_BASE_URL}/api/devices/${device.id}/readings?limit=1`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const readings = readingsResponse.ok ? await readingsResponse.json() : [];
            const lastReading = readings.length > 0 ? readings[0] : null;

            // Device is "online" if last reading was within 10 minutes
            const isOnline = lastReading
              ? (Date.now() - new Date(lastReading.timestamp).getTime()) < 10 * 60 * 1000
              : false;

            // Calculate time since last reading
            let timeSinceReading = 'Never';
            if (lastReading) {
              const diffMs = Date.now() - new Date(lastReading.timestamp).getTime();
              const diffMins = Math.floor(diffMs / 60000);
              if (diffMins < 1) timeSinceReading = 'Just now';
              else if (diffMins < 60) timeSinceReading = `${diffMins} min ago`;
              else if (diffMins < 1440) timeSinceReading = `${Math.floor(diffMins / 60)} hr ago`;
              else timeSinceReading = `${Math.floor(diffMins / 1440)} days ago`;
            }

            return { device, isOnline, lastReading, timeSinceReading };
          } catch (error) {
            return { device, isOnline: false, lastReading: null, timeSinceReading: 'Error' };
          }
        })
      );

      setDeviceStatuses(statuses);
    } catch (error) {
      console.error('Failed to fetch device statuses:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevicesWithStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDevicesWithStatus, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDevicesWithStatus();
  };

  // Get signal strength based on reading frequency
  const getSignalStrength = (status: DeviceStatus): { label: string; bars: number } => {
    if (!status.lastReading) return { label: 'No Signal', bars: 0 };
    const diffMs = Date.now() - new Date(status.lastReading.timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 5) return { label: 'Excellent', bars: 5 };
    if (diffMins < 10) return { label: 'Good', bars: 4 };
    if (diffMins < 30) return { label: 'Fair', bars: 3 };
    if (diffMins < 60) return { label: 'Weak', bars: 2 };
    return { label: 'Very Weak', bars: 1 };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground">Device Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your IoT sensors and ground-truth data sources
          </p>
        </motion.div>

        {/* IoT Device Registration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-6"
        >
          <DeviceSettingsComponent onDeviceChange={fetchDevicesWithStatus} />
        </motion.div>

        {/* Sensor Readings Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SensorGraph />
        </motion.div>

        {/* Device Status Cards - One per registered device */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="glass-card h-48 animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : deviceStatuses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Cpu className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground">No Devices Registered</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Register your first sensor above to see device status
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {deviceStatuses.map((status, index) => {
              const signal = getSignalStrength(status);

              return (
                <motion.div
                  key={status.device.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="glass-card p-6 hover-lift"
                >
                  {/* Device Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${status.isOnline ? 'bg-success/10' : 'bg-destructive/10'
                        }`}>
                        {status.isOnline ? (
                          <Wifi className="w-7 h-7 text-success" />
                        ) : (
                          <WifiOff className="w-7 h-7 text-destructive" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-bold text-foreground">
                          {status.device.name}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          ID: {status.device.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${status.isOnline
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                      }`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${status.isOnline ? 'bg-success animate-pulse-gentle' : 'bg-destructive'
                        }`} />
                      <span className="font-bold">
                        {status.isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                  </div>

                  {/* Sensor Stats Grid (No Battery) */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Signal Strength */}
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Signal className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Signal Strength</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">{signal.label}</p>
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((bar) => (
                          <div
                            key={bar}
                            className={`w-2 rounded-full ${bar <= signal.bars ? 'bg-success' : 'bg-muted'
                              }`}
                            style={{ height: `${bar * 4 + 8}px` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Last Reading */}
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Radio className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Last Reading</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">{status.timeSinceReading}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {status.lastReading
                          ? `Moisture: ${status.lastReading.soil_moisture}%`
                          : 'No data received yet'
                        }
                      </p>
                    </div>

                    {/* Temperature (if available) */}
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ThermometerSun className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Temperature</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {status.lastReading?.temperature != null
                          ? `${status.lastReading.temperature}°C`
                          : 'N/A'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {status.lastReading?.humidity != null
                          ? `Humidity: ${status.lastReading.humidity}%`
                          : 'No humidity data'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Confidence Level */}
                  <div className={`rounded-xl p-4 ${status.isOnline ? 'bg-success/10' : 'bg-warning/10'
                    }`}>
                    <div className="flex items-center gap-3">
                      {status.isOnline ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-warning" />
                      )}
                      <div>
                        <p className="font-bold text-foreground">
                          Data Confidence: {status.isOnline ? 'High' : 'Low (Fallback Mode)'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {status.isOnline
                            ? 'Receiving real-time sensor data ✓'
                            : 'Using last known values - check sensor connection'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Refresh Button */}
        {deviceStatuses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-active"
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </Button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeviceSettings;
