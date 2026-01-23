import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, animate, useSpring } from 'framer-motion';
import { Droplets, Check, Zap } from 'lucide-react';
import ParticleSystem from './ParticleSystem';

interface SwipeToIrrigateProps {
  onActivate: () => void;
  isActive: boolean;
}

const SwipeToIrrigate: React.FC<SwipeToIrrigateProps> = ({ onActivate, isActive }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [hapticPulse, setHapticPulse] = useState(false);

  const x = useMotionValue(0);
  const sliderWidth = 280;
  const handleWidth = 56;
  const maxX = sliderWidth - handleWidth - 8;

  // Spring-based motion for smoother feel
  const springX = useSpring(x, { stiffness: 400, damping: 40 });

  const background = useTransform(
    springX,
    [0, maxX],
    ['hsl(var(--muted))', 'hsl(var(--secondary))']
  );

  const textOpacity = useTransform(springX, [0, maxX * 0.5], [1, 0]);

  // Progress indicator
  const progress = useTransform(springX, [0, maxX], [0, 100]);
  const progressWidth = useTransform(springX, [0, maxX], ['0%', '100%']);

  // Haptic feedback at thresholds
  const checkThresholds = (value: number) => {
    const thresholds = [0.25, 0.5, 0.75, 0.9];
    const currentProgress = value / maxX;

    for (const threshold of thresholds) {
      if (currentProgress >= threshold - 0.02 && currentProgress <= threshold + 0.02) {
        if (!hapticPulse) {
          setHapticPulse(true);
          setTimeout(() => setHapticPulse(false), 100);
        }
        break;
      }
    }
  };

  const handleDrag = (_: PointerEvent, info: { point: { x: number } }) => {
    checkThresholds(x.get());
  };

  const handleDragEnd = () => {
    if (x.get() > maxX * 0.8) {
      animate(x, maxX, { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 });
      setIsLocked(true);
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 2000);
      onActivate();
    } else {
      // Elastic bounce back
      animate(x, 0, { type: 'spring', stiffness: 600, damping: 25, mass: 0.5 });
    }
  };

  const handleReset = () => {
    if (isLocked) {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
      setIsLocked(false);
      onActivate();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 hover-lift relative overflow-hidden"
    >
      {/* Background particle effect when active */}
      <ParticleSystem isActive={showParticles} type="droplets" count={15} />

      <div className="flex flex-col items-center gap-4">
        <h3 className="font-display font-bold text-lg text-foreground">Irrigation Control</h3>

        {/* Water Flow Animation */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-secondary/10 rounded-xl p-4 mb-2 relative overflow-hidden"
          >
            {/* Water particles */}
            <ParticleSystem isActive={true} type="bubbles" count={8} />

            <svg viewBox="0 0 200 30" className="w-full h-8">
              <defs>
                <linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(199, 98%, 42%)" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="hsl(199, 98%, 52%)" stopOpacity="1" />
                  <stop offset="100%" stopColor="hsl(199, 98%, 42%)" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              {/* Pipe */}
              <rect x="0" y="10" width="200" height="10" rx="5" fill="hsl(var(--muted))" />
              {/* Water Flow */}
              <motion.rect
                x="0"
                y="10"
                width="200"
                height="10"
                rx="5"
                fill="url(#waterFlow)"
                initial={{ x: -200 }}
                animate={{ x: 200 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </svg>
            <div className="flex items-center justify-center gap-2 mt-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-secondary"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-secondary font-medium text-sm">Pump Active - Water Flowing</span>
            </div>
          </motion.div>
        )}

        {/* Slider */}
        <motion.div
          style={{ background }}
          className="relative w-72 h-16 rounded-full overflow-hidden cursor-pointer"
          onClick={isLocked ? handleReset : undefined}
        >
          {/* Progress fill */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-secondary/30 rounded-full"
            style={{ width: progressWidth }}
          />

          {/* Shimmer Effect */}
          {!isLocked && (
            <motion.div
              className="absolute inset-0 animate-shimmer pointer-events-none"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Threshold markers */}
          {!isLocked && (
            <div className="absolute inset-y-0 flex items-center justify-around w-full px-16 pointer-events-none">
              {[0.25, 0.5, 0.75].map((threshold) => (
                <motion.div
                  key={threshold}
                  className="w-1 h-1 rounded-full bg-white/30"
                  style={{ left: `${threshold * 100}%` }}
                />
              ))}
            </div>
          )}

          {/* Text */}
          <motion.div
            style={{ opacity: textOpacity }}
            className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium"
          >
            {isLocked ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Tap to Stop
              </motion.span>
            ) : (
              'Slide to Start Pump'
            )}
          </motion.div>

          {/* Handle */}
          <motion.div
            drag={!isLocked ? 'x' : false}
            dragConstraints={{ left: 0, right: maxX }}
            dragElastic={0.05}
            style={{ x }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className={`absolute top-1 left-1 w-14 h-14 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg ${isLocked ? 'bg-secondary' : 'bg-white'
              }`}
            whileTap={{ scale: 0.9 }}
            animate={hapticPulse ? { scale: [1, 1.15, 1] } : {}}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            {isLocked ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <Check className="w-6 h-6 text-secondary-foreground" />
              </motion.div>
            ) : (
              <motion.div
                animate={{ scale: hapticPulse ? 1.2 : 1 }}
                transition={{ duration: 0.1 }}
              >
                <Droplets className="w-6 h-6 text-secondary" />
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              🚿
            </motion.span>
            Pump Active
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SwipeToIrrigate;

