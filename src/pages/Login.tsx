import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Cpu, Leaf, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FarmSetupWizard from '@/components/farm/FarmSetupWizard';
import { useFarm } from '@/contexts/FarmContext';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { isSetupComplete, completeFarmSetup } from useFarm();
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();

  const [showWizard, setShowWizard] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      if (!isSetupComplete) {
        setShowWizard(true);
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, authLoading, isSetupComplete, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let result;
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please enter your name');
          setIsSubmitting(false);
          return;
        }
        result = await register(email, password, name);
      } else {
        result = await login(email, password);
      }

      if (result.success) {
        if (!isSetupComplete) {
          setShowWizard(true);
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupComplete = (params: {
    cropType: string;
    fieldSize: number;
    farmerName: string;
    soilType: 'sandy' | 'clay' | 'loam' | 'black';
    irrigationSource: 'tank' | 'borewell';
    tankCapacity?: number;
    flowRate?: number;
  }) => {
    completeFarmSetup(params);
    setShowWizard(false);
    navigate('/dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-sidebar via-sidebar to-primary/80">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          {/* Floating Crop Icon */}
          <motion.div
            className="mb-12"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="relative">
              <div className="w-32 h-32 bg-primary/30 rounded-3xl backdrop-blur-xl border border-primary/30 flex items-center justify-center shadow-glow-green">
                <Leaf className="w-16 h-16 text-primary-foreground" />
              </div>
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl -z-10" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Cpu className="w-8 h-8 text-primary-foreground" />
              <h1 className="text-4xl font-display font-bold text-primary-foreground">FarmFlow</h1>
            </div>
            <p className="text-xl text-primary-foreground/80 font-medium">
              Precision Water Budgeting
            </p>
            <p className="mt-4 text-primary-foreground/60 max-w-md">
              Smart irrigation powered by one sensor and intelligent water budget calculations.
              Save water, maximize yields.
            </p>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            {['AI-Powered', 'Water Budget', 'Single Sensor', 'Real-time'].map((feature, i) => (
              <span
                key={feature}
                className="px-4 py-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full text-sm text-primary-foreground/80"
              >
                {feature}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Cpu className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-display font-bold text-foreground">FarmFlow</h1>
            </div>
            <p className="text-muted-foreground">Precision Water Budgeting</p>
          </div>

          <div className="glass-card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground">
                {isSignUp ? 'Create Account' : 'Welcome back'}
              </h2>
              <p className="text-muted-foreground mt-1">
                {isSignUp ? 'Sign up for your farm dashboard' : 'Sign in to your farm dashboard'}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Farmer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input h-12"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="farmer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input h-12"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input h-12"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium btn-active"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? 'Already have an account?' : 'New to FarmFlow?'}{' '}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                  className="text-primary font-medium hover:underline"
                  disabled={isSubmitting}
                >
                  {isSignUp ? 'Sign In' : 'Create an account'}
                </button>
              </p>
            </div>
          </div>

          {/* Backend Connection Note */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Make sure the backend is running on localhost:8000
          </p>
        </motion.div>
      </div>

      {/* Farm Setup Wizard Modal */}
      {showWizard && (
        <FarmSetupWizard onComplete={handleSetupComplete} />
      )}
    </div>
  );
};

export default Login;
