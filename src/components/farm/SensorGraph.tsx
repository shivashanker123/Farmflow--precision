import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Leaf,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Minus,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface Reading {
    id: string;
    device_id: string;
    soil_moisture: number;
    created_at: string;
    devices?: { name: string };
}

interface Device {
    id: string;
    name: string;
}

interface SensorGraphProps {
    refreshKey?: number;
}

const SensorGraph: React.FC<SensorGraphProps> = ({ refreshKey }) => {
    const { token } = useAuth();
    const [readings, setReadings] = useState<Reading[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);

    useEffect(() => {
        if (token) {
            fetchDevices();
            fetchReadings();
        }
    }, [token, refreshKey]);

    useEffect(() => {
        if (token) {
            fetchReadings();
        }
    }, [selectedDevice]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (token) {
                fetchReadings(true);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [token, selectedDevice]);

    const fetchDevices = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/devices`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setDevices(data.devices || []);
            }
        } catch (error) {
            console.error('Failed to fetch devices:', error);
        }
    };

    const fetchReadings = async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);

        try {
            const url = selectedDevice === 'all'
                ? `${API_BASE_URL}/api/readings`
                : `${API_BASE_URL}/api/readings?device_id=${selectedDevice}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setReadings(data.readings || []);
            }
        } catch (error) {
            console.error('Failed to fetch readings:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Prepare chart data (last 24 hours, grouped by hour)
    const chartData = useMemo(() => {
        const now = new Date();
        const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const filtered = readings.filter(r => new Date(r.created_at) >= cutoff);

        // Group by hour
        const hourlyData = new Map<string, number[]>();

        filtered.forEach(r => {
            const date = new Date(r.created_at);
            const hourKey = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
            const existing = hourlyData.get(hourKey) || [];
            existing.push(r.soil_moisture);
            hourlyData.set(hourKey, existing);
        });

        return Array.from(hourlyData.entries()).map(([hour, values]) => ({
            hour,
            value: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        }));
    }, [readings]);

    // Calculate stats
    const stats = useMemo(() => {
        if (readings.length === 0) return null;

        const values = readings.map(r => r.soil_moisture);
        const latest = readings[0]?.soil_moisture || 0;
        const previous = readings[1]?.soil_moisture || latest;
        const trend = latest - previous;

        return {
            latest,
            avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
            min: Math.min(...values),
            max: Math.max(...values),
            trend,
        };
    }, [readings]);

    const maxValue = Math.max(...chartData.map(d => d.value), 100);

    const getTrendIcon = () => {
        if (!stats) return <Minus className="w-4 h-4" />;
        if (stats.trend > 5) return <TrendingUp className="w-4 h-4 text-success" />;
        if (stats.trend < -5) return <TrendingDown className="w-4 h-4 text-destructive" />;
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    };

    const getMoistureColor = (value: number) => {
        if (value < 30) return 'text-destructive';
        if (value < 50) return 'text-warning';
        return 'text-success';
    };

    return (
        <div className="glass-card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-lg text-foreground">
                            Soil Moisture
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Live sensor readings
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Device Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDeviceDropdown(!showDeviceDropdown)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm"
                        >
                            <span className="truncate max-w-[120px]">
                                {selectedDevice === 'all'
                                    ? 'All Devices'
                                    : devices.find(d => d.id === selectedDevice)?.name || 'Device'}
                            </span>
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                            {showDeviceDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10"
                                >
                                    <button
                                        onClick={() => { setSelectedDevice('all'); setShowDeviceDropdown(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 rounded-t-lg"
                                    >
                                        All Devices
                                    </button>
                                    {devices.map(device => (
                                        <button
                                            key={device.id}
                                            onClick={() => { setSelectedDevice(device.id); setShowDeviceDropdown(false); }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50"
                                        >
                                            {device.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Refresh Button */}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => fetchReadings(true)}
                        disabled={isRefreshing}
                        className="px-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            {stats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                        <p className="text-xs text-muted-foreground">Current</p>
                        <p className={`text-xl font-bold ${getMoistureColor(stats.latest)}`}>
                            {stats.latest}%
                        </p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                        <p className="text-xs text-muted-foreground">Average</p>
                        <p className="text-xl font-bold text-foreground">{stats.avg}%</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                        <p className="text-xs text-muted-foreground">Range</p>
                        <p className="text-xl font-bold text-foreground">{stats.min}-{stats.max}%</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                        <p className="text-xs text-muted-foreground">Trend</p>
                        <div className="flex items-center justify-center gap-1">
                            {getTrendIcon()}
                            <span className="text-xl font-bold text-foreground">
                                {stats.trend > 0 ? '+' : ''}{stats.trend}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            {isLoading ? (
                <div className="h-48 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : chartData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                    <Leaf className="w-12 h-12 mb-4 opacity-50" />
                    <p>No sensor data yet</p>
                    <p className="text-sm mt-1">Data will appear here once your ESP8266 starts sending</p>
                </div>
            ) : (
                <div className="h-48 flex items-end gap-1">
                    {chartData.map((data, index) => {
                        const height = (data.value / maxValue) * 100;
                        return (
                            <motion.div
                                key={`${data.hour}-${index}`}
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ delay: index * 0.02, duration: 0.3 }}
                                className="flex-1 relative group"
                            >
                                <div
                                    className={`w-full rounded-t-lg transition-opacity ${data.value < 30
                                            ? 'bg-gradient-to-t from-red-500 to-red-400'
                                            : data.value < 50
                                                ? 'bg-gradient-to-t from-amber-500 to-amber-400'
                                                : 'bg-gradient-to-t from-green-500 to-emerald-400'
                                        } opacity-80 hover:opacity-100`}
                                    style={{ height: '100%' }}
                                />
                                {/* Tooltip */}
                                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                    <p className="text-xs font-medium">{data.hour}</p>
                                    <p className="text-sm font-bold">{data.value}%</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* X-axis labels */}
            {chartData.length > 0 && (
                <div className="flex gap-1 mt-2">
                    {chartData.filter((_, i) => i % Math.ceil(chartData.length / 6) === 0).map((data, index) => (
                        <div key={index} className="flex-1 text-center">
                            <span className="text-xs text-muted-foreground">{data.hour}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SensorGraph;
