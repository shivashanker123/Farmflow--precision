import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * PageTransition - Wraps page content with smooth fade + slide animations
 * Use this wrapper in each page component to enable route transitions
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1], // Material Design easing
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
