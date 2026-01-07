'use client';

import { CreateIntentForm } from '@/components/create-intent-form';
import { IntentList } from '@/components/intent-list';

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-surface-800 via-surface-900 to-surface-950 pointer-events-none" />
      <div className="fixed inset-0 bg-mesh-gradient-dark pointer-events-none" />

      <div className="relative">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <header className="mb-10 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
                  Treasury Management
                </h1>
                <p className="text-slate-400 text-base max-w-xl">
                  Create and manage autonomous payment intents with AI-powered condition evaluation
                </p>
              </div>

              {/* Quick stats placeholder */}
              <div className="hidden lg:flex items-center gap-6">
                <QuickStat label="Active Intents" value="—" />
                <QuickStat label="Total Volume" value="—" />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Sidebar - Create Form */}
            <aside className="lg:col-span-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="lg:sticky lg:top-24">
                <CreateIntentForm />
              </div>
            </aside>

            {/* Main - Intent List */}
            <main className="lg:col-span-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <IntentList />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
