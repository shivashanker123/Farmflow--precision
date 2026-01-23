import React from 'react';
import { motion } from 'framer-motion';

interface StatusIndicatorProps {
    status: 'online' | 'offline' | 'warning' | 'error';
    label?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * StatusIndicator - Animated breathing status dot with optional label
 * Features pulsing glow effect for active states
 */
const StatusIndicator: React.FC<StatusIndicatorProps> = ({
    status,
    label,
    showLabel = true,
    size = 'md',
    className = '',
}) => {
    const statusConfig = {
        online: {
            color: 'bg-success',
            glowColor: 'shadow-[0_0_10px_hsl(122,47%,35%)]',
            label: label || 'Online',
            animate: true,
        },
        offline: {
            color: 'bg-muted-foreground',
            glowColor: '',
            label: label || 'Offline',
            animate: false,
        },
        warning: {
            color: 'bg-warning',
            glowColor: 'shadow-[0_0_10px_hsl(38,100%,50%)]',
            label: label || 'Warning',
            animate: true,
        },
        error: {
            color: 'bg-destructive',
            glowColor: 'shadow-[0_0_10px_hsl(0,65%,51%)]',
            label: label || 'Error',
            animate: true,
        },
    };

    const sizeConfig = {
        sm: { dot: 'w-1.5 h-1.5', text: 'text-[10px]', gap: 'gap-1' },
        md: { dot: 'w-2 h-2', text: 'text-xs', gap: 'gap-1.5' },
        lg: { dot: 'w-3 h-3', text: 'text-sm', gap: 'gap-2' },
    };

    const config = statusConfig[status];
    const sizes = sizeConfig[size];

    return (
        <div className={`flex items-center ${sizes.gap} ${className}`}>
            <motion.div
                className={`rounded-full ${sizes.dot} ${config.color} ${config.glowColor}`}
                animate={
                    config.animate
                        ? {
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.7, 1],
                        }
                        : {}
                }
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            {showLabel && (
                <span className={`${sizes.text} text-muted-foreground`}>
                    {config.label}
                </span>
            )}
        </div>
    );
};

export default StatusIndicator;
