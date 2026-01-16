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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
        </svg>
      )
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
        </svg>
      )
    },
    {
      id: 'notes',
      label: 'My Notes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      )
    },
  ];

  return (
    <div className="min-h-screen relative">
      <div className="relative py-8 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 animate-fade-in">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-electric-900/20 border border-electric-500/20 flex items-center justify-center shadow-glow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-electric-500/10 blur-xl group-hover:bg-electric-500/20 transition-colors"></div>
              <svg className="w-10 h-10 text-electric-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-accent-900/20 border border-accent-500/30 backdrop-blur-sm mx-auto md:mx-0">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse"></span>
                <span className="text-xs font-semibold text-accent-300 uppercase tracking-wide">Privacy Protocol</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-white tracking-tight mb-2">
                ZK Privacy Layer
              </h1>
              <p className="text-slate-400 text-lg font-light">
                Break on-chain links with <span className="text-accent-300 font-medium">zero-knowledge proofs</span> and mixer technology.
              </p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex justify-center md:justify-start">
          <div className="flex gap-1 p-1 mb-10 bg-black/40 backdrop-blur-md rounded-2xl border border-white/[0.08] w-fit animate-fade-in-up shadow-lg" style={{ animationDelay: '100ms' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-3 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-br from-electric-600 to-electric-700 text-white shadow-lg shadow-electric-500/20 ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {/* Left Column - Main Action */}
          <div className="lg:col-span-8">
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
          <div className="lg:col-span-4 space-y-6">
            <MixerInfo />

            {/* How It Works */}
            <div className="p-8 rounded-3xl bg-obsidian-800/40 border border-white/[0.08] backdrop-blur-md">
              <h3 className="text-lg font-display font-semibold text-white mb-6">How It Works</h3>

              <div className="space-y-8 relative">
                {/* Connector line */}
                <div className="absolute left-4 top-2 bottom-6 w-0.5 bg-gradient-to-b from-electric-500/50 to-transparent -z-10" />

                <div className="flex gap-4 group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-obsidian-900 border border-electric-500/80 flex items-center justify-center text-electric-400 text-sm font-bold shadow-glow-sm group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <div>
                    <p className="text-white font-medium text-base mb-1">Deposit</p>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Deposit a fixed amount and receive a cryptographic note.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-obsidian-900 border border-electric-500/50 flex items-center justify-center text-electric-400 text-sm font-bold shadow-glow-sm group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <div>
                    <p className="text-white font-medium text-base mb-1">Wait</p>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Time separates your deposit from withdrawal, increasing anonymity set.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-obsidian-900 border border-electric-500/30 flex items-center justify-center text-electric-400 text-sm font-bold shadow-glow-sm group-hover:scale-110 transition-transform">
                    3
                  </div>
                  <div>
                    <p className="text-white font-medium text-base mb-1">Withdraw</p>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Submit ZK proof to withdraw funds to a fresh address completely privately.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Tips */}
            <div className="p-8 rounded-3xl bg-accent-900/10 border border-accent-500/10 backdrop-blur-md">
              <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Security Tips
              </h3>

              <ul className="space-y-4">
                {[
                  'Store your note securely offline - it is your money.',
                  'Use a fresh, empty address for withdrawals.',
                  'Wait at least 24 hours before withdrawing.',
                  'Never share your deposit note with anyone.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm group">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-2 group-hover:scale-125 transition-transform" />
                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
