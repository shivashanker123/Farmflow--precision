import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Leaf, Flower, Wheat } from 'lucide-react';
import { CropStage } from '@/contexts/FarmContext';

/**
 * CROP STAGE INDICATOR COMPONENT
 * 
 * Visual indicator showing current crop growth stage
 * Helps farmer understand why system is making certain recommendations
 * 
 * STAGES:
 * - initial: Seedling (green sprout)
 * - vegetative: Growing (leaf)
 * - flowering: Critical (flower) - HIGHLIGHTED
 * - maturity: Harvest ready (wheat)
 * 
 * DESIGN: Progress bar with icons, current stage highlighted
 */

interface CropStageIndicatorProps {
    currentStage: CropStage;
    stressTolerance: number;
    daysRemaining: number;
    cropType: string;
}

const CropStageIndicator: React.FC<CropStageIndicatorProps> = ({
    currentStage,
    stressTolerance,
    daysRemaining,
    cropType,
}) => {
    /**
     * STAGE CONFIGURATION
     * Maps each stage to its display properties
     */
    const stages: { id: CropStage; label: string; icon: typeof Sprout; color: string }[] = [
        { id: 'initial', label: 'Seedling', icon: Sprout, color: 'text-lime-400' },
        { id: 'vegetative', label: 'Growth', icon: Leaf, color: 'text-green-500' },
        { id: 'flowering', label: 'Flowering', icon: Flower, color: 'text-pink-500' },
        { id: 'maturity', label: 'Maturity', icon: Wheat, color: 'text-amber-500' },
    ];

    const currentIndex = stages.findIndex(s => s.id === currentStage);
    const progress = ((currentIndex + 1) / stages.length) * 100;

    /**
     * Get stress tolerance color
     * Lower tolerance = more critical = red
     * Higher tolerance = can skip = green
     */
    const getToleranceColor = (tolerance: number) => {
        if (tolerance <= 0.2) return 'text-red-500 bg-red-500/10';
        if (tolerance <= 0.5) return 'text-amber-500 bg-amber-500/10';
        return 'text-green-500 bg-green-500/10';
    };

    const getToleranceLabel = (tolerance: number) => {
        if (tolerance <= 0.2) return 'Critical - Must irrigate';
        if (tolerance <= 0.5) return 'Moderate - Monitor closely';
        return 'High - Can skip if needed';
    };

    return (
        <div className="glass-card p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-display font-bold text-foreground">
                        Crop Growth Stage
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">
                        {cropType} • {daysRemaining} days to harvest
                    </p>
                </div>

                {/* Stress tolerance badge */}
                <div className={`
          px-3 py-1.5 rounded-full text-xs font-medium
          ${getToleranceColor(stressTolerance)}
        `}>
                    {Math.round(stressTolerance * 100)}% tolerance
                </div>
            </div>

            {/* Stage Progress Bar */}
            <div className="relative mt-6">
                {/* Background track */}
                <div className="h-1 bg-muted/50 rounded-full" />

                {/* Progress fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute top-0 h-1 bg-gradient-to-r from-lime-400 via-green-500 to-amber-500 rounded-full"
                />

                {/* Stage markers */}
                <div className="absolute -top-3 w-full flex justify-between">
                    {stages.map((stage, index) => {
                        const Icon = stage.icon;
                        const isActive = stage.id === currentStage;
                        const isPast = index < currentIndex;

                        return (
                            <motion.div
                                key={stage.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1, type: 'spring' }}
                                className="flex flex-col items-center"
                            >
                                {/* Icon */}
                                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${isActive
                                        ? `${stage.color} bg-current/10 ring-2 ring-current`
                                        : isPast
                                            ? 'bg-muted text-muted-foreground'
                                            : 'bg-muted/30 text-muted-foreground/50'
                                    }
                `}>
                                    <Icon className={`w-4 h-4 ${isActive ? stage.color : ''}`} />
                                </div>

                                {/* Label */}
                                <span className={`
                  text-xs mt-2 font-medium
                  ${isActive ? 'text-foreground' : 'text-muted-foreground/50'}
                `}>
                                    {stage.label}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Tolerance explanation */}
            <div className="mt-8 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Water stress tolerance: </span>
                    {getToleranceLabel(stressTolerance)}
                </p>

                {/* Critical stage warning */}
                {stressTolerance <= 0.2 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-400 mt-2 flex items-center gap-1"
                    >
                        <Flower className="w-3 h-3" />
                        Flowering stage - water stress will significantly impact yield
                    </motion.p>
                )}
            </div>
        </div>
    );
};

export default CropStageIndicator;
