import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Gauge, TrendingDown, Zap, AlertTriangle } from 'lucide-react';
import { IrrigationRecommendation } from '@/contexts/FarmContext';

/**
 * SMART RECOMMENDATION CARD COMPONENT
 * 
 * Displays the AI-driven irrigation recommendation with visual intensity dial
 * Shows graduated percentage (100/70/40/0%) instead of simple yes/no
 * 
 * DESIGN:
 * - Circular gauge showing intensity percentage
 * - Color-coded: green(skip), blue(partial), primary(full)
 * - Clear explanation of the recommendation reason
 */

interface SmartRecommendationCardProps {
    recommendation: IrrigationRecommendation;
    onAccept?: () => void;
    isManualOverride?: boolean;
}

const SmartRecommendationCard: React.FC<SmartRecommendationCardProps> = ({
    recommendation,
    onAccept,
    isManualOverride = false,
}) => {
    const { action, intensity, reason, volume } = recommendation;

    /**
     * Get colors based on intensity level
     * Higher intensity = more urgent = warmer colors
     */
    const getIntensityStyle = () => {
        if (intensity === 0) {
            return {
                gradient: 'from-green-500 to-emerald-400',
                bgColor: 'bg-green-500/10',
                textColor: 'text-green-500',
                ringColor: 'ring-green-500/20',
            };
        }
        if (intensity <= 40) {
            return {
                gradient: 'from-amber-500 to-orange-400',
                bgColor: 'bg-amber-500/10',
                textColor: 'text-amber-500',
                ringColor: 'ring-amber-500/20',
            };
        }
        if (intensity <= 70) {
            return {
                gradient: 'from-blue-500 to-cyan-400',
                bgColor: 'bg-blue-500/10',
                textColor: 'text-blue-500',
                ringColor: 'ring-blue-500/20',
            };
        }
        return {
            gradient: 'from-primary to-primary/70',
            bgColor: 'bg-primary/10',
            textColor: 'text-primary',
            ringColor: 'ring-primary/20',
        };
    };

    const style = getIntensityStyle();

    /**
     * Get label for intensity level
     */
    const getIntensityLabel = () => {
        if (intensity === 0) return 'Skip Irrigation';
        if (intensity === 40) return 'Deficit Irrigation';
        if (intensity === 70) return 'Reduced Irrigation';
        return 'Full Irrigation';
    };

    /**
     * Format volume for display
     * ASSUMPTION: Volume is in liters, show in appropriate units
     */
    const formatVolume = (liters: number) => {
        if (liters >= 1000) {
            return `${(liters / 1000).toFixed(1)} kL`;
        }
        return `${liters} L`;
    };

    // Calculate gauge rotation (0-180 degrees for 0-100%)
    const gaugeRotation = (intensity / 100) * 180;

    return (
        <div className={`
      glass-card p-6 relative overflow-hidden
      ${intensity >= 70 ? 'ring-2 ' + style.ringColor : ''}
    `}>
            {/* Manual override indicator */}
            {isManualOverride && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Manual Mode
                </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-4">
                {/* Intensity Gauge */}
                <div className="relative w-20 h-20 flex-shrink-0">
                    {/* Background arc */}
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-muted/30"
                            strokeDasharray="251.2"
                            strokeLinecap="round"
                        />
                        {/* Filled arc */}
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="url(#gaugeGradient)"
                            strokeWidth="8"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * intensity) / 100}
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: 251.2 }}
                            animate={{ strokeDashoffset: 251.2 - (251.2 * intensity) / 100 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                        <defs>
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" className="text-green-500" stopColor="currentColor" />
                                <stop offset="50%" className="text-blue-500" stopColor="currentColor" />
                                <stop offset="100%" className="text-primary" stopColor="currentColor" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${style.textColor}`}>
                            {intensity}%
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className={`font-display font-bold text-lg ${style.textColor}`}>
                        {getIntensityLabel()}
                    </h3>

                    <p className="text-sm text-muted-foreground mt-1">
                        {reason}
                    </p>

                    {/* Volume indicator (if irrigating) */}
                    {volume > 0 && (
                        <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2">
                                <Droplets className={`w-4 h-4 ${style.textColor}`} />
                                <span className="text-sm font-medium text-foreground">
                                    {formatVolume(volume)}
                                </span>
                            </div>

                            {intensity < 100 && (
                                <div className="flex items-center gap-1 text-xs text-green-500">
                                    <TrendingDown className="w-3 h-3" />
                                    Saving {100 - intensity}%
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick action button */}
            {onAccept && action === 'irrigate' && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAccept}
                    className={`
            w-full mt-4 py-3 rounded-xl font-medium text-sm
            flex items-center justify-center gap-2
            bg-gradient-to-r ${style.gradient} text-white
            shadow-lg shadow-primary/20
          `}
                >
                    <Zap className="w-4 h-4" />
                    Start Irrigation ({intensity}%)
                </motion.button>
            )}

            {/* Skip confirmation */}
            {action === 'skip' && (
                <div className={`mt-4 p-3 rounded-xl ${style.bgColor} text-center`}>
                    <p className={`text-sm font-medium ${style.textColor}`}>
                        ✓ No irrigation needed right now
                    </p>
                </div>
            )}
        </div>
    );
};

export default SmartRecommendationCard;
