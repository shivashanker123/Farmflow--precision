import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WaterTankVisualization from '@/components/farm/WaterTankVisualization';
import BorewellMonitor from '@/components/farm/BorewellMonitor';
import ImpactDashboard from '@/components/farm/ImpactDashboard';
import AdvisoryPanel from '@/components/farm/AdvisoryPanel';
import { useFarm } from '@/contexts/FarmContext';
import { TrendingUp, Droplets, Target, Calendar, Leaf, AlertTriangle, Check } from 'lucide-react';

const WaterBudget = () => {
  /**
   * WATER BUDGET PAGE
   * 
   * Displays seasonal water budget using getSeasonalBudget()
   * Shows crop cycle progress, daily quota, and on-track status
   * 
   * INTEGRATION: Uses new smart irrigation functions from FarmContext
   */
  const {
    farmData,
    getWaterBudgetStatus,
    getRemainingDays,
    getTotalPumped,
    // NEW: Smart irrigation functions
    getSeasonalBudget,
    getCropStage,
    getImpactMetrics,
    getActiveAdvisories,
  } = useFarm();

  const budgetStatus = getWaterBudgetStatus();
  const isBorewell = farmData.irrigationSource === 'borewell';

  // NEW: Get seasonal budget breakdown
  const seasonalBudget = getSeasonalBudget();
  const cropStage = getCropStage();
  const impactMetrics = getImpactMetrics();
  const advisories = getActiveAdvisories();

  // Calculate values based on irrigation source
  const remaining = isBorewell
    ? seasonalBudget.remaining // Use seasonal budget for borewell too
    : farmData.tankCapacity - farmData.usedWater;

  const totalUsed = isBorewell ? getTotalPumped() : farmData.usedWater;
  const percentageUsed = isBorewell
    ? (farmData.pumpRunTime / 8) * 100 // Based on 8hr max daily runtime
    : (farmData.usedWater / farmData.tankCapacity) * 100;

  // NEW: Use real impact metrics instead of simulated
  const waterSaved = impactMetrics.waterSavedLiters;
  const efficiencyScore = Math.min(100, 50 + impactMetrics.waterSavedPercent);

  const getBudgetMessage = () => {
    // NEW: Use seasonal on-track status
    if (!seasonalBudget.onTrack) {
      return '⚠️ Over Budget - Reduce Usage';
    }
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
                {isBorewell ? `${efficiencyScore}%` : seasonalBudget.daysRemaining}
              </p>
            </div>
          </div>
        </motion.div>

        {/* NEW: Seasonal Budget Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6 hover-lift"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">
                  Seasonal Budget
                </h3>
                <p className="text-sm text-muted-foreground">
                  Crop cycle: {farmData.cropType} ({seasonalBudget.daysRemaining} days left)
                </p>
              </div>
            </div>

            {/* On-track badge */}
            <div className={`
              px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1
              ${seasonalBudget.onTrack
                ? 'bg-green-500/10 text-green-500'
                : 'bg-amber-500/10 text-amber-500'
              }
            `}>
              {seasonalBudget.onTrack
                ? <><Check className="w-3 h-3" /> On Track</>
                : <><AlertTriangle className="w-3 h-3" /> Over Budget</>
              }
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Water Used</span>
              <span className="font-medium text-foreground">
                {(seasonalBudget.used / 1000).toFixed(1)} / {(seasonalBudget.totalAvailable / 1000).toFixed(1)} kL
              </span>
            </div>
            <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (seasonalBudget.used / seasonalBudget.totalAvailable) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${seasonalBudget.onTrack
                  ? 'bg-gradient-to-r from-primary to-primary/70'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Daily Quota</p>
              <p className="text-lg font-bold text-foreground">
                {(seasonalBudget.dailyQuota / 1000).toFixed(1)} kL
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Total Needed</p>
              <p className="text-lg font-bold text-foreground">
                {(seasonalBudget.totalNeeded / 1000).toFixed(0)} kL
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Crop Stage</p>
              <p className="text-lg font-bold text-foreground capitalize flex items-center justify-center gap-1">
                <Leaf className="w-4 h-4 text-green-500" />
                {cropStage}
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

        {/* Water Savings Impact - Moved from Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ImpactDashboard metrics={impactMetrics} />
        </motion.div>

        {/* Advisory Messages - Moved from Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <AdvisoryPanel
            advisories={advisories}
            maxVisible={5}
          />
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default WaterBudget;