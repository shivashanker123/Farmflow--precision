import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardSidebar from './DashboardSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <motion.main
        className="flex-1 min-h-screen overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-6 lg:p-8 lg:ml-0 ml-0">
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
