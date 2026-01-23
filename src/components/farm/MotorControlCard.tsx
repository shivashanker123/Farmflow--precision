import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Power, Droplets, AlertTriangle, CloudRain, Loader2 } from 'lucide-react';

interface MotorControlCardProps {
  isOn: boolean;
  isLoading: boolean;
  isLocked: boolean;
  lockReason: string | null;
  onToggle: () => void;
  isLive: boolean;
}

const MotorControlCard: React.FC<MotorControlCardProps> = ({
  isOn,
  isLoading,
  isLocked,
  lockReason,
  onToggle,
  isLive,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 hover-lift relative overflow-hidden"
    >
      {/* Animated background when motor is on */}
      <AnimatePresence>
        {isOn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"
          >
            {/* Water flow animation */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 bg-secondary/40 rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  height: '100%',
                }}
                animate={{
                  y: ['100%', '-100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'linear',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={isOn ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 2, repeat: isOn ? Infinity : 0, ease: 'linear' }}
              className={`p-2 rounded-xl ${
                isOn ? 'bg-primary/20' : 'bg-muted/50'
              }`}
            >
              <Power className={`w-5 h-5 ${isOn ? 'text-primary' : 'text-muted-foreground'}`} />
            </motion.div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">Main Motor</h3>
              <p className="text-sm text-muted-foreground">
                {isLive ? 'ESP32 Connected' : 'Demo Mode'}
              </p>
            </div>
          </div>

          {/* Motor Status Indicator */}
          <motion.div
            animate={{
              scale: isOn ? [1, 1.1, 1] : 1,
              backgroundColor: isOn ? 'hsl(var(--success))' : 'hsl(var(--muted))',
            }}
            transition={{ duration: 0.5, repeat: isOn ? Infinity : 0 }}
            className={`px-4 py-2 rounded-full flex items-center gap-2 ${
              isOn ? 'text-success-foreground' : 'text-muted-foreground'
            }`}
            style={{
              backgroundColor: isOn ? 'hsl(var(--success) / 0.2)' : 'hsl(var(--muted) / 0.5)',
            }}
          >
            {isOn && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Droplets className="w-4 h-4 text-success" />
              </motion.div>
            )}
            <span className={`text-sm font-semibold ${isOn ? 'text-success' : ''}`}>
              {isOn ? 'RUNNING' : 'OFF'}
            </span>
          </motion.div>
        </div>

        {/* Lock Warning */}
        <AnimatePresence>
          {isLocked && lockReason && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30">
                {lockReason.includes('Rain') ? (
                  <CloudRain className="w-5 h-5 text-warning" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-warning" />
                )}
                <span className="text-sm text-warning font-medium">
                  Pump paused: {lockReason}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Control Switch */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-accent/30">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Motor Control</span>
            {isLoading && (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            )}
          </div>
          <Switch
            checked={isOn}
            onCheckedChange={onToggle}
            disabled={isLocked || isLoading}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {/* Connection indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-success animate-pulse' : 'bg-warning'}`} />
          <span>{isLive ? 'Hardware connected' : 'Using local simulation'}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MotorControlCard;
