'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConnectWalletButton } from '@/components/connect-wallet-button';
import { cn } from '@/lib/utils';

interface TopbarProps {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
}

const pageTitles: Record<string, { title: string; description: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Overview of your treasury and activity',
  },
  '/agent': {
    title: 'Agent Console',
    description: 'Interact with AI-powered treasury agent',
  },
  '/intents': {
    title: 'Payment Intents',
    description: 'Manage and monitor payment intents',
  },
  '/settlement': {
    title: 'Settlement',
    description: 'Track and manage settlements',
  },
};

export function Topbar({ sidebarCollapsed, onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const pageInfo = pageTitles[pathname] || { title: 'SnowRail', description: 'Agentic Treasury' };

  return (
    <motion.header
      initial={false}
      animate={{ marginLeft: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6"
      style={{ left: 0 }}
    >
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page title */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">{pageInfo.title}</h1>
            <Badge variant="info" className="hidden sm:inline-flex">
              x402
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {pageInfo.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-64 pl-9 bg-secondary/50 border-border focus:bg-background"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-500 pulse-dot" />
        </Button>

        {/* Network indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-muted-foreground">Cronos Testnet</span>
        </div>

        {/* Wallet */}
        <ConnectWalletButton />
      </div>
    </motion.header>
  );
}
