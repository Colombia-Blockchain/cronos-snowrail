'use client';

import { useMixerInfo } from '@/hooks';
import { Spinner } from '@/components/ui';

export function MixerInfo() {
  const { data: mixerInfo, isLoading, error } = useMixerInfo();

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
          <span className="ml-3 text-slate-400">Loading mixer info...</span>
        </div>
      </div>
    );
  }

  if (error || !mixerInfo) {
    return (
      <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-400 text-sm">Failed to load mixer information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white">Mixer Status</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Denomination */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <p className="text-xs text-slate-500 mb-1">Denomination</p>
          <p className="text-lg font-semibold text-white">{mixerInfo.denomination}</p>
        </div>

        {/* Anonymity Set */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <p className="text-xs text-slate-500 mb-1">Anonymity Set</p>
          <p className="text-lg font-semibold text-brand-400">{mixerInfo.privacyModel.anonymitySet}</p>
        </div>

        {/* Total Deposits */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <p className="text-xs text-slate-500 mb-1">Total Deposits</p>
          <p className="text-lg font-semibold text-white">{mixerInfo.localDepositCount}</p>
        </div>

        {/* Contract Status */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <p className="text-xs text-slate-500 mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${mixerInfo.onChain ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-sm font-medium text-white">
              {mixerInfo.onChain ? 'Deployed' : 'Local'}
            </span>
          </div>
        </div>
      </div>

      {/* On-Chain Info */}
      {mixerInfo.onChain && (
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
          <p className="text-xs text-slate-500 mb-1.5">Contract</p>
          <p className="font-mono text-xs text-slate-400 break-all">
            {mixerInfo.onChain.contractAddress}
          </p>
        </div>
      )}

      {/* Privacy Model */}
      <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/10">
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <p className="text-xs font-medium text-brand-300 mb-1">How Privacy Works</p>
            <p className="text-xs text-brand-400/70 leading-relaxed">
              {mixerInfo.privacyModel.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
