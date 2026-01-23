import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Wifi, Cloud } from 'lucide-react';

interface SensorCardProps {
  type: 'temperature' | 'humidity';
  value: number;
  unit: string;
  isLive: boolean;
}

const SensorCard: React.FC<SensorCardProps> = ({
  type,
  value,
  unit,
  isLive,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevValueRef = useRef(value);
  const [isHovered, setIsHovered] = useState(false);

  // Animate the number counting up/down with smooth easing
  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsPulsing(true);

      const startValue = prevValueRef.current;
      const endValue = value;
      const duration = 600;
      const startTime = Date.now();

      const animateValue = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (endValue - startValue) * eased;
        setDisplayValue(Math.round(current));

        if (progress < 1) {
          requestAnimationFrame(animateValue);
        }
      };

      requestAnimationFrame(animateValue);
      prevValueRef.current = value;

      setTimeout(() => setIsPulsing(false), 700);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const config = {
    temperature: {
      icon: Thermometer,
      label: 'Temperature',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/15',
      gradient: 'from-orange-500/20 to-amber-500/10',
      glowColor: '0 0 30px hsla(25, 95%, 53%, 0.4)',
      borderColor: 'border-orange-500/30',
    },
    humidity: {
      icon: Droplets,
      label: 'Humidity',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/15',
      gradient: 'from-blue-500/20 to-cyan-500/10',
      glowColor: '0 0 30px hsla(199, 89%, 48%, 0.4)',
      borderColor: 'border-blue-500/30',
    },
  };

  const { icon: Icon, label, color, bgColor, gradient, glowColor, borderColor } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        rotateY: 5,
        rotateX: -3,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      className={`glass-card p-5 relative overflow-hidden cursor-default transition-shadow duration-300 ${isHovered ? `shadow-lg ${borderColor} border` : ''
        }`}
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-50'}`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div
            className={`p-3 rounded-xl ${bgColor} backdrop-blur-sm`}
            animate={isPulsing ? {
              scale: [1, 1.25, 1],
            } : {}}
            transition={{ duration: 0.4 }}
          >
            <Icon className={`w-6 h-6 ${color}`} />
          </motion.div>

          {/* Live indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${isLive
                ? 'bg-green-500/20 text-green-500'
                : 'bg-gray-500/20 text-gray-400'
              }`}
          >
            {isLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <Wifi className="w-4 h-4" />
                <span>LIVE</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                <span>API</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={`value-${displayValue}`}
              initial={{ opacity: 0.5, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`text-4xl font-display font-bold tabular-nums ${isPulsing ? color : 'text-foreground'}`}
            >
              {displayValue}
            </motion.span>
            <span className="text-lg text-muted-foreground">{unit}</span>
          </div>
        </div>
      </div>

      {/* Pulse ring effect - more visible */}
      {isPulsing && (
        <motion.div
          className={`absolute inset-0 rounded-3xl border-2 ${type === 'temperature' ? 'border-orange-500' : 'border-blue-500'}`}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  );
};

export default SensorCard;
