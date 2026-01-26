import React from 'react';
import { motion } from 'framer-motion';
import {
    Droplets,
    TrendingDown,
    Calendar,
    Award,
    BarChart3
} from 'lucide-react';
import { ImpactMetrics } from '@/contexts/FarmContext';

/**
 * IMPACT DASHBOARD COMPONENT
 * 
 * Visualizes water savings vs traditional irrigation
 * Shows farmer the tangible benefits of smart irrigation
 * 
 * METRICS SHOWN:
 * - Total water saved (liters)
 * - Percentage reduction vs traditional
 * - Count of skipped irrigations
 * - Count of deficit (reduced) irrigations
 * - Estimated days of water extended
 * 
 * DESIGN: Card-based layout with animated counters
 */

interface ImpactDashboardProps {
    metrics: ImpactMetrics;
    className?: string;
}

const ImpactDashboard: React.FC<ImpactDashboardProps> = ({
    metrics,
    className = '',
}) => {
    /**
     * Format large numbers for display
     * e.g., 125000 -> "125K"
     */
    const formatLargeNumber = (num: number): string => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    // Stat cards configuration
    const statCards = [
        {
            id: 'water-saved',
            label: 'Water Saved',
            value: formatLargeNumber(metrics.waterSavedLiters),
            unit: 'liters',
            icon: Droplets,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            description: 'Total saved this season',
        },
        {
            id: 'percent-saved',
            label: 'Reduction',
            value: metrics.waterSavedPercent,
            unit: '%',
            icon: TrendingDown,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            description: 'vs. traditional irrigation',
        },
        {
            id: 'skipped',
            label: 'Skipped',
            value: metrics.skippedIrrigations,
            unit: 'times',
            icon: Calendar,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            description: 'Smart skip decisions',
        },
        {
            id: 'days-extended',
            label: 'Days Extended',
            value: metrics.estimatedDaysExtended,
            unit: 'days',
            icon: Award,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            description: 'Extra water availability',
        },
    ];

    return (
        <div className={`glass-card p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-display font-bold text-lg text-foreground">
                        Water Savings Impact
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Smart irrigation benefits
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <motion.div
                            key={stat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`
                p-4 rounded-xl
                ${stat.bgColor}
                border border-transparent
                hover:border-border/50 transition-colors
              `}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-4 h-4 ${stat.color}`} />
                                <span className="text-xs text-muted-foreground font-medium">
                                    {stat.label}
                                </span>
                            </div>

                            <motion.p
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                                className={`text-2xl font-bold ${stat.color}`}
                            >
                                {stat.value}
                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                    {stat.unit}
                                </span>
                            </motion.p>

                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.description}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Deficit Irrigation Badge */}
            {metrics.deficitIrrigations > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 p-3 rounded-lg bg-muted/30 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <TrendingDown className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                Deficit Irrigations
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Reduced water when safe
                            </p>
                        </div>
                    </div>
                    <span className="text-lg font-bold text-amber-500">
                        {metrics.deficitIrrigations}
                    </span>
                </motion.div>
            )}

            {/* Success Message */}
            {metrics.waterSavedPercent > 20 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center"
                >
                    <p className="text-sm text-green-500 font-medium">
                        🎉 Great job! You're saving {metrics.waterSavedPercent}% more water than traditional irrigation.
                    </p>
                </motion.div>
            )}
        </div>
    );
};

export default ImpactDashboard;
