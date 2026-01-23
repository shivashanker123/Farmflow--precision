import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wheat, Leaf, Droplets, ArrowRight, ArrowLeft, Check, User, Mountain, CircleDot, Calculator, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SoilType, IrrigationSource } from '@/contexts/FarmContext';

interface FarmSetupWizardProps {
  onComplete: (params: {
    cropType: string;
    fieldSize: number;
    farmerName: string;
    soilType: SoilType;
    irrigationSource: IrrigationSource;
    tankCapacity?: number;
    flowRate?: number;
  }) => void;
}

const CROP_OPTIONS = [
  { value: 'wheat', label: 'Wheat', icon: Wheat, waterNeed: '5 mm/day' },
  { value: 'corn', label: 'Corn', icon: Leaf, waterNeed: '7 mm/day' },
  { value: 'tomato', label: 'Tomato', icon: Leaf, waterNeed: '6 mm/day' },
];

const SOIL_OPTIONS = [
  { value: 'sandy', label: 'Sandy', description: 'Fast drainage, low water retention' },
  { value: 'clay', label: 'Clay', description: 'Slow drainage, high water retention' },
  { value: 'loam', label: 'Loam', description: 'Balanced drainage and retention' },
  { value: 'black', label: 'Black (Cotton)', description: 'High moisture retention, cracks when dry' },
];

const IRRIGATION_OPTIONS = [
  { value: 'tank', label: 'Water Tank', icon: Droplets, description: 'Fixed capacity storage' },
  { value: 'borewell', label: 'Borewell', icon: CircleDot, description: 'Groundwater with pump' },
];

const FarmSetupWizard: React.FC<FarmSetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [farmerName, setFarmerName] = useState('');
  const [cropType, setCropType] = useState('');
  const [soilType, setSoilType] = useState<SoilType | ''>('');
  const [fieldSize, setFieldSize] = useState('');
  const [irrigationSource, setIrrigationSource] = useState<IrrigationSource | ''>('');
  const [tankCapacity, setTankCapacity] = useState('');
  const [flowRate, setFlowRate] = useState('');
  
  // Bucket test calculator state
  const [calcMode, setCalcMode] = useState<'manual' | 'calculate'>('manual');
  const [containerVolume, setContainerVolume] = useState('');
  const [fillTime, setFillTime] = useState('');

  const totalSteps = 6;
  
  // Calculate flow rate from bucket test
  const calculatedFlowRate = useMemo(() => {
    const volume = parseFloat(containerVolume);
    const time = parseFloat(fillTime);
    if (volume > 0 && time > 0) {
      return (volume / time) * 3600;
    }
    return null;
  }, [containerVolume, fillTime]);

  const handleUseCalculatedRate = () => {
    if (calculatedFlowRate) {
      setFlowRate(Math.round(calculatedFlowRate).toString());
      setCalcMode('manual');
    }
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete({
      cropType,
      fieldSize: parseFloat(fieldSize) || 10,
      farmerName: farmerName || 'Farmer',
      soilType: soilType as SoilType,
      irrigationSource: irrigationSource as IrrigationSource,
      tankCapacity: irrigationSource === 'tank' ? parseFloat(tankCapacity) || 50000 : undefined,
      flowRate: irrigationSource === 'borewell' ? parseFloat(flowRate) || 5000 : undefined,
    });
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return farmerName.trim().length > 0;
      case 2: return cropType !== '';
      case 3: return soilType !== '';
      case 4: return fieldSize !== '' && parseFloat(fieldSize) > 0;
      case 5: return irrigationSource !== '';
      case 6:
        if (irrigationSource === 'tank') return tankCapacity !== '' && parseFloat(tankCapacity) > 0;
        if (irrigationSource === 'borewell') return flowRate !== '' && parseFloat(flowRate) > 0;
        return false;
      default: return false;
    }
  };

  const selectedCrop = CROP_OPTIONS.find(c => c.value === cropType);
  const selectedSoil = SOIL_OPTIONS.find(s => s.value === soilType);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 w-full max-w-lg"
      >
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-primary' : s < step ? 'w-2 bg-primary/60' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Welcome to FarmFlow</h2>
                  <p className="text-muted-foreground mt-2">Let's set up your farm profile</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farmerName">Your Name</Label>
                  <Input
                    id="farmerName"
                    placeholder="Enter your name"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    className="glass-input h-12"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Select Your Crop</h2>
                  <p className="text-muted-foreground mt-2">We'll calculate water needs based on crop type</p>
                </div>
                <div className="space-y-2">
                  <Label>Crop Type</Label>
                  <Select value={cropType} onValueChange={setCropType}>
                    <SelectTrigger className="glass-input h-12">
                      <SelectValue placeholder="Select a crop" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-border">
                      {CROP_OPTIONS.map((crop) => (
                        <SelectItem key={crop.value} value={crop.value}>
                          <div className="flex items-center gap-3">
                            <crop.icon className="w-4 h-4 text-primary" />
                            <span>{crop.label}</span>
                            <span className="text-muted-foreground text-sm">({crop.waterNeed})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCrop && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-primary mt-2"
                    >
                      Water requirement: {selectedCrop.waterNeed}
                    </motion.p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mountain className="w-8 h-8 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Soil Type</h2>
                  <p className="text-muted-foreground mt-2">This affects irrigation scheduling</p>
                </div>
                <div className="space-y-2">
                  <Label>Select Soil Type</Label>
                  <Select value={soilType} onValueChange={(v) => setSoilType(v as SoilType)}>
                    <SelectTrigger className="glass-input h-12">
                      <SelectValue placeholder="Select soil type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-border">
                      {SOIL_OPTIONS.map((soil) => (
                        <SelectItem key={soil.value} value={soil.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{soil.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSoil && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-muted-foreground mt-2"
                    >
                      {selectedSoil.description}
                    </motion.p>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 border-2 border-primary rounded" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Field Size</h2>
                  <p className="text-muted-foreground mt-2">How large is your irrigation area?</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fieldSize">Field Size (Acres)</Label>
                  <Input
                    id="fieldSize"
                    type="number"
                    placeholder="e.g., 10"
                    value={fieldSize}
                    onChange={(e) => setFieldSize(e.target.value)}
                    className="glass-input h-12"
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Droplets className="w-8 h-8 text-secondary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Water Source</h2>
                  <p className="text-muted-foreground mt-2">How do you irrigate your fields?</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {IRRIGATION_OPTIONS.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIrrigationSource(option.value as IrrigationSource)}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        irrigationSource === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <option.icon className={`w-8 h-8 mx-auto mb-2 ${
                        irrigationSource === option.value ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {step === 6 && irrigationSource === 'tank' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Droplets className="w-8 h-8 text-secondary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Tank Capacity</h2>
                  <p className="text-muted-foreground mt-2">What's your total water storage?</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tankCapacity">Tank Capacity (Liters)</Label>
                  <Input
                    id="tankCapacity"
                    type="number"
                    placeholder="e.g., 50000"
                    value={tankCapacity}
                    onChange={(e) => setTankCapacity(e.target.value)}
                    className="glass-input h-12"
                  />
                  {tankCapacity && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-muted-foreground mt-2"
                    >
                      {(parseFloat(tankCapacity) / 1000).toFixed(1)} m³ capacity
                    </motion.p>
                  )}
                </div>
              </div>
            )}

            {step === 6 && irrigationSource === 'borewell' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CircleDot className="w-8 h-8 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Pump Flow Rate</h2>
                  <p className="text-muted-foreground mt-2">How fast does your pump deliver water?</p>
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
                  <button
                    onClick={() => setCalcMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      calcMode === 'manual'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <PenLine className="w-4 h-4" />
                    Manual Entry
                  </button>
                  <button
                    onClick={() => setCalcMode('calculate')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      calcMode === 'calculate'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    Calculate Rate
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {calcMode === 'manual' ? (
                    <motion.div
                      key="manual"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="flowRate">Flow Rate (Liters/Hour)</Label>
                      <Input
                        id="flowRate"
                        type="number"
                        placeholder="e.g., 5000"
                        value={flowRate}
                        onChange={(e) => setFlowRate(e.target.value)}
                        className="glass-input h-12"
                      />
                      {flowRate && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm text-muted-foreground mt-2"
                        >
                          {(parseFloat(flowRate) / 1000).toFixed(1)} m³/hour
                        </motion.p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="calculate"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {/* Bucket Test Instructions */}
                      <div className="glass-card p-4 bg-primary/5 border-primary/20">
                        <p className="text-sm text-foreground font-medium mb-1">🪣 Bucket Test</p>
                        <p className="text-xs text-muted-foreground">
                          Fill a container with your pump and measure the time. We'll calculate the flow rate for you.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="containerVolume">Container Volume</Label>
                          <div className="relative">
                            <Input
                              id="containerVolume"
                              type="number"
                              placeholder="e.g., 20"
                              value={containerVolume}
                              onChange={(e) => setContainerVolume(e.target.value)}
                              className="glass-input h-12 pr-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">L</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fillTime">Time to Fill</Label>
                          <div className="relative">
                            <Input
                              id="fillTime"
                              type="number"
                              placeholder="e.g., 10"
                              value={fillTime}
                              onChange={(e) => setFillTime(e.target.value)}
                              className="glass-input h-12 pr-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">sec</span>
                          </div>
                        </div>
                      </div>

                      {/* Calculated Result */}
                      {calculatedFlowRate && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="glass-card p-4 border-primary/30 bg-primary/10"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Calculated Flow Rate</p>
                              <p className="text-2xl font-bold text-primary">
                                {Math.round(calculatedFlowRate).toLocaleString()} <span className="text-sm font-normal">L/hr</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ({(calculatedFlowRate / 1000).toFixed(2)} m³/hour)
                              </p>
                            </div>
                            <Button
                              onClick={handleUseCalculatedRate}
                              className="bg-primary hover:bg-primary/90"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Use this Rate
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="btn-active"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="btn-active bg-primary hover:bg-primary/90"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!isStepValid()}
              className="btn-active bg-primary hover:bg-primary/90"
            >
              <Check className="w-4 h-4 mr-2" />
              Start Farming
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FarmSetupWizard;