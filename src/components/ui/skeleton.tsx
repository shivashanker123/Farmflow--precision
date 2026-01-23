import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Skeleton - Loading placeholder with shimmer effect
 * Use for progressive loading and loading states
 */
const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true,
}) => {
  const baseClasses = 'bg-muted/60 overflow-hidden relative';

  const variantClasses = {
    text: 'rounded-md h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-2xl',
  };

  const style: React.CSSProperties = {
    width: width ?? '100%',
    height: height ?? (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '100px'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
};

// Pre-built skeleton patterns for common UI elements
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`glass-card p-6 space-y-4 ${className}`}>
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" height={12} />
      </div>
    </div>
    <Skeleton variant="rectangular" height={120} />
    <div className="flex gap-2">
      <Skeleton variant="rectangular" width="30%" height={32} className="rounded-full" />
      <Skeleton variant="rectangular" width="30%" height={32} className="rounded-full" />
    </div>
  </div>
);

export const SkeletonGauge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`glass-card p-8 flex flex-col items-center ${className}`}>
    <Skeleton variant="text" width="40%" className="mb-2" />
    <Skeleton variant="text" width="30%" height={12} className="mb-6" />
    <Skeleton variant="circular" width={200} height={100} className="rounded-t-full rounded-b-none" />
    <div className="mt-4 text-center space-y-2">
      <Skeleton variant="text" width={80} height={32} className="mx-auto" />
      <Skeleton variant="text" width={60} height={16} className="mx-auto" />
    </div>
  </div>
);

export const SkeletonSensorCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`glass-card p-5 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <Skeleton variant="rectangular" width={80} height={28} className="rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" width="40%" height={14} />
      <Skeleton variant="text" width="60%" height={40} />
    </div>
  </div>
);

export const SkeletonWeatherCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`glass-card p-4 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={56} height={56} />
        <div className="space-y-2">
          <Skeleton variant="text" width={80} height={32} />
          <Skeleton variant="text" width={100} height={14} />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton variant="text" width={50} height={16} />
        <Skeleton variant="text" width={70} height={12} />
      </div>
    </div>
    <div className="border-t border-border/50 pt-3 mt-3">
      <div className="grid grid-cols-5 gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton variant="text" width="100%" height={12} />
            <Skeleton variant="circular" width={24} height={24} className="mx-auto" />
            <Skeleton variant="text" width="60%" height={12} className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
