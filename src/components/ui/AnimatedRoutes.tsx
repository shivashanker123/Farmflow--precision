import React from 'react';
import { Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

interface AnimatedRoutesProps {
    children: React.ReactNode;
}

/**
 * AnimatedRoutes - Wrapper for Routes that enables exit animations
 * Uses AnimatePresence to handle route transitions
 */
const AnimatedRoutes: React.FC<AnimatedRoutesProps> = ({ children }) => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
                {children}
            </Routes>
        </AnimatePresence>
    );
};

export default AnimatedRoutes;
