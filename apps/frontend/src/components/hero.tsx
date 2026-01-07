'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface-950">
      {/* Background effects */}
      <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/[0.07] rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/[0.05] rounded-full blur-[100px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

      {/* Content */}
      <div
        className={`
          relative z-10 max-w-5xl mx-auto px-6 text-center
          transition-all duration-1000 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-white/[0.04] border border-white/[0.08] animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-subtle" />
          <span className="text-sm font-medium text-slate-300">Cronos X402 Treasury Protocol</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white tracking-tight mb-6">
          Autonomous Treasury
          <br />
          <span className="text-brand-400">Powered by AI</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Create conditional payment intents that execute automatically
          based on intelligent agent evaluation and market conditions.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link
            href="/dashboard"
            className="
              group relative inline-flex items-center gap-2 px-8 py-3.5
              bg-brand-500 text-white font-medium rounded-xl
              hover:bg-brand-400 transition-all duration-300
              shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40
            "
          >
            Open Dashboard
            <svg
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>

          <Link
            href="/dashboard/mixer"
            className="
              inline-flex items-center gap-2 px-8 py-3.5
              bg-white/[0.04] text-slate-200 font-medium rounded-xl
              border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12]
              transition-all duration-300
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            ZK Privacy Layer
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <StatCard value="100%" label="Autonomous" />
          <StatCard value="AI" label="Agent Powered" />
          <StatCard value="ZK" label="Privacy Layer" />
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-950 to-transparent pointer-events-none" />
    </section>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-semibold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}
