import React from 'react';
import { motion } from 'framer-motion';
import { Wheat, Leaf, Sprout } from 'lucide-react';

interface CropIconProps {
  type: 'wheat' | 'corn' | 'tomato';
  isHealthy?: boolean;
  size?: 'sm' | 'md' | 'lg';
  floating?: boolean;
}

const CropIcon: React.FC<CropIconProps> = ({
  type,
  isHealthy = true,
  size = 'md',
  floating = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const iconSize = {
    sm: 24,
    md: 48,
    lg: 72,
  };

  const getIcon = () => {
    switch (type) {
      case 'wheat':
        return <Wheat size={iconSize[size]} />;
      case 'corn':
        return <Sprout size={iconSize[size]} />;
      case 'tomato':
      default:
        return <Leaf size={iconSize[size]} />;
    }
  };

  // Different animation based on health status
  const healthyAnimation = {
    rotate: [0, 3, -3, 2, -2, 0],
    y: [0, -2, 0, -1, 0],
  };

  const unhealthyAnimation = {
    rotate: [0, -5, -8, -5, 0],
    opacity: [0.7, 0.5, 0.7],
  };

  // Color based on crop type
  const cropColors = {
    wheat: 'text-amber-500',
    corn: 'text-green-500',
    tomato: 'text-red-500',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      animate={floating ? {
        y: [0, -12, -6, -18, 0],
        rotate: [0, 3, 0, -3, 0],
        scale: [1, 1.02, 1, 1.02, 1],
      } : undefined}
      transition={floating ? {
        duration: 5,
        ease: "easeInOut",
        repeat: Infinity,
      } : undefined}
    >
      {/* Glow effect when healthy */}
      {isHealthy && (
        <motion.div
          className={`absolute inset-0 ${cropColors[type]} blur-xl opacity-30 rounded-full`}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Main icon with sway/droop animation */}
      <motion.div
        className={`${isHealthy ? cropColors[type] : 'text-gray-400'} relative z-10`}
        animate={isHealthy ? healthyAnimation : unhealthyAnimation}
        transition={{
          duration: isHealthy ? 4 : 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          filter: isHealthy ? 'none' : 'saturate(0.3) brightness(0.8)',
          transformOrigin: 'bottom center',
        }}
      >
        {getIcon()}
      </motion.div>

      {/* Water droplet effect when healthy */}
      {isHealthy && (
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -5, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [-5, 0, 5, 10],
            scale: [0.5, 1, 0.8, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          <div className="w-2 h-2 rounded-full bg-blue-400" />
        </motion.div>
      )}

      {/* Ground shadow */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/20 rounded-full blur-sm"
        style={{ width: '60%', height: '4px' }}
        animate={{
          scaleX: isHealthy ? [1, 1.1, 1] : [0.8, 0.9, 0.8],
          opacity: isHealthy ? [0.3, 0.4, 0.3] : [0.2, 0.25, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
    </motion.div>
  );
};

export default CropIcon;
