import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Droplets,
  Leaf,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Cpu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useFarm } from '@/contexts/FarmContext';

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Command Center' },
  { path: '/water-budget', icon: Droplets, label: 'Water Budget' },
  { path: '/crop-doctor', icon: Leaf, label: 'Crop Doctor' },
  { path: '/farm-logs', icon: FileText, label: 'Farm Logs' },
  { path: '/settings', icon: Settings, label: 'Device Settings' },
];

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { farmData } = useFarm();

  // Minimized state for desktop
  const [isMinimized, setIsMinimized] = useState(false);

  const sidebarWidth = isMinimized ? 80 : 260;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-xl text-sidebar-foreground shadow-lg btn-active"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -280,
          width: sidebarWidth,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed lg:sticky top-0 left-0 h-screen bg-sidebar z-50 flex flex-col"
        style={{ width: sidebarWidth }}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center flex-shrink-0"
                whileHover={{ scale: 1.05 }}
              >
                <Cpu className="w-5 h-5 text-sidebar-primary-foreground" />
              </motion.div>
              <AnimatePresence mode="wait">
                {!isMinimized && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h1 className="font-display font-bold text-sidebar-foreground">FarmFlow</h1>
                    <p className="text-xs text-sidebar-foreground/60">Precision Water Budgeting</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Collapse/Expand Button */}
            <motion.button
              onClick={() => setIsMinimized(!isMinimized)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="hidden lg:flex w-8 h-8 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all duration-200"
              title={isMinimized ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isMinimized ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Navigation - Stable hover effects */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && onToggle()}
                  title={isMinimized ? item.label : undefined}
                  className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground'
                    } ${isMinimized ? 'justify-center' : ''}`}
                >
                  {/* Active indicator bar on left */}
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-sidebar-primary-foreground rounded-r-full transition-all duration-300 ${isActive ? 'h-6' : 'group-hover:h-4'}`} />

                  {/* Icon with simple scale on hover */}
                  <div className={`transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`}>
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                  </div>

                  <AnimatePresence mode="wait">
                    {!isMinimized && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active dot indicator */}
                  {isActive && !isMinimized && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-sidebar-primary-foreground" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>



        {/* User Profile */}
        <div className="p-3 border-t border-sidebar-border">
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50 ${isMinimized ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center text-sidebar-primary-foreground font-bold flex-shrink-0">
              {farmData.farmerName.charAt(0).toUpperCase()}
            </div>
            <AnimatePresence mode="wait">
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium text-sidebar-foreground truncate">
                    {farmData.farmerName}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 capitalize">
                    {farmData.cropType} • {farmData.fieldSize} acres
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link
            to="/"
            title={isMinimized ? 'Logout' : undefined}
            className={`flex items-center gap-3 px-3 py-3 mt-2 rounded-xl text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all ${isMinimized ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!isMinimized && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium whitespace-nowrap overflow-hidden"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </motion.aside>
    </>
  );
};

export default DashboardSidebar;
