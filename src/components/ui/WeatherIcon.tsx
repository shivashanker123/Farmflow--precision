import React from 'react';
import { motion } from 'framer-motion';

interface WeatherIconProps {
    condition: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * WeatherIcon - Animated weather icons based on conditions
 * Features: rotating sun rays, falling rain, floating clouds, lightning flash
 */
const WeatherIcon: React.FC<WeatherIconProps> = ({
    condition,
    className = '',
    size = 'md',
}) => {
    const sizeMap = {
        sm: 16,
        md: 24,
        lg: 32,
    };

    const iconSize = sizeMap[size];
    const conditionLower = condition.toLowerCase();

    // Determine weather type from condition string
    const getWeatherType = () => {
        if (conditionLower.includes('sun') || conditionLower.includes('clear')) return 'sunny';
        if (conditionLower.includes('rain') || conditionLower.includes('shower')) return 'rainy';
        if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return 'thunder';
        if (conditionLower.includes('snow')) return 'snow';
        if (conditionLower.includes('fog') || conditionLower.includes('mist')) return 'fog';
        if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) return 'cloudy';
        if (conditionLower.includes('partly')) return 'partlyCloudy';
        return 'sunny';
    };

    const weatherType = getWeatherType();

    // Sun with rotating rays
    const SunIcon = () => (
        <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} className={className}>
            {/* Sun rays - rotating */}
            <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: 'center' }}
            >
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                    <motion.line
                        key={angle}
                        x1="12"
                        y1="2"
                        x2="12"
                        y2="4"
                        stroke="hsl(38, 100%, 50%)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        transform={`rotate(${angle} 12 12)`}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                    />
                ))}
            </motion.g>
            {/* Sun body */}
            <motion.circle
                cx="12"
                cy="12"
                r="4"
                fill="hsl(38, 100%, 50%)"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
        </svg>
    );

    // Rainy cloud with falling drops
    const RainIcon = () => (
        <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} className={className}>
            {/* Cloud */}
            <motion.path
                d="M6.5 17h11c2.26 0 4-1.74 4-4s-1.74-4-4-4c-.25 0-.5.02-.74.06C16.14 6.95 14.2 5.5 12 5.5c-2.79 0-5.05 2.27-5.05 5.07 0 .12.01.23.02.35C4.77 11.31 3 13.3 3 15.7c0 .65.47 1.3 1 1.3h2.5"
                fill="hsl(215, 20%, 65%)"
                animate={{ y: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            {/* Rain drops */}
            {[0, 1, 2].map((i) => (
                <motion.line
                    key={i}
                    x1={8 + i * 4}
                    y1="18"
                    x2={7 + i * 4}
                    y2="21"
                    stroke="hsl(199, 98%, 52%)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    animate={{ y: [0, 4], opacity: [1, 0] }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.2,
                    }}
                />
            ))}
        </svg>
    );

    // Cloud icon with floating animation
    const CloudIcon = () => (
        <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} className={className}>
            <motion.path
                d="M6.5 17h11c2.26 0 4-1.74 4-4s-1.74-4-4-4c-.25 0-.5.02-.74.06C16.14 6.95 14.2 5.5 12 5.5c-2.79 0-5.05 2.27-5.05 5.07 0 .12.01.23.02.35C4.77 11.31 3 13.3 3 15.7c0 .65.47 1.3 1 1.3h2.5"
                fill="hsl(215, 20%, 65%)"
                animate={{ x: [0, 2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
        </svg>
    );

    // Partly cloudy - sun peeking behind cloud
    const PartlyCloudyIcon = () => (
        <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} className={className}>
            {/* Sun behind */}
            <motion.circle
                cx="8"
                cy="8"
                r="3"
                fill="hsl(38, 100%, 50%)"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            {/* Cloud in front */}
            <motion.path
                d="M10 19h8c1.65 0 3-1.35 3-3s-1.35-3-3-3c-.18 0-.35.01-.53.04C17.12 11.34 15.76 10 14 10c-2.21 0-4 1.79-4 4 0 .08 0 .16.01.23C8.78 14.53 8 15.58 8 17c0 .48.34 1 .76 1H10z"
                fill="hsl(215, 20%, 75%)"
                animate={{ x: [0, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
        </svg>
    );

    // Thunder with lightning flash
    const ThunderIcon = () => (
        <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} className={className}>
            {/* Cloud */}
            <path
                d="M6.5 15h11c2.26 0 4-1.74 4-4s-1.74-4-4-4c-.25 0-.5.02-.74.06C16.14 4.95 14.2 3.5 12 3.5c-2.79 0-5.05 2.27-5.05 5.07 0 .12.01.23.02.35C4.77 9.31 3 11.3 3 13.7c0 .65.47 1.3 1 1.3h2.5"
                fill="hsl(215, 20%, 55%)"
            />
            {/* Lightning */}
            <motion.path
                d="M13 12l-2 5h3l-2 5 5-7h-3l2-4h-3v1z"
                fill="hsl(45, 100%, 60%)"
                animate={{ opacity: [0, 1, 1, 0, 0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, times: [0, 0.1, 0.2, 0.3, 0.7, 0.8, 1] }}
            />
        </svg>
    );

    // Snow with falling flakes
    const SnowIcon = () => (
        <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} className={className}>
            {/* Cloud */}
            <path
                d="M6.5 14h11c2.26 0 4-1.74 4-4s-1.74-4-4-4c-.25 0-.5.02-.74.06C16.14 3.95 14.2 2.5 12 2.5c-2.79 0-5.05 2.27-5.05 5.07 0 .12.01.23.02.35C4.77 8.31 3 10.3 3 12.7c0 .65.47 1.3 1 1.3h2.5"
                fill="hsl(215, 20%, 75%)"
            />
            {/* Snowflakes */}
            {[0, 1, 2].map((i) => (
                <motion.circle
                    key={i}
                    cx={7 + i * 5}
                    cy="18"
                    r="1.5"
                    fill="white"
                    stroke="hsl(200, 50%, 80%)"
                    strokeWidth="0.5"
                    animate={{ y: [0, 6], opacity: [1, 0] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: 'easeIn',
                    }}
                />
            ))}
        </svg>
    );

    // Fog with wavy lines
    const FogIcon = () => (
        <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} className={className}>
            {[8, 12, 16].map((y, i) => (
                <motion.path
                    key={y}
                    d={`M4 ${y}h16`}
                    stroke="hsl(215, 20%, 70%)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ x: [0, 3, 0, -3, 0] }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </svg>
    );

    // Render appropriate icon
    const renderIcon = () => {
        switch (weatherType) {
            case 'sunny':
                return <SunIcon />;
            case 'rainy':
                return <RainIcon />;
            case 'cloudy':
                return <CloudIcon />;
            case 'partlyCloudy':
                return <PartlyCloudyIcon />;
            case 'thunder':
                return <ThunderIcon />;
            case 'snow':
                return <SnowIcon />;
            case 'fog':
                return <FogIcon />;
            default:
                return <SunIcon />;
        }
    };

    return <div className={`inline-flex items-center justify-center ${className}`}>{renderIcon()}</div>;
};

export default WeatherIcon;
