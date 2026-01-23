import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface TrafficLightIndicatorProps {
  status: 'full' | 'partial' | 'skip';
  cropType: string;
  cropDay: number;
  soilMoisture: number;
}

const TrafficLightIndicator: React.FC<TrafficLightIndicatorProps> = ({
  status,
  cropType,
  cropDay,
  soilMoisture,
}) => {
  const config = {
    full: {
      color: 'bg-success',
      glowColor: 'shadow-[0_0_20px_hsl(122,47%,35%,0.6)]',
      ringColor: 'ring-success/30',
      icon: CheckCircle,
      title: 'OPTIMAL',
      subtitle: 'Irrigate Normally',
      description: 'Soil is dry and water budget is healthy',
    },
    partial: {
      color: 'bg-warning',
      glowColor: 'shadow-[0_0_20px_hsl(38,100%,50%,0.6)]',
      ringColor: 'ring-warning/30',
      icon: AlertTriangle,
      title: 'CAUTION',
      subtitle: 'Partial Irrigation Recommended',
      description: 'Soil is dry but water budget is limited',
    },
    skip: {
      color: 'bg-destructive',
      glowColor: 'shadow-[0_0_20px_hsl(0,65%,51%,0.6)]',
      ringColor: 'ring-destructive/30',
      icon: XCircle,
      title: 'STOP',
      subtitle: 'Do Not Irrigate',
      description: 'Soil moisture is adequate',
    },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 hover-lift"
    >
      <div className="flex items-center gap-6">
        {/* Traffic Light Visual */}
        <div className="flex flex-col items-center gap-2 p-4 bg-foreground/5 rounded-2xl">
          {(['full', 'partial', 'skip'] as const).map((s) => (
            <motion.div
              key={s}
              className={`w-6 h-6 rounded-full transition-all duration-300 ${s === status
                  ? `${config[s].color} ${config[s].glowColor} ring-4 ${config[s].ringColor}`
                  : 'bg-muted'
                }`}
              animate={s === status ? {
                scale: [1, 1.15, 1],
                opacity: [1, 0.8, 1],
              } : { scale: 1, opacity: 0.3 }}
              transition={{
                duration: 2,
                repeat: s === status ? Infinity : 0,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Icon className={`w-8 h-8 ${status === 'full' ? 'text-success' :
                  status === 'partial' ? 'text-warning' : 'text-destructive'
                }`} />
            </motion.div>
            <div>
              <AnimatePresence mode="wait">
                <motion.h3
                  key={status}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="font-display font-bold text-xl tracking-wide"
                >
                  {current.title}: <span className="font-normal">{current.subtitle}</span>
                </motion.h3>
              </AnimatePresence>
            </div>
          </div>
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Based on your <span className="font-medium text-foreground capitalize">{cropType}</span> crop
            (Day {cropDay}) and <span className="font-medium text-foreground">{soilMoisture}%</span> soil moisture.
          </motion.p>
          <motion.p
            className="text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {current.description}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default TrafficLightIndicator;

