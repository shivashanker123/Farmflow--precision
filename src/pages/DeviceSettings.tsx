import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useFarm } from '@/contexts/FarmContext';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  Radio, 
  Signal, 
  ThermometerSun,
  RefreshCcw,
  Settings as SettingsIcon,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DeviceSettings = () => {
  const { farmData, toggleSensorOnline, updateSoilMoisture } = useFarm();
  const [manualInput, setManualInput] = React.useState('');

  const handleManualOverride = () => {
    const value = parseInt(manualInput);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      updateSoilMoisture(value);
      setManualInput('');
    }
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
            Manage your single ground-truth sensor
          </p>
        </motion.div>

        {/* Primary Sensor Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 hover-lift"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                farmData.sensorOnline ? 'bg-success/10' : 'bg-destructive/10'
              }`}>
                {farmData.sensorOnline ? (
                  <Wifi className="w-8 h-8 text-success" />
                ) : (
                  <WifiOff className="w-8 h-8 text-destructive" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">
                  Primary Field Sensor
                </h2>
                <p className="text-muted-foreground">Ground Truth Data Source</p>
              </div>
            </div>
            
            {/* Large Status Indicator */}
            <div className={`px-6 py-3 rounded-full flex items-center gap-2 ${
              farmData.sensorOnline 
                ? 'bg-success/10 text-success' 
                : 'bg-destructive/10 text-destructive'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                farmData.sensorOnline ? 'bg-success animate-pulse-gentle' : 'bg-destructive'
              }`} />
              <span className="font-bold text-lg">
                {farmData.sensorOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Sensor Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Signal className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Signal Strength</span>
              </div>
              <p className="text-lg font-bold text-foreground">Excellent</p>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <div
                    key={bar}
                    className={`w-2 rounded-full ${
                      bar <= 4 ? 'bg-success' : 'bg-muted'
                    }`}
                    style={{ height: `${bar * 4 + 8}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Battery className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Battery</span>
              </div>
              <p className="text-lg font-bold text-foreground">87%</p>
              <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div className="h-full w-[87%] bg-success rounded-full" />
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Last Reading</span>
              </div>
              <p className="text-lg font-bold text-foreground">2 min ago</p>
              <p className="text-xs text-muted-foreground mt-1">Updates every 5 min</p>
            </div>

            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ThermometerSun className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sensor Temp</span>
              </div>
              <p className="text-lg font-bold text-foreground">24°C</p>
              <p className="text-xs text-muted-foreground mt-1">Operating normally</p>
            </div>
          </div>

          {/* Confidence Level */}
          <div className={`rounded-xl p-4 mb-6 ${
            farmData.sensorOnline ? 'bg-success/10' : 'bg-warning/10'
          }`}>
            <div className="flex items-center gap-3">
              {farmData.sensorOnline ? (
                <CheckCircle className="w-6 h-6 text-success" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-warning" />
              )}
              <div>
                <p className="font-bold text-foreground">
                  Confidence Level: {farmData.sensorOnline ? 'High' : 'Low (Fallback Mode)'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {farmData.sensorOnline 
                    ? 'Sensor readings match water model formula ✓'
                    : 'Using historical data backup - readings may be less accurate'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" className="btn-active">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Sync Now
            </Button>
            <Button variant="outline" className="btn-active">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Calibrate
            </Button>
          </div>
        </motion.div>

        {/* Manual Override Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 hover-lift"
        >
          <h3 className="text-lg font-display font-bold text-foreground mb-4">
            Manual Override
          </h3>
          <p className="text-muted-foreground mb-4">
            If the sensor fails, you can manually input soil moisture readings.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="manual-moisture" className="mb-2 block">
                Manual Moisture Input (%)
              </Label>
              <Input
                id="manual-moisture"
                type="number"
                placeholder="Enter 0-100"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="glass-input"
                min={0}
                max={100}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleManualOverride}
                className="btn-active bg-primary hover:bg-primary/90"
              >
                Apply Override
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Simulate Failure Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 hover-lift"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-display font-bold text-foreground">
                Simulate Sensor Failure
              </h3>
              <p className="text-muted-foreground mt-1">
                Test how the system behaves when the sensor goes offline
              </p>
            </div>
            <Switch
              checked={!farmData.sensorOnline}
              onCheckedChange={toggleSensorOnline}
            />
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DeviceSettings;
