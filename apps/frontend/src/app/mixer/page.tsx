'use client';

import { useState } from 'react';
import { MixerDeposit, MixerWithdraw, MixerInfo, NoteManager, useNoteStorage } from '@/components/mixer';
import type { DepositNote } from '@cronos-x402/shared-types';

type Tab = 'deposit' | 'withdraw' | 'notes';

export default function MixerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('deposit');
  const [selectedNote, setSelectedNote] = useState<DepositNote | null>(null);
  const { addNote } = useNoteStorage();

  const handleNoteGenerated = (note: DepositNote) => {
    addNote(note, `Deposit ${new Date().toLocaleString()}`);
  };

  const handleSelectNote = (note: DepositNote) => {
    setSelectedNote(note);
    setActiveTab('withdraw');
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'deposit',
      label: 'Deposit',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
        </svg>
      )
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
        </svg>
      )
    },
    {
      id: 'notes',
      label: 'My Notes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      )
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-surface-800 via-surface-900 to-surface-950 pointer-events-none" />
      <div className="fixed inset-0 bg-mesh-gradient-dark pointer-events-none" />

      <div className="relative py-8 px-6 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-10 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-white tracking-tight">
                  ZK Privacy Layer
                </h1>
                <p className="text-slate-400 mt-1">
                  Break on-chain links with zero-knowledge proofs
                </p>
              </div>
            </div>
          </header>

          {/* Tabs */}
          <div className="flex gap-1 p-1 mb-8 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {/* Left Column - Main Action */}
            <div className="lg:col-span-2">
              {activeTab === 'deposit' && (
                <MixerDeposit onNoteGenerated={handleNoteGenerated} />
              )}

              {activeTab === 'withdraw' && (
                <MixerWithdraw />
              )}

              {activeTab === 'notes' && (
                <NoteManager onSelectNote={handleSelectNote} />
              )}
            </div>

            {/* Right Column - Info */}
            <div className="space-y-6">
              <MixerInfo />

              {/* How It Works */}
              <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
                <h3 className="text-base font-semibold text-white mb-5">How It Works</h3>

                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Deposit</p>
                      <p className="text-slate-500 text-sm mt-0.5">
                        Deposit a fixed amount and receive a secret note
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Wait</p>
                      <p className="text-slate-500 text-sm mt-0.5">
                        Wait for more deposits to increase anonymity
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Withdraw</p>
                      <p className="text-slate-500 text-sm mt-0.5">
                        Use your note to withdraw to any address privately
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Tips */}
              <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
                <h3 className="text-base font-semibold text-white mb-4">Security Tips</h3>

                <ul className="space-y-3">
                  {[
                    'Store your note securely offline',
                    'Use a fresh address for withdrawals',
                    'Wait for more deposits before withdrawing',
                    'Never share your deposit note',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <svg className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-400">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
