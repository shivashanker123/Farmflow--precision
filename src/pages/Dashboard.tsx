import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TrafficLightIndicator from '@/components/farm/TrafficLightIndicator';
import SoilMoistureGauge from '@/components/farm/SoilMoistureGauge';
import SwipeToIrrigate from '@/components/farm/SwipeToIrrigate';
import DataSourceBadge from '@/components/farm/DataSourceBadge';
import MotorControlCard from '@/components/farm/MotorControlCard';
import SensorCard from '@/components/farm/SensorCard';
import { useFarm } from '@/contexts/FarmContext';
import { useESP32Data, ESP32_CONFIG } from '@/hooks/useESP32Data';
import { Calendar, Sun, Cloud, Thermometer, MapPin, Navigation, Edit3, Loader2, Check, X, CloudRain, CloudSnow, CloudLightning, CloudFog, Wifi, Settings } from 'lucide-react';
import WeatherIcon from '@/components/ui/WeatherIcon';
import WeatherCard from '@/components/ui/WeatherCard';

// WorldWeatherOnline API configuration
const WEATHER_API_KEY = '6c18236020184628a3d121913261001';
const WEATHER_BASE_URL = 'https://api.worldweatheronline.com/premium/v1/weather.ashx';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  icon: string;
}

const Dashboard = () => {
  const {
    farmData,
    updateSoilMoisture,
    updateSensorData,
    setDataSource,
    togglePump,
    setPumpActive,
    toggleSensorOnline,
    getRecommendation,
    setRainExpected,
    setEspIP,
    isPumpLocked,
  } = useFarm();

  const recommendation = getRecommendation();
  const cropDay = 45; // Simulated crop day
  const pumpLockStatus = isPumpLocked();

  // ESP32 integration
  const esp32Data = useESP32Data(farmData.espIP);

  // Track previous live state to prevent flickering
  const [stableIsLive, setStableIsLive] = useState(false);
  const liveStateDebounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync ESP32 data with farm context (with debounce for isLive state)
  useEffect(() => {
    if (esp32Data.sensorData) {
      updateSensorData({
        soilMoisture: esp32Data.sensorData.soilMoisture,
        temperature: esp32Data.sensorData.temperature,
        humidity: esp32Data.sensorData.humidity,
      });

      // Debounce the isLive state changes to prevent flickering
      if (liveStateDebounceRef.current) {
        clearTimeout(liveStateDebounceRef.current);
      }

      liveStateDebounceRef.current = setTimeout(() => {
        setStableIsLive(esp32Data.isLive);
        setDataSource(esp32Data.isLive ? 'live' : 'fallback');
      }, 1000); // Wait 1 second before changing live state
    }

    return () => {
      if (liveStateDebounceRef.current) {
        clearTimeout(liveStateDebounceRef.current);
      }
    };
  }, [esp32Data.sensorData, esp32Data.isLive]);

  // Location state
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // ESP32 settings
  const [espSettingsOpen, setEspSettingsOpen] = useState(false);
  const [tempEspIP, setTempEspIP] = useState(farmData.espIP);

  // Weather state
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    icon: '02d',
  });
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoaded, setWeatherLoaded] = useState(false); // Stays true after first successful load

  // Fetch weather function (extracted for reuse)
  const fetchWeather = useCallback(async (location: { lat: number; lng: number }) => {
    console.log('Fetching weather for location:', location);
    setWeatherLoading(true);
    setWeatherError(null);

    const url = `${WEATHER_BASE_URL}?key=${WEATHER_API_KEY}&q=${location.lat},${location.lng}&format=json&num_of_days=1`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.data?.error) {
        throw new Error(data.data.error[0]?.msg || 'API Error');
      }

      const current = data.data.current_condition[0];
      const newWeatherData = {
        temperature: parseInt(current.temp_C),
        condition: current.weatherDesc[0].value,
        humidity: parseInt(current.humidity),
        icon: current.weatherCode,
      };

      setWeatherData(newWeatherData);
      setWeatherLoaded(true); // Mark as loaded - stays true forever
      console.log('Weather updated at:', new Date().toLocaleTimeString());

      // Check for rain conditions (mock prediction)
      const isRainy = current.weatherDesc[0].value.toLowerCase().includes('rain');
      setRainExpected(isRainy);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeatherError('Failed to load weather');
    } finally {
      setWeatherLoading(false);
    }
  }, [setRainExpected]);

  // Fetch weather data when location changes + refresh every 1 hour
  useEffect(() => {
    if (!userLocation) {
      console.log('No user location set yet');
      return;
    }

    // Initial fetch when location changes
    fetchWeather(userLocation);

    // Set up hourly refresh (1 hour = 3600000 ms)
    // This ensures max 24 API calls per day, well within 100 free calls limit
    const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
    const intervalId = setInterval(() => {
      console.log('Hourly weather refresh triggered');
      fetchWeather(userLocation);
    }, REFRESH_INTERVAL);

    // Cleanup interval on unmount or location change
    return () => {
      clearInterval(intervalId);
    };
  }, [userLocation, fetchWeather]);

  // Auto-detect location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Auto-location failed:', error.message);
        }
      );
    }
  }, []);

  // Get weather icon component based on condition
  const getWeatherIcon = () => {
    const iconCode = weatherData.icon;
    const isDay = iconCode.includes('d');

    if (iconCode.startsWith('01')) return <Sun className="w-5 h-5 text-warning" />;
    if (iconCode.startsWith('02') || iconCode.startsWith('03') || iconCode.startsWith('04'))
      return <Cloud className="w-5 h-5 text-muted-foreground" />;
    if (iconCode.startsWith('09') || iconCode.startsWith('10'))
      return <CloudRain className="w-5 h-5 text-secondary" />;
    if (iconCode.startsWith('11')) return <CloudLightning className="w-5 h-5 text-warning" />;
    if (iconCode.startsWith('13')) return <CloudSnow className="w-5 h-5 text-blue-300" />;
    if (iconCode.startsWith('50')) return <CloudFog className="w-5 h-5 text-muted-foreground" />;

    return isDay ? <Sun className="w-5 h-5 text-warning" /> : <Cloud className="w-5 h-5 text-muted-foreground" />;
  };

  // Handle GPS location
  const handleUseGPS = () => {
    setGpsLoading(true);
    setGpsError(null);
    setGpsSuccess(false);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsLoading(false);
        setGpsSuccess(true);
        setTimeout(() => {
          setLocationPopoverOpen(false);
          setGpsSuccess(false);
        }, 1500);
      },
      (error) => {
        setGpsError(error.message || 'Failed to get location');
        setGpsLoading(false);
      }
    );
  };

  // Handle manual location submission
  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setGpsError('Please enter valid coordinates');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setGpsError('Coordinates out of range');
      return;
    }

    setUserLocation({ lat, lng });
    setGpsSuccess(true);
    setTimeout(() => {
      setLocationPopoverOpen(false);
      setShowManualInput(false);
      setGpsSuccess(false);
      setManualLat('');
      setManualLng('');
    }, 1500);
  };

  // Reset popover state when closed
  const handlePopoverChange = (open: boolean) => {
    setLocationPopoverOpen(open);
    if (!open) {
      setShowManualInput(false);
      setGpsError(null);
      setGpsSuccess(false);
    }
  };

  // Handle ESP32 IP update
  const handleEspIPUpdate = () => {
    setEspIP(tempEspIP);
    setEspSettingsOpen(false);
  };

  // Handle motor toggle with ESP32 integration
  const handleMotorToggle = useCallback(async () => {
    if (pumpLockStatus.locked) return;

    // Try to send command to ESP32
    const newState = !farmData.pumpActive;
    const endpoint = newState ? '/pump/on' : '/pump/off';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ESP32_CONFIG.TIMEOUT);

      await fetch(`http://${farmData.espIP}${endpoint}`, {
        method: 'POST',
        signal: controller.signal,
        mode: 'cors',
      });

      clearTimeout(timeoutId);
    } catch (error) {
      // Continue with local state update even if ESP32 is unreachable
      console.log('ESP32 command failed, updating local state');
    }

    // Update local state
    setPumpActive(newState);
  }, [farmData.pumpActive, farmData.espIP, pumpLockStatus.locked, setPumpActive]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Command Center</h1>
              <p className="text-muted-foreground mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Data Source Badge */}
            <DataSourceBadge
              isLive={stableIsLive}
              lastUpdated={esp32Data.lastUpdated}
              isLoading={esp32Data.isLoading}
            />
          </div>

          {/* Weather Widget with Location & ESP Settings */}
          <div className="flex items-center gap-3">
            <div className="glass-card px-6 py-3 flex items-center gap-6">
              <div className="flex items-center gap-2">
                {!weatherLoaded && weatherLoading ? (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                ) : (
                  <WeatherIcon condition={weatherData.condition} size="md" />
                )}
                <span className="font-medium">{weatherData.temperature}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{weatherData.condition}</span>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-secondary" />
                <span className="text-sm text-muted-foreground">{weatherData.humidity}% humidity</span>
              </div>
            </div>

            {/* ESP32 Settings Button */}
            <Popover open={espSettingsOpen} onOpenChange={setEspSettingsOpen}>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`glass-card p-3 hover-lift flex items-center justify-center transition-all duration-300 ${esp32Data.isLive ? 'ring-2 ring-success/50' : ''}`}
                  title="ESP32 Settings"
                >
                  <Wifi className={`w-5 h-5 ${esp32Data.isLive ? 'text-success' : 'text-muted-foreground'}`} />
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 glass-card border-white/30" align="end" sideOffset={8}>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="w-4 h-4 text-primary" />
                    <h4 className="font-display font-semibold text-foreground">ESP32 Settings</h4>
                  </div>

                  {/* Connection Status */}
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${esp32Data.isLive ? 'bg-success/10 border border-success/30' : 'bg-warning/10 border border-warning/30'}`}>
                    <div className={`w-2 h-2 rounded-full ${esp32Data.isLive ? 'bg-success animate-pulse' : 'bg-warning'}`} />
                    <span className={`text-sm font-medium ${esp32Data.isLive ? 'text-success' : 'text-warning'}`}>
                      {esp32Data.isLive ? 'Connected to ESP32' : 'ESP32 Offline'}
                    </span>
                  </div>

                  {/* IP Address Input */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">ESP32 IP Address</Label>
                    <Input
                      value={tempEspIP}
                      onChange={(e) => setTempEspIP(e.target.value)}
                      placeholder="192.168.4.1"
                      className="glass-input"
                    />
                  </div>

                  <Button onClick={handleEspIPUpdate} className="w-full bg-primary hover:bg-primary/90">
                    Update IP
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Default: {ESP32_CONFIG.IP}
                  </p>
                </div>
              </PopoverContent>
            </Popover>

            {/* Location Button */}
            <Popover open={locationPopoverOpen} onOpenChange={handlePopoverChange}>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`glass-card p-3 hover-lift flex items-center justify-center transition-all duration-300 ${userLocation ? 'ring-2 ring-primary/50' : ''}`}
                  title="Set Location"
                >
                  <MapPin className={`w-5 h-5 ${userLocation ? 'text-primary' : 'text-muted-foreground'}`} />
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 glass-card border-white/30" align="end" sideOffset={8}>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h4 className="font-display font-semibold text-foreground">Set Location</h4>
                  </div>

                  {/* Current Location Display */}
                  {userLocation && !gpsSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-muted-foreground bg-accent/50 rounded-lg px-3 py-2"
                    >
                      <span className="font-medium">Current:</span> {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
                    </motion.div>
                  )}

                  {/* Success Message */}
                  <AnimatePresence>
                    {gpsSuccess && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-2 text-success bg-success/10 rounded-lg px-3 py-2"
                      >
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Location updated!</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Message */}
                  <AnimatePresence>
                    {gpsError && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg px-3 py-2"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-sm">{gpsError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!gpsSuccess && (
                    <>
                      {/* GPS Option */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUseGPS}
                        disabled={gpsLoading}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all duration-300 text-left group disabled:opacity-50"
                      >
                        {gpsLoading ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <Navigation className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        )}
                        <div>
                          <span className="font-medium text-foreground block">Use GPS</span>
                          <span className="text-xs text-muted-foreground">Get current location</span>
                        </div>
                      </motion.button>

                      {/* Manual Input Option */}
                      {!showManualInput ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowManualInput(true)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 text-left group"
                        >
                          <Edit3 className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
                          <div>
                            <span className="font-medium text-foreground block">Enter Manually</span>
                            <span className="text-xs text-muted-foreground">Type coordinates</span>
                          </div>
                        </motion.button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Latitude</label>
                              <Input
                                type="number"
                                placeholder="-90 to 90"
                                value={manualLat}
                                onChange={(e) => setManualLat(e.target.value)}
                                className="h-9 text-sm glass-input"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Longitude</label>
                              <Input
                                type="number"
                                placeholder="-180 to 180"
                                value={manualLng}
                                onChange={(e) => setManualLng(e.target.value)}
                                className="h-9 text-sm glass-input"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowManualInput(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleManualSubmit}
                              className="flex-1 bg-primary hover:bg-primary/90"
                            >
                              Set Location
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </motion.div>

        {/* Sensor Data Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-4"
        >
          <SensorCard
            type="temperature"
            value={weatherData.temperature}
            unit="°C"
            isLive={weatherLoaded}
          />
          <SensorCard
            type="humidity"
            value={weatherData.humidity}
            unit="%"
            isLive={weatherLoaded}
          />
        </motion.div>

        {/* Smart Recommendation Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TrafficLightIndicator
            status={recommendation}
            cropType={farmData.cropType}
            cropDay={cropDay}
            soilMoisture={farmData.soilMoisture}
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Trust Gauge + Weather Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <SoilMoistureGauge
              value={farmData.soilMoisture}
              cropType={farmData.cropType}
              sensorOnline={farmData.sensorOnline}
            />

            {/* Compact Weather Card */}
            <motion.div
              className="glass-card p-4 relative overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Ambient background based on weather */}
              <div className={`absolute inset-0 ${weatherData.condition.toLowerCase().includes('sun') || weatherData.condition.toLowerCase().includes('clear')
                ? 'bg-gradient-to-br from-amber-500/15 via-orange-400/10 to-yellow-300/5'
                : weatherData.condition.toLowerCase().includes('rain')
                  ? 'bg-gradient-to-br from-blue-600/15 via-slate-500/10 to-cyan-400/5'
                  : 'bg-gradient-to-br from-sky-500/10 via-blue-400/5 to-cyan-300/5'
                }`} />

              {/* Rain drops ambient effect */}
              {weatherData.condition.toLowerCase().includes('rain') && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-0.5 h-4 bg-gradient-to-b from-blue-400/50 to-transparent rounded-full"
                      style={{ left: `${(i * 16) + 5}%` }}
                      initial={{ top: '-10%', opacity: 0 }}
                      animate={{ top: '110%', opacity: [0, 0.6, 0] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: Math.random() * 1.5,
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Animated Weather Icon */}
                    <motion.div
                      className="p-2 rounded-xl bg-background/50"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <WeatherIcon condition={weatherData.condition} size="lg" />
                    </motion.div>

                    <div>
                      <motion.p
                        className="text-3xl font-display font-bold text-foreground"
                        key={weatherData.temperature}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        {weatherData.temperature}°C
                      </motion.p>
                      <p className="text-sm text-muted-foreground">{weatherData.condition}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Thermometer className="w-4 h-4 text-secondary" />
                      <span>{weatherData.humidity}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {userLocation ? `${userLocation.lat.toFixed(1)}°, ${userLocation.lng.toFixed(1)}°` : 'No location'}
                    </p>
                  </div>
                </div>

                {/* 5-Day Forecast Mini */}
                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { day: 'Mon', temp: weatherData.temperature + 1, condition: weatherData.condition },
                      { day: 'Tue', temp: weatherData.temperature - 1, condition: 'Partly Cloudy' },
                      { day: 'Wed', temp: weatherData.temperature - 3, condition: 'Rain' },
                      { day: 'Thu', temp: weatherData.temperature + 2, condition: 'Sunny' },
                      { day: 'Fri', temp: weatherData.temperature, condition: 'Cloudy' },
                    ].map((day, idx) => (
                      <motion.div
                        key={day.day}
                        className="text-center py-1.5 px-1 rounded-lg bg-background/30 hover:bg-background/50 transition-all cursor-default"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + idx * 0.08 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                      >
                        <p className="text-xs font-medium text-muted-foreground">{day.day}</p>
                        <WeatherIcon condition={day.condition} size="sm" className="mx-auto my-1" />
                        <p className="text-xs font-bold text-foreground">{day.temp}°</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Irrigation Control & Motor Control */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Motor Control Card */}
            <MotorControlCard
              isOn={farmData.pumpActive}
              isLoading={false}
              isLocked={pumpLockStatus.locked}
              lockReason={pumpLockStatus.reason}
              onToggle={handleMotorToggle}
              isLive={stableIsLive}
            />

            {/* Swipe to Irrigate */}
            <SwipeToIrrigate
              onActivate={togglePump}
              isActive={farmData.pumpActive}
            />

            {/* Reliability Toggle */}
            <div className="glass-card p-6 hover-lift">
              <h3 className="font-display font-bold text-lg text-foreground mb-4">Sensor Reliability</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${farmData.sensorOnline ? 'bg-success animate-pulse-gentle' : 'bg-muted'}`} />
                    <Label htmlFor="sensor-toggle">Sensor Status</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {farmData.sensorOnline ? 'Online' : 'Simulating Failure'}
                    </span>
                    <Switch
                      id="sensor-toggle"
                      checked={!farmData.sensorOnline}
                      onCheckedChange={toggleSensorOnline}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Toggle to simulate sensor failure mode
                </p>
              </div>
            </div>

            {/* Demo Controls */}
            <div className="glass-card p-6 hover-lift">
              <h3 className="font-display font-bold text-lg text-foreground mb-4">Demo Controls</h3>
              <div className="space-y-4">
                <div>
                  <Label>Adjust Soil Moisture: {farmData.soilMoisture}%</Label>
                  <Slider
                    value={[farmData.soilMoisture]}
                    onValueChange={(value) => updateSoilMoisture(value[0])}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Drag to simulate soil moisture changes
                  </p>
                </div>

                {/* Rain Toggle for Testing */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <CloudRain className="w-5 h-5 text-secondary" />
                    <Label htmlFor="rain-toggle">Simulate Rain Expected</Label>
                  </div>
                  <Switch
                    id="rain-toggle"
                    checked={farmData.rainExpected}
                    onCheckedChange={setRainExpected}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Field Size', value: `${farmData.fieldSize} acres`, icon: Calendar },
            { label: 'Crop Type', value: farmData.cropType, icon: Sun },
            { label: 'Water Need', value: `${farmData.dailyWaterNeed} mm/day`, icon: Cloud },
            { label: 'Tank Level', value: `${((farmData.tankCapacity - farmData.usedWater) / farmData.tankCapacity * 100).toFixed(0)}%`, icon: Thermometer },
          ].map((stat, index) => (
            <div key={stat.label} className="glass-card p-4 hover-lift">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-xl font-display font-bold text-foreground capitalize">{stat.value}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
