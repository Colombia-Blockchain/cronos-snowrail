'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless menu is open */}
      <div className={isMobile && !mobileMenuOpen ? 'hidden lg:block' : ''}>
        <Sidebar
          collapsed={isMobile ? false : sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Topbar */}
      <Topbar
        sidebarCollapsed={isMobile ? true : sidebarCollapsed}
        onMenuClick={toggleSidebar}
      />

      {/* Main content */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : sidebarCollapsed ? 72 : 240,
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="min-h-screen pt-16"
      >
        <div className="p-6">{children}</div>
      </motion.main>
    </div>
  );
}
