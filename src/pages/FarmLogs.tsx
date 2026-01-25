import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Droplets,
  Zap,
  Leaf,
  Calendar,
  TrendingUp,
  Clock,
  ChevronDown,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// API URL - empty for same domain (Vercel)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface LogEntry {
  id: number;
  user_id: number;
  timestamp: string;
  water_used: number;
  pump_run_time: number;
  soil_moisture: number | null;
  action: string;
}

interface LogSummary {
  total_water_used: number;
  total_pump_hours: number;
  avg_soil_moisture: number;
  total_events: number;
}

type MetricType = 'water' | 'pump' | 'moisture' | 'events';

const FarmLogs = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<LogSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('water');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logs by time range
  const filteredLogs = useMemo(() => {
    if (timeRange === 'all') return logs;

    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);

    return logs.filter(log => new Date(log.timestamp) >= cutoff);
  }, [logs, timeRange]);

  // Prepare chart data based on selected metric
  const chartData = useMemo(() => {
    // Group logs by day
    const groupedByDay = new Map<string, { water: number; pump: number; moisture: number[]; count: number }>();

    filteredLogs.forEach(log => {
      const day = new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = groupedByDay.get(day) || { water: 0, pump: 0, moisture: [], count: 0 };
      existing.water += log.water_used || 0;
      existing.pump += log.pump_run_time || 0;
      if (log.soil_moisture !== null) existing.moisture.push(log.soil_moisture);
      existing.count += 1;
      groupedByDay.set(day, existing);
    });

    return Array.from(groupedByDay.entries()).reverse().map(([day, data]) => ({
      day,
      water: Math.round(data.water),
      pump: Math.round(data.pump * 10) / 10,
      moisture: data.moisture.length > 0
        ? Math.round(data.moisture.reduce((a, b) => a + b, 0) / data.moisture.length)
        : 0,
      events: data.count
    }));
  }, [filteredLogs]);

  // Get max values for chart scaling
  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 1;
    switch (selectedMetric) {
      case 'water': return Math.max(...chartData.map(d => d.water), 1);
      case 'pump': return Math.max(...chartData.map(d => d.pump), 1);
      case 'moisture': return 100;
      case 'events': return Math.max(...chartData.map(d => d.events), 1);
    }
  }, [chartData, selectedMetric]);

  const metrics = [
    {
      id: 'water' as MetricType,
      label: 'Water Usage',
      value: summary?.total_water_used || 0,
      unit: 'L',
      icon: Droplets,
      color: 'from-blue-500 to-cyan-400',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500',
    },
    {
      id: 'pump' as MetricType,
      label: 'Pump Hours',
      value: summary?.total_pump_hours || 0,
      unit: 'hrs',
      icon: Zap,
      color: 'from-amber-500 to-yellow-400',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-500',
    },
    {
      id: 'moisture' as MetricType,
      label: 'Avg Moisture',
      value: summary?.avg_soil_moisture || 0,
      unit: '%',
      icon: Leaf,
      color: 'from-green-500 to-emerald-400',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500',
    },
    {
      id: 'events' as MetricType,
      label: 'Total Events',
      value: summary?.total_events || 0,
      unit: '',
      icon: Activity,
      color: 'from-purple-500 to-pink-400',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-500',
    },
  ];

  const selectedMetricInfo = metrics.find(m => m.id === selectedMetric)!;

  const getChartValue = (data: typeof chartData[0]) => {
    switch (selectedMetric) {
      case 'water': return data.water;
      case 'pump': return data.pump;
      case 'moisture': return data.moisture;
      case 'events': return data.events;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Farm Logs</h1>
            <p className="text-muted-foreground mt-1">
              Track your irrigation history and performance metrics
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Metric Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {metrics.map((metric, index) => (
            <motion.button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`glass-card p-5 text-left transition-all duration-300 ${selectedMetric === metric.id
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:shadow-md'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl ${metric.bgColor} flex items-center justify-center`}>
                  <metric.icon className={`w-6 h-6 ${metric.textColor}`} />
                </div>
                {selectedMetric === metric.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3 rounded-full bg-primary"
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-4">{metric.label}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-display font-bold text-foreground">
                  {typeof metric.value === 'number'
                    ? metric.value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                    : metric.value}
                </span>
                <span className="text-sm text-muted-foreground">{metric.unit}</span>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Chart Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedMetricInfo.color} flex items-center justify-center`}>
                <selectedMetricInfo.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">
                  {selectedMetricInfo.label} History
                </h3>
                <p className="text-sm text-muted-foreground">
                  {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'All time'}
                </p>
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <Calendar className="w-12 h-12 mb-4 opacity-50" />
              <p>No data available for this period</p>
              <p className="text-sm mt-1">Start tracking to see your history</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bar Chart */}
              <div className="h-64 flex items-end gap-2 pt-8 relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-muted-foreground py-2">
                  <span>{maxValue}</span>
                  <span>{Math.round(maxValue / 2)}</span>
                  <span>0</span>
                </div>

                {/* Bars */}
                <div className="flex-1 flex items-end gap-1 ml-14">
                  <AnimatePresence mode="wait">
                    {chartData.map((data, index) => {
                      const value = getChartValue(data);
                      const height = (value / maxValue) * 100;
                      return (
                        <motion.div
                          key={`${data.day}-${selectedMetric}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: `${Math.max(height, 2)}%`, opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ delay: index * 0.02, duration: 0.3 }}
                          className="flex-1 relative group"
                        >
                          <div
                            className={`w-full rounded-t-lg bg-gradient-to-t ${selectedMetricInfo.color} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                            style={{ height: '100%' }}
                          />
                          {/* Tooltip */}
                          <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                            <p className="text-xs font-medium text-foreground">{data.day}</p>
                            <p className="text-sm font-bold text-foreground">
                              {value.toLocaleString()} {selectedMetricInfo.unit}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* X-axis labels */}
              <div className="flex gap-1 ml-14 overflow-x-auto">
                {chartData.map((data, index) => (
                  <div key={index} className="flex-1 text-center">
                    <span className="text-xs text-muted-foreground">{data.day}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Activity List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-bold text-lg text-foreground mb-4">Recent Activity</h3>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLogs.slice(0, 20).map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground capitalize">
                        {log.action?.replace(/_/g, ' ') || 'Activity'}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      {log.water_used > 0 && (
                        <span>💧 {log.water_used.toLocaleString()}L</span>
                      )}
                      {log.pump_run_time > 0 && (
                        <span>⚡ {log.pump_run_time}hrs</span>
                      )}
                      {log.soil_moisture !== null && (
                        <span>🌱 {log.soil_moisture}%</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default FarmLogs;
