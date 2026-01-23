import React, { useRef, useState, MouseEvent as ReactMouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    maxTilt?: number;
    perspective?: number;
    scale?: number;
    speed?: number;
    glare?: boolean;
    glareMaxOpacity?: number;
}

/**
 * TiltCard - 3D parallax tilt effect on mouse move
 * Provides a premium feel with cursor-following shadow and optional glare
 */
const TiltCard: React.FC<TiltCardProps> = ({
    children,
    className = '',
    maxTilt = 10,
    perspective = 1000,
    scale = 1.02,
    speed = 400,
    glare = true,
    glareMaxOpacity = 0.2,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Motion values for tilt
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);

    // Spring physics for smooth animation
    const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
    const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

    // Glare position
    const glareX = useMotionValue(50);
    const glareY = useMotionValue(50);

    // Glare background transform
    const glareBackground = useTransform(
        [glareX, glareY],
        ([x, y]) =>
            `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,${isHovered ? glareMaxOpacity : 0}) 0%, transparent 60%)`
    );

    // Shadow offset based on tilt
    const shadowX = useTransform(springRotateY, [-maxTilt, maxTilt], [-10, 10]);
    const shadowY = useTransform(springRotateX, [-maxTilt, maxTilt], [10, -10]);

    // Shadow transform
    const boxShadow = useTransform(
        [shadowX, shadowY],
        ([x, y]) =>
            isHovered
                ? `${x}px ${y}px 30px rgba(0,0,0,0.15)`
                : '0 10px 30px rgba(0,0,0,0.1)'
    );

    const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Calculate rotation (inverted for natural feel)
        const tiltX = (mouseY / (rect.height / 2)) * -maxTilt;
        const tiltY = (mouseX / (rect.width / 2)) * maxTilt;

        rotateX.set(tiltX);
        rotateY.set(tiltY);

        // Calculate glare position (percentage)
        const glareXPos = ((e.clientX - rect.left) / rect.width) * 100;
        const glareYPos = ((e.clientY - rect.top) / rect.height) * 100;
        glareX.set(glareXPos);
        glareY.set(glareYPos);
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        rotateX.set(0);
        rotateY.set(0);
        glareX.set(50);
        glareY.set(50);
    };

    return (
        <motion.div
            ref={cardRef}
            className={`relative ${className}`}
            style={{
                perspective: perspective,
                transformStyle: 'preserve-3d',
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                style={{
                    rotateX: springRotateX,
                    rotateY: springRotateY,
                    transformStyle: 'preserve-3d',
                }}
                animate={{
                    scale: isHovered ? scale : 1,
                }}
                transition={{ duration: speed / 1000 }}
                className="relative w-full h-full"
            >
                {children}

                {/* Glare effect */}
                {glare && (
                    <motion.div
                        className="absolute inset-0 rounded-[inherit] pointer-events-none overflow-hidden"
                        style={{
                            background: glareBackground,
                        }}
                    />
                )}

                {/* Dynamic shadow */}
                <motion.div
                    className="absolute inset-0 -z-10 rounded-[inherit] opacity-30"
                    style={{
                        boxShadow: boxShadow,
                    }}
                />
            </motion.div>
        </motion.div>
    );
};

export default TiltCard;
