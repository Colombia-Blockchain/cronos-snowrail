'use client';

import { useEffect, useState } from 'react';

export function DashboardPreview() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4); // 4 steps to allow a pause at the end
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-surface-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-mesh-gradient-dark pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-white tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto font-light">
            Three simple steps to autonomous treasury management
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            number="01"
            title="Create Intent"
            description="Define payment conditions like price thresholds, time triggers, or manual approval."
            icon={<CreateIcon />}
            isActive={activeStep === 0 || activeStep === 3}
          />
          <StepCard
            number="02"
            title="Fund Intent"
            description="Deposit the payment amount. Your funds stay secure until conditions are met."
            icon={<FundIcon />}
            isActive={activeStep === 1}
          />
          <StepCard
            number="03"
            title="Auto Execute"
            description="AI agents monitor conditions and execute payments when criteria are satisfied."
            icon={<ExecuteIcon />}
            isActive={activeStep === 2}
          />
        </div>

        {/* Visual Flow */}
        <div className="mt-24 relative max-w-4xl mx-auto">
          {/* Base Track */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-obsidian-800 -translate-y-1/2 rounded-full hidden md:block" />
          
          {/* Progress Track */}
          <div 
            className="absolute top-1/2 left-4 h-0.5 bg-electric-500 -translate-y-1/2 rounded-full hidden md:block transition-all duration-[2000ms] ease-linear shadow-[0_0_10px_#0ea5e9]"
            style={{ 
              width: activeStep === 0 ? '0%' : activeStep === 1 ? '50%' : activeStep >= 2 ? '100%' : '0%',
              opacity: activeStep === 3 ? 0 : 1
            }}
          />

          <div className="flex justify-between items-center relative z-10">
            <FlowNode 
              label="Deposit" 
              active={activeStep >= 0} 
              current={activeStep === 0}
            />
            <div className="hidden md:block flex-1" />
            <FlowNode 
              label="Conditions Met" 
              active={activeStep >= 1} 
              current={activeStep === 1}
            />
            <div className="hidden md:block flex-1" />
            <FlowNode 
              label="Payment Sent" 
              active={activeStep >= 2} 
              current={activeStep === 2}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

function StepCard({ number, title, description, icon, isActive }: StepCardProps) {
  return (
    <div 
      className={`
        relative p-8 rounded-3xl border transition-all duration-500
        ${isActive 
          ? 'bg-obsidian-800/80 border-electric-500/30 shadow-glow-md -translate-y-2' 
          : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
        }
      `}
    >
      {/* Number badge */}
      <div 
        className={`
          absolute -top-4 -left-4 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg transition-colors duration-500
          ${isActive ? 'bg-electric-500 text-white shadow-electric-500/40' : 'bg-obsidian-800 border border-white/10 text-slate-500'}
        `}
      >
        {number}
      </div>

      <div 
        className={`
          w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500
          ${isActive 
            ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30' 
            : 'bg-white/[0.04] border border-white/[0.08] text-slate-500'
          }
        `}
      >
        {icon}
      </div>

      <h3 className={`text-xl font-semibold mb-3 transition-colors duration-500 ${isActive ? 'text-white' : 'text-slate-300'}`}>
        {title}
      </h3>
      <p className="text-base text-slate-400 leading-relaxed font-light">{description}</p>
    </div>
  );
}

function FlowNode({ label, active, current }: { label: string; active?: boolean; current?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div 
          className={`
            w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 relative bg-surface-950
            ${active 
              ? 'border-electric-500 bg-electric-900/20 shadow-glow-sm scale-110' 
              : 'border-white/10 bg-obsidian-900'
            }
          `} 
        >
          <div 
            className={`
              w-3 h-3 rounded-full transition-all duration-500
              ${active ? 'bg-electric-400 scale-100' : 'bg-white/10 scale-75'}
              ${current ? 'animate-ping' : ''}
            `} 
          />
        </div>
        
        {/* Ripple effect for current step */}
        {current && (
          <div className="absolute inset-0 rounded-full border border-electric-400/50 animate-ping opacity-75" />
        )}
      </div>
      
      <span 
        className={`
          text-sm font-medium tracking-wide transition-colors duration-500
          ${active ? 'text-electric-300' : 'text-slate-600'}
          ${current ? 'text-electric-200' : ''}
        `}
      >
        {label}
      </span>
    </div>
  );
}

function CreateIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function FundIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function ExecuteIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
