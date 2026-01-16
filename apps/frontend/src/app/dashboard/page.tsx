'use client';

import { CreateIntentForm } from '@/components/create-intent-form';
import { IntentList } from '@/components/intent-list';

export default function Dashboard() {
  return (
    <div className="min-h-screen relative">
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <header className="mb-12 animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-electric-900/20 border border-electric-500/30 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-pulse"></span>
                <span className="text-xs font-semibold text-electric-300 uppercase tracking-wide">Treasury Protocol</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-white tracking-tight mb-3">
                Treasury Management
              </h1>
              <p className="text-slate-400 text-lg max-w-xl font-light leading-relaxed">
                Create and manage autonomous payment intents with <span className="text-electric-300 font-medium">AI-powered</span> condition evaluation.
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 bg-obsidian-800/40 p-2 rounded-2xl border border-white/[0.05] backdrop-blur-md">
              <QuickStat label="Active Intents" value="—" />
              <div className="w-px h-10 bg-white/[0.05]" />
              <QuickStat label="Total Volume" value="—" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar - Create Form */}
          <aside className="lg:col-span-4 animate-fade-in-up order-2 lg:order-1" style={{ animationDelay: '100ms' }}>
            <div className="lg:sticky lg:top-24">
              <CreateIntentForm />
            </div>
          </aside>

          {/* Main - Intent List */}
          <main className="lg:col-span-8 animate-fade-in-up order-1 lg:order-2" style={{ animationDelay: '200ms' }}>
            <IntentList />
          </main>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-6 py-2 text-center min-w-[140px]">
      <p className="text-2xl font-display font-bold text-white tabular-nums mb-0.5">{value}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  );
}
