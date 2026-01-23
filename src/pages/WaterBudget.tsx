import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WaterTankVisualization from '@/components/farm/WaterTankVisualization';
import BorewellMonitor from '@/components/farm/BorewellMonitor';
import { useFarm } from '@/contexts/FarmContext';
import { TrendingUp, Droplets, Target } from 'lucide-react';

const WaterBudget = () => {
  const { farmData, getWaterBudgetStatus, getRemainingDays, getTotalPumped } = useFarm();

  const budgetStatus = getWaterBudgetStatus();
  const isBorewell = farmData.irrigationSource === 'borewell';

  // Calculate values based on irrigation source
  const remaining = isBorewell
    ? 0 // Borewell doesn't have remaining
    : farmData.tankCapacity - farmData.usedWater;

  const totalUsed = isBorewell ? getTotalPumped() : farmData.usedWater;
  const percentageUsed = isBorewell
    ? (farmData.pumpRunTime / 8) * 100 // Based on 8hr max daily runtime
    : (farmData.usedWater / farmData.tankCapacity) * 100;

  // Calculate savings (simulated - compared to traditional irrigation)
  const traditionalUsage = totalUsed * 1.4; // 40% more water traditionally
  const waterSaved = traditionalUsage - totalUsed;
  const efficiencyScore = Math.min(100, Math.round((1 - (totalUsed / traditionalUsage)) * 100 + 50));

  const getBudgetMessage = () => {
    if (isBorewell) {
      if (budgetStatus === 'high') return '✓ Efficient Pumping';
      if (budgetStatus === 'medium') return '⚡ Moderate Usage';
      return '⚠️ High Runtime - Conserve';
    }
    if (budgetStatus === 'high') return '✓ Healthy Budget';
    if (budgetStatus === 'medium') return '⚡ Moderate - Plan Ahead';
    return '⚠️ Low - Conserve Water';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-display font-bold text-foreground">Water Budget</h1>
          <p className="text-muted-foreground mt-1">
            {isBorewell
              ? 'Track and optimize your groundwater usage'
              : 'Track and optimize your water resource usage'}
          </p>
        </motion.div>

        {/* Budget Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`glass-card p-6 hover-lift border-l-4 ${budgetStatus === 'high' ? 'border-l-success' :
            budgetStatus === 'medium' ? 'border-l-warning' : 'border-l-destructive'
            }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Budget Status</p>
              <h2 className={`text-2xl font-display font-bold capitalize ${budgetStatus === 'high' ? 'text-success' :
                budgetStatus === 'medium' ? 'text-warning' : 'text-destructive'
                }`}>
                {getBudgetMessage()}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {isBorewell ? 'Efficiency Score' : 'Days Remaining'}
              </p>
              <p className="text-3xl font-display font-bold text-foreground">
                {isBorewell ? `${efficiencyScore}%` : getRemainingDays()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Water Source Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isBorewell ? (
              <BorewellMonitor
                flowRate={farmData.flowRate}
                pumpRunTime={farmData.pumpRunTime}
                dailyNeed={farmData.dailyWaterNeed}
                fieldSize={farmData.fieldSize}
              />
            ) : (
              <WaterTankVisualization
                totalCapacity={farmData.tankCapacity}
                usedWater={farmData.usedWater}
                dailyNeed={farmData.dailyWaterNeed}
                fieldSize={farmData.fieldSize}
              />
            )}
          </motion.div>

          {/* Analysis Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Water Saved */}
            <motion.div
              className="glass-card p-6 hover-lift"
              whileHover={{ scale: 1.02, y: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(34, 197, 94, 0)',
                      '0 0 20px 5px rgba(34, 197, 94, 0.3)',
                      '0 0 0 0 rgba(34, 197, 94, 0)',
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Droplets className="w-6 h-6 text-success" />
                  </motion.div>
                </motion.div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBorewell ? 'Groundwater Saved' : 'Water Saved'}
                  </p>
                  <motion.p
                    className="text-2xl font-display font-bold text-success"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                  >
                    {(waterSaved / 1000).toFixed(1)} m³
                  </motion.p>
                </div>
              </div>
              <div className="bg-success/10 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                  {isBorewell ? (
                    <>
                      Compared to traditional pumping schedules, you've saved approximately{' '}
                      <motion.span
                        className="font-bold text-success"
                        animate={{ textShadow: ['0 0 0 transparent', '0 0 8px rgba(34, 197, 94, 0.5)', '0 0 0 transparent'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {waterSaved.toLocaleString()} liters
                      </motion.span>{' '}
                      of groundwater by optimizing pump runtime.
                    </>
                  ) : (
                    <>
                      Compared to traditional irrigation schedules, you've saved approximately{' '}
                      <motion.span
                        className="font-bold text-success"
                        animate={{ textShadow: ['0 0 0 transparent', '0 0 8px rgba(34, 197, 94, 0.5)', '0 0 0 transparent'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {waterSaved.toLocaleString()} liters
                      </motion.span>{' '}
                      by skipping unnecessary irrigation cycles.
                    </>
                  )}
                </p>
              </div>
            </motion.div>

            {/* Efficiency Score */}
            <motion.div
              className="glass-card p-6 hover-lift"
              whileHover={{ scale: 1.02, y: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Target className="w-6 h-6 text-primary" />
                </motion.div>
                <div>
                  <p className="text-sm text-muted-foreground">Efficiency Score</p>
                  <motion.p
                    className="text-2xl font-display font-bold text-primary"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.6 }}
                  >
                    {efficiencyScore}/100
                  </motion.p>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${efficiencyScore}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full"
                />
                {/* Shimmer effect on progress bar */}
                <motion.div
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  initial={{ left: '-33%' }}
                  animate={{ left: '133%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {isBorewell
                  ? 'Score based on pump runtime efficiency and optimal scheduling.'
                  : 'Score based on water budget adherence and optimal irrigation timing.'}
              </p>
            </motion.div>

            {/* Usage Breakdown */}
            <div className="glass-card p-6 hover-lift">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usage Breakdown</p>
                  <p className="text-lg font-display font-bold text-foreground">
                    This Season
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {isBorewell ? 'Total Pumped' : 'Total Used'}
                  </span>
                  <span className="font-medium">{(totalUsed / 1000).toFixed(1)} m³</span>
                </div>
                {!isBorewell && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium text-secondary">{(remaining / 1000).toFixed(1)} m³</span>
                  </div>
                )}
                {isBorewell && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pump Runtime</span>
                    <span className="font-medium text-secondary">{farmData.pumpRunTime.toFixed(1)} hrs</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Usage Rate</span>
                  <span className="font-medium">{percentageUsed.toFixed(1)}%</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {isBorewell ? 'Soil Type' : 'Est. Refill Date'}
                  </span>
                  <span className="font-medium text-foreground capitalize">
                    {isBorewell
                      ? farmData.soilType
                      : new Date(Date.now() + getRemainingDays() * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WaterBudget;