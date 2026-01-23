import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
    value: number;
    decimals?: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    showPulse?: boolean;
}

/**
 * AnimatedCounter - Animates number counting up/down with spring physics
 * Used for water saved, tank levels, efficiency scores, etc.
 */
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    decimals = 0,
    duration = 0.8,
    prefix = '',
    suffix = '',
    className = '',
    showPulse = true,
}) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [isPulsing, setIsPulsing] = useState(false);
    const prevValueRef = useRef(value);

    // Spring animation for the number
    const springValue = useSpring(value, {
        stiffness: 100,
        damping: 30,
        duration: duration * 1000,
    });

    // Transform spring value to display string
    const displayString = useTransform(springValue, (latest) =>
        latest.toFixed(decimals)
    );

    // Update display value and trigger pulse on change
    useEffect(() => {
        if (prevValueRef.current !== value) {
            springValue.set(value);
            if (showPulse) {
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), 300);
            }
            prevValueRef.current = value;
        }
    }, [value, springValue, showPulse]);

    // Subscribe to springValue changes
    useEffect(() => {
        const unsubscribe = displayString.on('change', (latest) => {
            setDisplayValue(parseFloat(latest));
        });
        return () => unsubscribe();
    }, [displayString]);

    return (
        <motion.span
            className={`inline-block tabular-nums ${className}`}
            animate={isPulsing ? {
                scale: [1, 1.1, 1],
                color: ['currentColor', 'hsl(var(--primary))', 'currentColor']
            } : {}}
            transition={{ duration: 0.3 }}
        >
            {prefix}
            {displayValue.toFixed(decimals)}
            {suffix}
        </motion.span>
    );
};

export default AnimatedCounter;
