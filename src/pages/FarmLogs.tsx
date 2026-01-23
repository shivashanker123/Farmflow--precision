import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Droplets, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useFarm } from '@/contexts/FarmContext';

const FarmLogs = () => {
  const { farmData } = useFarm();

  // Simulated log entries
  const logs = [
    {
      id: 1,
      type: 'irrigation',
      action: 'Irrigation Completed',
      details: '2,500L applied to Field A',
      timestamp: '2 hours ago',
      status: 'success',
    },
    {
      id: 2,
      type: 'sensor',
      action: 'Sensor Reading',
      details: `Soil moisture: ${farmData.soilMoisture}%`,
      timestamp: '2 hours ago',
      status: 'info',
    },
    {
      id: 3,
      type: 'recommendation',
      action: 'Irrigation Skipped',
      details: 'Soil moisture adequate - saved 1,800L',
      timestamp: '6 hours ago',
      status: 'warning',
    },
    {
      id: 4,
      type: 'irrigation',
      action: 'Irrigation Completed',
      details: '3,200L applied to Field A',
      timestamp: '1 day ago',
      status: 'success',
    },
    {
      id: 5,
      type: 'sensor',
      action: 'Sensor Calibrated',
      details: 'Manual calibration performed',
      timestamp: '2 days ago',
      status: 'info',
    },
    {
      id: 6,
      type: 'recommendation',
      action: 'Partial Irrigation',
      details: 'Water budget low - applied 50% volume',
      timestamp: '3 days ago',
      status: 'warning',
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'irrigation':
        return Droplets;
      case 'sensor':
        return Clock;
      case 'recommendation':
        return CheckCircle;
      default:
        return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-success bg-success/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      case 'error':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-secondary bg-secondary/10';
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
          <h1 className="text-3xl font-display font-bold text-foreground">Farm Logs</h1>
          <p className="text-muted-foreground mt-1">
            Complete history of irrigation events and sensor readings
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="glass-card p-4 hover-lift">
            <p className="text-sm text-muted-foreground">Total Events</p>
            <p className="text-2xl font-display font-bold text-foreground">{logs.length}</p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <p className="text-sm text-muted-foreground">Irrigations</p>
            <p className="text-2xl font-display font-bold text-secondary">
              {logs.filter(l => l.type === 'irrigation').length}
            </p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <p className="text-sm text-muted-foreground">Skipped</p>
            <p className="text-2xl font-display font-bold text-success">
              {logs.filter(l => l.action.includes('Skipped')).length}
            </p>
          </div>
          <div className="glass-card p-4 hover-lift">
            <p className="text-sm text-muted-foreground">Sensor Events</p>
            <p className="text-2xl font-display font-bold text-primary">
              {logs.filter(l => l.type === 'sensor').length}
            </p>
          </div>
        </motion.div>

        {/* Logs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-bold text-lg text-foreground mb-4">Recent Activity</h3>
          
          <div className="space-y-4">
            {logs.map((log, index) => {
              const Icon = getIcon(log.type);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusColor(log.status)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{log.action}</h4>
                      <span className="text-sm text-muted-foreground">{log.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default FarmLogs;
