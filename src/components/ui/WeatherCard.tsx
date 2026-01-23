import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherIcon from './WeatherIcon';

interface WeatherData {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed?: number;
    location?: string;
}

interface ForecastItem {
    day: string;
    high: number;
    low: number;
    condition: string;
}

interface WeatherCardProps {
    currentWeather: WeatherData;
    forecast?: ForecastItem[];
    className?: string;
}

/**
 * WeatherCard - Animated weather display with ambient effects and forecast
 * Features: Animated weather icons, ambient background matching weather, staggered forecast cards
 */
const WeatherCard: React.FC<WeatherCardProps> = ({
    currentWeather,
    forecast = [],
    className = '',
}) => {
    const conditionLower = currentWeather.condition.toLowerCase();

    // Determine ambient background based on weather
    const getAmbientStyles = () => {
        if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
            return {
                gradient: 'from-amber-500/20 via-orange-400/10 to-yellow-300/5',
                ambientColor: 'bg-amber-500/10',
            };
        }
        if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
            return {
                gradient: 'from-blue-600/20 via-slate-500/15 to-cyan-400/5',
                ambientColor: 'bg-blue-500/15',
            };
        }
        if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
            return {
                gradient: 'from-slate-500/20 via-gray-400/15 to-slate-300/5',
                ambientColor: 'bg-slate-500/10',
            };
        }
        if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
            return {
                gradient: 'from-purple-600/25 via-slate-600/20 to-indigo-400/10',
                ambientColor: 'bg-purple-500/15',
            };
        }
        if (conditionLower.includes('snow')) {
            return {
                gradient: 'from-sky-200/30 via-slate-200/20 to-white/10',
                ambientColor: 'bg-sky-200/20',
            };
        }
        return {
            gradient: 'from-sky-500/15 via-blue-400/10 to-cyan-300/5',
            ambientColor: 'bg-sky-500/10',
        };
    };

    const { gradient, ambientColor } = getAmbientStyles();

    // Rain drops ambient effect
    const RainAmbient = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-0.5 h-6 bg-gradient-to-b from-blue-400/60 to-transparent rounded-full"
                    style={{ left: `${(i * 8) + Math.random() * 5}%` }}
                    initial={{ top: '-10%', opacity: 0 }}
                    animate={{ top: '110%', opacity: [0, 0.8, 0] }}
                    transition={{
                        duration: 0.8 + Math.random() * 0.4,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: 'linear',
                    }}
                />
            ))}
        </div>
    );

    // Sun rays ambient effect
    const SunAmbient = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-radial from-yellow-400/30 via-orange-300/10 to-transparent"
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.4, 0.6, 0.4],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute top-0 right-0 w-1 h-32 bg-gradient-to-b from-yellow-400/40 to-transparent origin-bottom"
                    style={{
                        transform: `rotate(${i * 15 - 30}deg)`,
                        right: '5%',
                    }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                />
            ))}
        </div>
    );

    // Cloud ambient effect
    const CloudAmbient = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-slate-300/20 rounded-full blur-xl"
                    style={{
                        width: 60 + i * 30,
                        height: 30 + i * 15,
                        top: `${20 + i * 15}%`,
                        left: `${-10 + i * 20}%`,
                    }}
                    animate={{ x: [0, 30, 0] }}
                    transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );

    // Thunder flash ambient effect
    const ThunderAmbient = () => (
        <motion.div
            className="absolute inset-0 bg-white/0 pointer-events-none"
            animate={{
                backgroundColor: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']
            }}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 4 }}
        />
    );

    // Render ambient effect based on weather
    const renderAmbient = () => {
        if (conditionLower.includes('rain') || conditionLower.includes('shower')) return <RainAmbient />;
        if (conditionLower.includes('sun') || conditionLower.includes('clear')) return <SunAmbient />;
        if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) return <CloudAmbient />;
        if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
            return (
                <>
                    <CloudAmbient />
                    <ThunderAmbient />
                </>
            );
        }
        return <SunAmbient />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`glass-card p-6 relative overflow-hidden ${className}`}
        >
            {/* Ambient background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

            {/* Weather-specific ambient effects */}
            {renderAmbient()}

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-display font-bold text-foreground">Weather</h3>
                        {currentWeather.location && (
                            <p className="text-sm text-muted-foreground">{currentWeather.location}</p>
                        )}
                    </div>

                    {/* Animated weather icon */}
                    <motion.div
                        className={`p-3 rounded-2xl ${ambientColor}`}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <WeatherIcon condition={currentWeather.condition} size="lg" />
                    </motion.div>
                </div>

                {/* Current Weather */}
                <div className="flex items-end gap-4 mb-6">
                    <motion.p
                        className="text-5xl font-display font-bold text-foreground"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    >
                        {currentWeather.temperature}°
                    </motion.p>
                    <div className="pb-2">
                        <p className="text-lg text-foreground font-medium">{currentWeather.condition}</p>
                        <p className="text-sm text-muted-foreground">
                            Humidity: {currentWeather.humidity}%
                            {currentWeather.windSpeed && ` • Wind: ${currentWeather.windSpeed} km/h`}
                        </p>
                    </div>
                </div>

                {/* Forecast Cards with Staggered Animation */}
                {forecast.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">5-Day Forecast</h4>
                        <div className="grid grid-cols-5 gap-2">
                            <AnimatePresence>
                                {forecast.map((day, index) => (
                                    <motion.div
                                        key={day.day}
                                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{
                                            delay: 0.3 + index * 0.1,
                                            type: 'spring',
                                            stiffness: 200,
                                            damping: 15,
                                        }}
                                        whileHover={{ scale: 1.05, y: -3 }}
                                        className="bg-card/50 backdrop-blur-sm rounded-xl p-3 text-center border border-border/50 cursor-default"
                                    >
                                        <p className="text-xs font-semibold text-foreground mb-2">{day.day}</p>
                                        <WeatherIcon condition={day.condition} size="sm" className="mx-auto mb-2" />
                                        <div className="text-xs">
                                            <span className="font-bold text-foreground">{day.high}°</span>
                                            <span className="text-muted-foreground ml-1">{day.low}°</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default WeatherCard;
