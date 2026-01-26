import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Info,
    AlertTriangle,
    CheckCircle,
    Droplets,
    X
} from 'lucide-react';
import { Advisory } from '@/contexts/FarmContext';

/**
 * ADVISORY PANEL COMPONENT
 * 
 * Displays context-aware messages explaining system decisions
 * Builds farmer trust by showing WHY the system made a recommendation
 * 
 * DESIGN: Uses color-coded cards based on advisory type
 * - info: Blue - general information
 * - success: Green - positive updates (rainfall, savings)
 * - warning: Amber - attention needed (budget, sensor)
 * - action: Primary - action required (irrigate now)
 */

interface AdvisoryPanelProps {
    advisories: Advisory[];
    onDismiss?: (id: string) => void;
    maxVisible?: number;
}

const AdvisoryPanel: React.FC<AdvisoryPanelProps> = ({
    advisories,
    onDismiss,
    maxVisible = 3,
}) => {
    // Show only the most recent advisories
    const visibleAdvisories = advisories.slice(0, maxVisible);

    /**
     * Get icon and colors based on advisory type
     * ASSUMPTION: 4 types are sufficient for MVP
     * TODO: Add 'critical' type for emergencies
     */
    const getAdvisoryStyle = (type: Advisory['type']) => {
        switch (type) {
            case 'info':
                return {
                    icon: Info,
                    bgColor: 'bg-blue-500/10',
                    borderColor: 'border-blue-500/30',
                    iconColor: 'text-blue-500',
                    textColor: 'text-blue-400',
                };
            case 'success':
                return {
                    icon: CheckCircle,
                    bgColor: 'bg-green-500/10',
                    borderColor: 'border-green-500/30',
                    iconColor: 'text-green-500',
                    textColor: 'text-green-400',
                };
            case 'warning':
                return {
                    icon: AlertTriangle,
                    bgColor: 'bg-amber-500/10',
                    borderColor: 'border-amber-500/30',
                    iconColor: 'text-amber-500',
                    textColor: 'text-amber-400',
                };
            case 'action':
                return {
                    icon: Droplets,
                    bgColor: 'bg-primary/10',
                    borderColor: 'border-primary/30',
                    iconColor: 'text-primary',
                    textColor: 'text-primary',
                };
            default:
                return {
                    icon: Info,
                    bgColor: 'bg-muted/50',
                    borderColor: 'border-border',
                    iconColor: 'text-muted-foreground',
                    textColor: 'text-muted-foreground',
                };
        }
    };

    if (visibleAdvisories.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4" />
                System Advisories
            </h3>

            <AnimatePresence mode="popLayout">
                {visibleAdvisories.map((advisory, index) => {
                    const style = getAdvisoryStyle(advisory.type);
                    const Icon = style.icon;

                    return (
                        <motion.div
                            key={advisory.id}
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className={`
                relative p-4 rounded-xl border
                ${style.bgColor} ${style.borderColor}
                backdrop-blur-sm
              `}
                        >
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${style.bgColor}
                `}>
                                    <Icon className={`w-4 h-4 ${style.iconColor}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium text-sm ${style.textColor}`}>
                                        {advisory.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {advisory.message}
                                    </p>
                                </div>

                                {/* Dismiss button (optional) */}
                                {onDismiss && (
                                    <button
                                        onClick={() => onDismiss(advisory.id)}
                                        className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
                                        aria-label="Dismiss"
                                    >
                                        <X className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                )}
                            </div>

                            {/* Time indicator */}
                            <p className="text-xs text-muted-foreground/50 mt-2 ml-11">
                                {advisory.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Show more indicator */}
            {advisories.length > maxVisible && (
                <p className="text-xs text-muted-foreground text-center">
                    +{advisories.length - maxVisible} more advisories
                </p>
            )}
        </div>
    );
};

export default AdvisoryPanel;
