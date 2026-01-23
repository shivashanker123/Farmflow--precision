import React from 'react';
import { motion } from 'framer-motion';

interface StaggeredItem {
    id: string | number;
    content: React.ReactNode;
}

interface ProgressiveLoaderProps {
    items: StaggeredItem[];
    staggerDelay?: number;
    className?: string;
    itemClassName?: string;
}

/**
 * ProgressiveLoader - Renders items with staggered entrance animations
 * Content appears in waves, not all at once
 */
const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
    items,
    staggerDelay = 0.08,
    className = '',
    itemClassName = '',
}) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: staggerDelay,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 20,
            },
        },
    };

    return (
        <motion.div
            className={className}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {items.map((item) => (
                <motion.div
                    key={item.id}
                    variants={itemVariants}
                    className={itemClassName}
                >
                    {item.content}
                </motion.div>
            ))}
        </motion.div>
    );
};

// Hook for progressive loading with delay
export const useProgressiveLoading = (itemCount: number, delayMs: number = 100) => {
    const [loadedCount, setLoadedCount] = React.useState(0);

    React.useEffect(() => {
        if (loadedCount >= itemCount) return;

        const timeout = setTimeout(() => {
            setLoadedCount((prev) => Math.min(prev + 1, itemCount));
        }, delayMs);

        return () => clearTimeout(timeout);
    }, [loadedCount, itemCount, delayMs]);

    return {
        loadedCount,
        isItemLoaded: (index: number) => index < loadedCount,
        isComplete: loadedCount >= itemCount,
    };
};

// Shared element transition wrapper
interface SharedElementProps {
    layoutId: string;
    children: React.ReactNode;
    className?: string;
}

export const SharedElement: React.FC<SharedElementProps> = ({
    layoutId,
    children,
    className = '',
}) => {
    return (
        <motion.div
            layoutId={layoutId}
            className={className}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
            }}
        >
            {children}
        </motion.div>
    );
};

export default ProgressiveLoader;
