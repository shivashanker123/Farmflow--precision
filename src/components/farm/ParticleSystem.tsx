import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
}

interface ParticleSystemProps {
    isActive: boolean;
    type?: 'droplets' | 'bubbles' | 'splash';
    count?: number;
    containerClassName?: string;
}

/**
 * ParticleSystem - Animated water particles for visual effects
 * Used when irrigation/pump is active
 */
const ParticleSystem: React.FC<ParticleSystemProps> = ({
    isActive,
    type = 'droplets',
    count = 12,
    containerClassName = '',
}) => {
    const [particles, setParticles] = useState<Particle[]>([]);

    // Generate particles when active
    useEffect(() => {
        if (isActive) {
            const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: type === 'bubbles' ? 100 : 0,
                size: 4 + Math.random() * 6,
                delay: Math.random() * 2,
                duration: 1 + Math.random() * 1.5,
            }));
            setParticles(newParticles);
        } else {
            setParticles([]);
        }
    }, [isActive, count, type]);

    const getParticleAnimation = (particle: Particle) => {
        switch (type) {
            case 'bubbles':
                return {
                    y: [0, -120],
                    x: [0, (Math.random() - 0.5) * 20],
                    opacity: [0.8, 0],
                    scale: [1, 0.6],
                };
            case 'splash':
                return {
                    y: [0, -30, 10],
                    x: [(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 40],
                    opacity: [1, 1, 0],
                    scale: [0.5, 1, 0.3],
                };
            case 'droplets':
            default:
                return {
                    y: [0, 80],
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1, 1, 0.5],
                };
        }
    };

    if (!isActive) return null;

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${containerClassName}`}>
            <AnimatePresence>
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        className="absolute rounded-full bg-secondary"
                        style={{
                            left: `${particle.x}%`,
                            top: type === 'bubbles' ? 'auto' : '0',
                            bottom: type === 'bubbles' ? '0' : 'auto',
                            width: particle.size,
                            height: particle.size,
                            boxShadow: '0 0 4px rgba(14, 165, 233, 0.5)',
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={getParticleAnimation(particle)}
                        transition={{
                            duration: particle.duration,
                            delay: particle.delay,
                            repeat: Infinity,
                            ease: type === 'bubbles' ? 'easeOut' : 'easeIn',
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ParticleSystem;
