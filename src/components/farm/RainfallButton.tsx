import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Droplets, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * RAINFALL BUTTON COMPONENT
 * 
 * Allows farmer to manually record rainfall
 * This credits the water budget and adjusts irrigation recommendations
 * 
 * DESIGN: Dropdown with common amounts (5mm, 10mm, 25mm, 50mm, custom)
 * ASSUMPTION: Farmer knows approximate rainfall from local observation
 * TODO: Integrate with weather API for automatic detection
 */

interface RainfallButtonProps {
    onRecordRainfall: (mm: number) => void;
    todayRainfall: number;
}

const RainfallButton: React.FC<RainfallButtonProps> = ({
    onRecordRainfall,
    todayRainfall,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [recordedAmount, setRecordedAmount] = useState(0);

    /**
     * COMMON RAINFALL AMOUNTS
     * Based on typical rain intensities in Indian agriculture
     * Light: 5-10mm, Moderate: 10-25mm, Heavy: 25-50mm+
     */
    const rainfallOptions = [
        { label: 'Light Rain', amount: 5, description: '~5mm' },
        { label: 'Moderate Rain', amount: 15, description: '~15mm' },
        { label: 'Heavy Rain', amount: 30, description: '~30mm' },
        { label: 'Very Heavy', amount: 50, description: '~50mm' },
    ];

    const handleSelect = (amount: number) => {
        onRecordRainfall(amount);
        setRecordedAmount(amount);
        setIsOpen(false);
        setShowConfirmation(true);

        // Hide confirmation after 3 seconds
        setTimeout(() => {
            setShowConfirmation(false);
        }, 3000);
    };

    return (
        <div className="relative">
            {/* Main Button */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    variant="outline"
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-xl
            ${todayRainfall > 0
                            ? 'border-blue-500/50 bg-blue-500/10 text-blue-500'
                            : 'border-border'
                        }
          `}
                >
                    <CloudRain className="w-4 h-4" />
                    <span>It Rained</span>
                    {todayRainfall > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-xs">
                            {todayRainfall}mm today
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
            </motion.div>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full mt-2 right-0 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                        <div className="p-2">
                            <p className="text-xs text-muted-foreground px-3 py-2">
                                How much rain fell?
                            </p>

                            {rainfallOptions.map((option) => (
                                <button
                                    key={option.amount}
                                    onClick={() => handleSelect(option.amount)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <Droplets className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-foreground">
                                                {option.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Close area */}
                        <div
                            className="fixed inset-0 -z-10"
                            onClick={() => setIsOpen(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation Toast */}
            <AnimatePresence>
                {showConfirmation && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full mt-2 right-0 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2"
                    >
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500 font-medium">
                            Recorded {recordedAmount}mm rainfall
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RainfallButton;
