'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Grid pattern overlay - Lightened for better visibility on dark */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      {/* Content */}
      <div
        className={`
          relative z-10 max-w-6xl mx-auto px-6 text-center
          transition-all duration-1000 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-electric-900/20 border border-electric-500/30 animate-fade-in shadow-glow-sm backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-electric-400 animate-pulse-subtle shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
          <span className="text-sm font-medium text-electric-100 tracking-wide">Cronos X402 Treasury Protocol</span>
        </div>

        {/* Headline */}
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold text-white tracking-tight mb-8 leading-[1.1]">
          Autonomous Treasury
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-300 via-electric-400 to-accent-400 animate-shimmer bg-[length:200%_auto]">
            Powered by AI
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl sm:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
          Create conditional payment intents that execute automatically
          based on <span className="text-white font-medium">intelligent agent evaluation</span> and real-time market conditions.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
          <Link
            href="/dashboard"
            className="
              group relative inline-flex items-center gap-3 px-8 py-4
              bg-electric-600 text-white font-semibold rounded-2xl
              hover:bg-electric-500 transition-all duration-300
              shadow-glow-md hover:shadow-glow-lg hover:-translate-y-1
            "
          >
            <span>Open Dashboard</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
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
              group inline-flex items-center gap-3 px-8 py-4
              bg-white/[0.03] text-slate-200 font-medium rounded-2xl
              border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]
              transition-all duration-300 backdrop-blur-sm hover:-translate-y-1
            "
          >
            <div className="p-1 rounded-lg bg-white/[0.05] group-hover:bg-accent-500/20 transition-colors">
              <svg className="w-5 h-5 group-hover:text-accent-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            ZK Privacy Layer
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <StatCard value="100%" label="Autonomous Execution" />
          <StatCard value="AI" label="Agent Driven" />
          <StatCard value="ZK" label="Privacy Layer" />
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-sm hover:bg-white/[0.04] transition-colors group">
      <div className="text-4xl sm:text-5xl font-display font-bold text-white mb-2 group-hover:text-electric-300 transition-colors">{value}</div>
      <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">{label}</div>
    </div>
  );
}
