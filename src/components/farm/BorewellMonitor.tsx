import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Clock, Zap, TrendingUp } from 'lucide-react';

interface BorewellMonitorProps {
  flowRate: number; // liters/hour
  pumpRunTime: number; // hours
  dailyNeed: number; // mm/day
  fieldSize: number; // acres
}

const BorewellMonitor: React.FC<BorewellMonitorProps> = ({
  flowRate,
  pumpRunTime,
  dailyNeed,
  fieldSize,
}) => {
  const totalPumped = pumpRunTime * flowRate;
  const dailyRequirement = dailyNeed * fieldSize * 100; // approximate liters
  const efficiency = Math.min(100, Math.round((totalPumped / dailyRequirement) * 100));
  const maxDailyHours = 8;
  const hoursRemaining = Math.max(0, maxDailyHours - pumpRunTime);

  return (
    <div className="glass-card p-6 hover-lift">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-6 h-6 text-blue-500" />
          </motion.div>
        </div>
        <div>
          <h3 className="text-lg font-display font-bold text-foreground">Smart Borewell Monitor</h3>
          <p className="text-sm text-muted-foreground">Groundwater irrigation tracking</p>
        </div>
      </div>

      {/* Visual Pump Animation */}
      <div className="relative h-48 mb-6 bg-gradient-to-b from-blue-950/30 to-blue-900/50 rounded-2xl overflow-hidden border border-blue-500/20">
        {/* Ground Layer */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-900/40 to-amber-800/20" />

        {/* Pipe */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-16 w-8 bg-slate-600/60 rounded-full border-2 border-slate-500/40">
          {/* Water Flow Animation */}
          <motion.div
            className="absolute inset-x-1 bg-gradient-to-b from-blue-400/80 to-blue-600/80 rounded-full"
            initial={{ top: '100%', bottom: 0 }}
            animate={{
              top: ['100%', '10%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </div>

        {/* Pump Head */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 w-16 h-8 bg-slate-700 rounded-lg border-2 border-slate-500 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
          />
        </div>

        {/* Water Table Indicator */}
        <div className="absolute bottom-16 left-4 right-4">
          <div className="flex items-center gap-2 text-xs text-blue-300">
            <Droplets className="w-3 h-3" />
            <span>Groundwater Level</span>
          </div>
          <div className="h-0.5 bg-blue-400/40 mt-1" />
        </div>

        {/* Stats Overlay */}
        <div className="absolute top-4 right-4 text-right">
          <p className="text-2xl font-display font-bold text-blue-300">
            {flowRate.toLocaleString()}
          </p>
          <p className="text-xs text-blue-400/80">L/hour flow</p>
        </div>
      </div>

      {/* Statistics Grid with Enhanced Animations */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          className="bg-card/50 rounded-xl p-4 border border-border hover:border-blue-500/40 transition-all cursor-default"
          whileHover={{ scale: 1.03, y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Droplets className="w-4 h-4 text-blue-400" />
            </motion.div>
            <span className="text-sm text-muted-foreground">Water Pumped</span>
          </div>
          <motion.p
            className="text-xl font-display font-bold text-foreground"
            key={totalPumped}
            initial={{ scale: 1.2, color: 'hsl(199, 89%, 48%)' }}
            animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
            transition={{ duration: 0.5 }}
          >
            {(totalPumped / 1000).toFixed(1)} m³
          </motion.p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalPumped.toLocaleString()} liters today
          </p>
        </motion.div>

        <motion.div
          className="bg-card/50 rounded-xl p-4 border border-border hover:border-amber-500/40 transition-all cursor-default"
          whileHover={{ scale: 1.03, y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Clock className="w-4 h-4 text-amber-400" />
            </motion.div>
            <span className="text-sm text-muted-foreground">Pump Runtime</span>
          </div>
          <motion.p
            className="text-xl font-display font-bold text-foreground"
            key={pumpRunTime}
            initial={{ scale: 1.2, color: 'hsl(38, 92%, 50%)' }}
            animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
            transition={{ duration: 0.5 }}
          >
            {pumpRunTime.toFixed(1)} hrs
          </motion.p>
          <p className="text-xs text-muted-foreground mt-1">
            {hoursRemaining.toFixed(1)} hrs budget left
          </p>
        </motion.div>

        <motion.div
          className="bg-card/50 rounded-xl p-4 border border-border hover:border-primary/40 transition-all cursor-default"
          whileHover={{ scale: 1.03, y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <TrendingUp className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm text-muted-foreground">Daily Target</span>
          </div>
          <motion.p
            className="text-xl font-display font-bold text-foreground"
            key={efficiency}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {efficiency}%
          </motion.p>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${efficiency}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${efficiency >= 80 ? 'bg-success' : efficiency >= 50 ? 'bg-warning' : 'bg-blue-500'
                }`}
            />
          </div>
        </motion.div>

        <motion.div
          className="bg-card/50 rounded-xl p-4 border border-border hover:border-green-500/40 transition-all cursor-default"
          whileHover={{ scale: 1.03, y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Zap className="w-4 h-4 text-yellow-400" />
            </motion.div>
            <span className="text-sm text-muted-foreground">Power Status</span>
          </div>
          <motion.p
            className="text-xl font-display font-bold text-success flex items-center gap-2"
            animate={{
              textShadow: [
                '0 0 0 rgba(34, 197, 94, 0)',
                '0 0 10px rgba(34, 197, 94, 0.5)',
                '0 0 0 rgba(34, 197, 94, 0)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-success"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            Active
          </motion.p>
          <p className="text-xs text-muted-foreground mt-1">
            Pump connected
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default BorewellMonitor;