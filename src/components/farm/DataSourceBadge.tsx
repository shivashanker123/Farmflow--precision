import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Cloud } from 'lucide-react';

interface DataSourceBadgeProps {
  isLive: boolean;
  lastUpdated: Date | null;
  isLoading?: boolean;
}

const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  isLive,
  lastUpdated,
  isLoading = false,
}) => {
  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold
        backdrop-blur-md transition-all duration-300
        ${isLive
          ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
          : 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
        }
      `}
    >
      <AnimatePresence mode="wait">
        {isLive ? (
          <motion.div
            key="live"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="flex items-center gap-2"
          >
            {/* Animated signal waves */}
            <div className="relative flex items-center justify-center w-5 h-5">
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-green-400"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-4 h-4 rounded-full border-2 border-green-400"
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-4 h-4 rounded-full border border-green-400"
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
            </div>
            <Wifi className="w-4 h-4" />
            <span>Live Sensor Data</span>
          </motion.div>
        ) : (
          <motion.div
            key="api"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Cloud className="w-4 h-4" />
            </motion.div>
            <span>Weather API</span>
          </motion.div>
        )}
      </AnimatePresence>

      {lastUpdated && (
        <motion.span
          className="text-xs opacity-60 ml-1 tabular-nums"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
        >
          • {formatTime(lastUpdated)}
        </motion.span>
      )}

      {isLoading && (
        <motion.div
          className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
};

export default DataSourceBadge;
