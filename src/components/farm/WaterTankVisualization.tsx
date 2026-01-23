import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Droplets } from 'lucide-react';

interface WaterTankVisualizationProps {
  totalCapacity: number;
  usedWater: number;
  dailyNeed: number;
  fieldSize: number;
}

// Bubble component for rising effect
const Bubble: React.FC<{ delay: number; x: number }> = ({ delay, x }) => (
  <motion.circle
    cx={x}
    r={Math.random() * 2 + 1}
    fill="hsl(199, 98%, 72%)"
    opacity={0.6}
    initial={{ cy: 180, opacity: 0 }}
    animate={{
      cy: [180, 50, 20],
      opacity: [0, 0.6, 0],
      scale: [0.5, 1, 0.8],
    }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: 'easeOut',
    }}
  />
);

const WaterTankVisualization: React.FC<WaterTankVisualizationProps> = ({
  totalCapacity,
  usedWater,
  dailyNeed,
  fieldSize,
}) => {
  const remaining = totalCapacity - usedWater;
  const percentage = (remaining / totalCapacity) * 100;
  const dailyUsage = dailyNeed * fieldSize * 100;
  const daysRemaining = Math.floor(remaining / dailyUsage);

  const prevPercentageRef = useRef(percentage);
  const [isRefilling, setIsRefilling] = useState(false);

  // Spring animation for water level
  const springPercentage = useSpring(percentage, { stiffness: 50, damping: 20 });
  const waterHeight = useTransform(springPercentage, [0, 100], [0, 174]);
  const waterY = useTransform(springPercentage, [0, 100], [187, 13]);

  // Detect refilling (percentage increase)
  useEffect(() => {
    if (percentage > prevPercentageRef.current + 5) {
      setIsRefilling(true);
      setTimeout(() => setIsRefilling(false), 2000);
    }
    prevPercentageRef.current = percentage;
    springPercentage.set(percentage);
  }, [percentage, springPercentage]);

  // Dynamic water color based on level
  const getWaterGradient = () => {
    if (percentage > 50) return { start: 'hsl(199, 98%, 52%)', end: 'hsl(199, 98%, 42%)' };
    if (percentage > 20) return { start: 'hsl(38, 100%, 55%)', end: 'hsl(38, 100%, 45%)' };
    return { start: 'hsl(0, 65%, 55%)', end: 'hsl(0, 65%, 45%)' };
  };

  const waterColors = getWaterGradient();

  // Generate bubbles
  const bubbles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    delay: i * 0.5,
    x: 20 + Math.random() * 40,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-8 hover-lift ${percentage < 20 ? 'glass-glow-danger' : percentage < 50 ? 'glass-glow-warning' : ''}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center"
          animate={isRefilling ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Droplets className="w-5 h-5 text-secondary" />
        </motion.div>
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">Water Tank</h3>
          <p className="text-sm text-muted-foreground">Real-time water budget</p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Tank Visualization */}
        <div className="relative">
          <svg width="80" height="200" viewBox="0 0 80 200">
            {/* Tank Outline */}
            <rect
              x="5"
              y="10"
              width="70"
              height="180"
              rx="10"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="3"
            />

            {/* Dynamic Water Gradient */}
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <motion.stop
                  offset="0%"
                  animate={{ stopColor: waterColors.start }}
                  transition={{ duration: 0.5 }}
                />
                <motion.stop
                  offset="100%"
                  animate={{ stopColor: waterColors.end }}
                  transition={{ duration: 0.5 }}
                />
              </linearGradient>
              <clipPath id="tankClip">
                <rect x="8" y="13" width="64" height="174" rx="8" />
              </clipPath>
              {/* Wave pattern */}
              <pattern id="wavePattern" x="0" y="0" width="64" height="10" patternUnits="userSpaceOnUse">
                <motion.path
                  d="M0 5 Q16 0, 32 5 T64 5"
                  fill="none"
                  stroke="hsl(199, 98%, 62%)"
                  strokeWidth="2"
                  opacity={0.5}
                  animate={{ x: [-64, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </pattern>
            </defs>

            <g clipPath="url(#tankClip)">
              {/* Main water body */}
              <motion.rect
                x="8"
                width="64"
                rx="8"
                fill="url(#waterGradient)"
                style={{ y: waterY, height: waterHeight }}
              />

              {/* Animated wave surface */}
              <motion.ellipse
                cx="40"
                fill="hsl(199, 98%, 62%)"
                opacity={0.5}
                rx={32}
                cy={waterY as unknown as number}
                animate={{ ry: [3, 5, 3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Second wave layer */}
              <motion.ellipse
                cx="40"
                fill="hsl(199, 98%, 72%)"
                opacity={0.3}
                rx={32}
                cy={waterY as unknown as number}
                animate={{
                  ry: [2, 4, 2],
                  cx: [38, 42, 38],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />

              {/* Rising bubbles */}
              {bubbles.map((bubble) => (
                <Bubble key={bubble.id} delay={bubble.delay} x={bubble.x} />
              ))}
            </g>

            {/* Level Markers */}
            {[25, 50, 75].map((level) => (
              <g key={level}>
                <line
                  x1="75"
                  y1={187 - (174 * level / 100)}
                  x2="80"
                  y2={187 - (174 * level / 100)}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1"
                />
                <text
                  x="82"
                  y={187 - (174 * level / 100) + 4}
                  fontSize="8"
                  fill="hsl(var(--muted-foreground))"
                >
                  {level}%
                </text>
              </g>
            ))}

            {/* Low level warning ripple */}
            {percentage < 20 && (
              <motion.rect
                x="8"
                y="13"
                width="64"
                height="174"
                rx="8"
                fill="none"
                stroke="hsl(0, 65%, 51%)"
                strokeWidth="2"
                animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.02, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            {/* Refill animation */}
            {isRefilling && (
              <>
                {[0, 1, 2].map((i) => (
                  <motion.circle
                    key={i}
                    cx="40"
                    cy="13"
                    r="5"
                    fill="hsl(199, 98%, 52%)"
                    initial={{ cy: -10, opacity: 1 }}
                    animate={{ cy: 187 - (174 * percentage / 100), opacity: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                  />
                ))}
              </>
            )}
          </svg>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-4">
          <motion.div
            className="glass-card p-4 bg-muted/30"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-sm text-muted-foreground">Total Capacity</p>
            <p className="text-2xl font-display font-bold text-foreground">
              {(totalCapacity / 1000).toFixed(1)} <span className="text-base font-normal">m³</span>
            </p>
          </motion.div>

          <motion.div
            className="glass-card p-4 bg-secondary/10"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-sm text-muted-foreground">Remaining</p>
            <motion.p
              className="text-2xl font-display font-bold text-secondary"
              key={remaining}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
            >
              {(remaining / 1000).toFixed(1)} <span className="text-base font-normal">m³</span>
            </motion.p>
            <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(0)}% of capacity</p>
          </motion.div>

          <motion.div
            className="glass-card p-4 bg-primary/10"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-sm text-muted-foreground">Used to Date</p>
            <p className="text-2xl font-display font-bold text-primary">
              {(usedWater / 1000).toFixed(1)} <span className="text-base font-normal">m³</span>
            </p>
          </motion.div>

          <motion.div
            className={`glass-card p-4 ${daysRemaining < 7 ? 'bg-warning/10' : 'bg-success/10'}`}
            whileHover={{ scale: 1.02 }}
            animate={daysRemaining < 7 ? { boxShadow: ['0 0 0 0 hsl(38, 100%, 50%, 0)', '0 0 20px 0 hsl(38, 100%, 50%, 0.3)', '0 0 0 0 hsl(38, 100%, 50%, 0)'] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <p className="text-sm text-muted-foreground">Estimated Days Left</p>
            <p className={`text-2xl font-display font-bold ${daysRemaining < 7 ? 'text-warning' : 'text-success'}`}>
              {daysRemaining} <span className="text-base font-normal">days</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Based on {dailyNeed}mm/day × {fieldSize} acres</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default WaterTankVisualization;

