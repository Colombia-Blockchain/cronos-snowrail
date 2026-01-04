'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Shield,
  Zap,
  TrendingUp,
  Wallet,
  FileText,
  ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConnectWalletButton } from '@/components/connect-wallet-button';

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Agent',
    description: 'Autonomous treasury management with intelligent decision-making capabilities.',
  },
  {
    icon: Shield,
    title: 'x402 Protocol',
    description: 'Seamless payment integration with automatic retry on payment required responses.',
  },
  {
    icon: Zap,
    title: 'Real-time Execution',
    description: 'Instant payment processing on Cronos blockchain with low fees.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Conditions',
    description: 'Set price triggers, time-based rules, and custom conditions for payments.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl">SnowRail</span>
            <Badge variant="info" className="ml-2">x402</Badge>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <ConnectWalletButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div variants={itemVariants}>
              <Badge variant="outline" className="mb-6 py-2 px-4">
                Built on Cronos Testnet
              </Badge>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="gradient-text">Agentic Treasury</span>
              <br />
              <span className="text-foreground">for the Future</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Autonomous payment management powered by AI. Create smart payment intents,
              set conditions, and let the agent handle execution with x402 protocol integration.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="glow">
                <Link href="/dashboard">
                  Launch App
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/agent">
                  <Bot className="h-5 w-5 mr-2" />
                  Try Agent
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} variants={itemVariants}>
                  <Card className="h-full hover:border-cyan-500/50 transition-colors group">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6 text-cyan-400" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Powerful <span className="gradient-text">Dashboard</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to manage your autonomous treasury in one place.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-secondary/50 to-background border-cyan-500/20">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Treasury</p>
                      <p className="text-xl font-bold">12,450 TCRO</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Intents</p>
                      <p className="text-xl font-bold">24</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <ArrowLeftRight className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Settlements</p>
                      <p className="text-xl font-bold">156,230 TCRO</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20" />
              <CardContent className="relative p-8 sm:p-12 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Connect your wallet and start creating autonomous payment intents today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="glow">
                    <Link href="/dashboard">
                      Enter Dashboard
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold">SnowRail</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built on Cronos with x402 Protocol
          </p>
        </div>
      </footer>
    </div>
  );
}
