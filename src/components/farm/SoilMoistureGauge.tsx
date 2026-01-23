import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import CropIcon from './CropIcon';

interface SoilMoistureGaugeProps {
  value: number; // 0-100
  cropType: 'wheat' | 'corn' | 'tomato';
  sensorOnline: boolean;
}

const SoilMoistureGauge: React.FC<SoilMoistureGaugeProps> = ({
  value,
  cropType,
  sensorOnline,
}) => {
  const [displayAngle, setDisplayAngle] = useState<number>(((value / 100) * 180) - 90);
  const [isUpdating, setIsUpdating] = useState(false);
  const prevValueRef = useRef(value);

  // Animate needle with spring-like physics using state
  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsUpdating(true);

      const targetAngle = ((value / 100) * 180) - 90;
      const startAngle = displayAngle;
      const duration = 800; // ms
      const startTime = Date.now();

      // Elastic ease out function
      const elasticEaseOut = (t: number): number => {
        const p = 0.4;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
      };

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = elasticEaseOut(progress);
        const currentAngle = startAngle + (targetAngle - startAngle) * eased;

        setDisplayAngle(currentAngle);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
      prevValueRef.current = value;

      setTimeout(() => setIsUpdating(false), 600);
    } else {
      setDisplayAngle(((value / 100) * 180) - 90);
    }
  }, [value]);

  const getStatusColor = () => {
    if (value < 30) return 'text-destructive';
    if (value < 50) return 'text-warning';
    return 'text-success';
  };

  const getStatusText = () => {
    if (value < 30) return 'Critical - Needs Water';
    if (value < 50) return 'Low - Monitor Closely';
    if (value < 70) return 'Optimal';
    return 'Saturated';
  };

  // Check if in optimal zone (50-70%)
  const isOptimal = value >= 50 && value <= 70;

  // Calculate the arc dashoffset based on value (0-100)
  const arcLength = 251;
  const filledLength = (value / 100) * arcLength;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card p-8 hover-lift relative ${!sensorOnline ? 'grayscale opacity-70' : ''} ${isOptimal ? 'glass-glow-green' : ''}`}
    >
      {!sensorOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 right-4 bg-warning/20 border border-warning/40 rounded-lg p-3 z-10"
        >
          <p className="text-warning text-sm font-medium flex items-center gap-2">
            ⚠️ Using Historical Data Backup
          </p>
        </motion.div>
      )}

      <div className="text-center mb-4">
        <h3 className="font-display font-bold text-lg text-foreground">Trust Gauge</h3>
        <p className="text-sm text-muted-foreground">Soil Moisture Level</p>
      </div>

      <div className="flex justify-center">
        <svg viewBox="0 0 200 140" className="w-full max-w-xs">
          <defs>
            {/* Glow filter for optimal zone */}
            <filter id="gaugeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Gradient for the gauge arc */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(0, 65%, 51%)" />
              <stop offset="40%" stopColor="hsl(38, 100%, 50%)" />
              <stop offset="100%" stopColor="hsl(122, 47%, 35%)" />
            </linearGradient>
            {/* Animated gradient for the filled arc */}
            <linearGradient id="gaugeGradientAnimated" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={value < 30 ? "hsl(0, 65%, 51%)" : value < 50 ? "hsl(38, 100%, 50%)" : "hsl(122, 47%, 35%)"} />
              <stop offset="100%" stopColor={value < 30 ? "hsl(0, 65%, 60%)" : value < 50 ? "hsl(38, 100%, 60%)" : "hsl(122, 47%, 45%)"} />
            </linearGradient>
          </defs>

          {/* Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Animated Colored Arc */}
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradientAnimated)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            initial={{ strokeDashoffset: arcLength }}
            animate={{
              strokeDashoffset: arcLength - filledLength,
              filter: isOptimal ? 'url(#gaugeGlow)' : 'none',
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* Optimal Zone Glow */}
          {isOptimal && (
            <motion.path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(122, 47%, 45%)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={arcLength - filledLength}
              opacity={0.3}
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Needle using proper SVG transform */}
          <g transform={`rotate(${displayAngle}, 100, 100)`}>
            {/* Needle shadow */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="32"
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="5"
              strokeLinecap="round"
              transform="translate(2, 2)"
            />
            {/* Needle body */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="28"
              stroke="hsl(var(--foreground))"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>

          {/* Center pivot circle */}
          <motion.circle
            cx="100"
            cy="100"
            r="10"
            fill="hsl(var(--foreground))"
            animate={isUpdating ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          />

          {/* Inner pivot accent */}
          <circle
            cx="100"
            cy="100"
            r="5"
            fill="hsl(var(--primary))"
          />

          {/* Labels - positioned outside the arc */}
          <text x="12" y="118" fontSize="11" fill="hsl(var(--muted-foreground))">0%</text>
          <text x="92" y="12" fontSize="11" fill="hsl(var(--muted-foreground))">50%</text>
          <text x="172" y="118" fontSize="11" fill="hsl(var(--muted-foreground))">100%</text>
        </svg>
      </div>

      {/* Value Display */}
      <motion.div
        className="text-center mt-4"
        animate={isUpdating ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <motion.p
          className={`text-4xl font-display font-bold ${getStatusColor()}`}
          key={value}
          initial={{ opacity: 0.5, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {value}%
        </motion.p>
        <p className={`text-sm font-medium ${getStatusColor()}`}>{getStatusText()}</p>
      </motion.div>

      {/* Crop Icon */}
      <div className="flex justify-center mt-4">
        <CropIcon
          type={cropType}
          isHealthy={value >= 40}
          size="md"
        />
      </div>
    </motion.div>
  );
};

export default SoilMoistureGauge;
