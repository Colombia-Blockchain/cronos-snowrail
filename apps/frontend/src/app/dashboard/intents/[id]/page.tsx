'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useIntent } from '@/hooks';
import { StatusBadge, TxLink, AddressLink, Spinner } from '@/components/ui';
import { DepositButton, ExecuteButton, TriggerAgentButton } from '@/components/intents';

export default function IntentDetailPage() {
  const params = useParams();
  const intentId = params.id as string;

  const { data: intent, isLoading, error } = useIntent(intentId);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="fixed inset-0 bg-gradient-to-br from-surface-800 via-surface-900 to-surface-950 pointer-events-none" />
        <div className="fixed inset-0 bg-mesh-gradient-dark pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" className="text-brand-400" />
            <span className="ml-4 text-slate-400">Loading intent details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !intent) {
    return (
      <div className="min-h-screen">
        <div className="fixed inset-0 bg-gradient-to-br from-surface-800 via-surface-900 to-surface-950 pointer-events-none" />
        <div className="fixed inset-0 bg-mesh-gradient-dark pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 py-8">
          <BackButton />
          <div className="mt-6 p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-400 mb-1">Intent not found</h3>
                <p className="text-sm text-red-400/70">
                  {error instanceof Error ? error.message : 'The requested payment intent could not be found.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canDeposit = intent.status === 'pending';
  const canExecute = intent.status === 'funded';
  const canTriggerAgent = intent.status === 'pending' || intent.status === 'funded';

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-gradient-to-br from-surface-800 via-surface-900 to-surface-950 pointer-events-none" />
      <div className="fixed inset-0 bg-mesh-gradient-dark pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <BackButton />

        {/* Header */}
        <header className="mt-6 mb-8 animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-semibold text-white">
                  {intent.amount} {intent.currency}
                </h1>
                <StatusBadge status={intent.status} />
              </div>
              <p className="text-slate-400">Payment Intent</p>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Intent Details Card */}
            <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white mb-5">Intent Details</h2>

              <div className="space-y-4">
                {/* Intent ID */}
                <div className="flex items-start justify-between py-3 border-b border-white/[0.04]">
                  <span className="text-slate-400 text-sm">Intent ID</span>
                  <span className="font-mono text-sm text-slate-300 text-right break-all max-w-[60%]">
                    {intent.intentId}
                  </span>
                </div>

                {/* Recipient */}
                <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                  <span className="text-slate-400 text-sm">Recipient</span>
                  <AddressLink address={intent.recipient} />
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                  <span className="text-slate-400 text-sm">Amount</span>
                  <span className="text-white font-semibold">
                    {intent.amount} {intent.currency}
                  </span>
                </div>

                {/* Condition */}
                <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                  <span className="text-slate-400 text-sm">Condition</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-lg bg-brand-500/10 text-brand-400 text-xs font-medium capitalize">
                      {intent.condition.type.replace('-', ' ')}
                    </span>
                    {intent.condition.value && (
                      <span className="text-slate-300 text-sm">{intent.condition.value}</span>
                    )}
                  </div>
                </div>

                {/* Created At */}
                <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                  <span className="text-slate-400 text-sm">Created</span>
                  <span className="text-slate-300 text-sm">
                    {new Date(intent.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between py-3">
                  <span className="text-slate-400 text-sm">Status</span>
                  <StatusBadge status={intent.status} />
                </div>
              </div>
            </div>

            {/* Transaction History */}
            {(intent.depositTxHash || intent.executedTxHash || intent.txHash) && (
              <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
                <h2 className="text-lg font-semibold text-white mb-5">Transaction History</h2>

                <div className="space-y-4">
                  {intent.depositTxHash && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">Deposit</p>
                          <p className="text-slate-500 text-xs">Funds deposited to treasury</p>
                        </div>
                      </div>
                      <TxLink hash={intent.depositTxHash} />
                    </div>
                  )}

                  {intent.executedTxHash && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">Execution</p>
                          <p className="text-slate-500 text-xs">Payment sent to recipient</p>
                        </div>
                      </div>
                      <TxLink hash={intent.executedTxHash} />
                    </div>
                  )}

                  {intent.txHash && !intent.executedTxHash && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">Transaction</p>
                          <p className="text-slate-500 text-xs">On-chain transaction</p>
                        </div>
                      </div>
                      <TxLink hash={intent.txHash} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            {(canDeposit || canExecute || canTriggerAgent) && (
              <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
                <h2 className="text-lg font-semibold text-white mb-5">Actions</h2>

                <div className="space-y-3">
                  {canDeposit && (
                    <DepositButton
                      intentId={intent.intentId}
                      amount={intent.amount}
                      currency={intent.currency}
                    />
                  )}

                  {canExecute && (
                    <ExecuteButton intentId={intent.intentId} />
                  )}

                  {canTriggerAgent && (
                    <TriggerAgentButton
                      intentId={intent.intentId}
                      variant={canExecute ? 'primary' : 'secondary'}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Status Info */}
            <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white mb-4">Status Info</h2>

              {intent.status === 'pending' && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-amber-300 text-sm font-medium">Awaiting Deposit</p>
                      <p className="text-amber-400/70 text-xs mt-1">
                        Deposit funds to enable execution
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {intent.status === 'funded' && (
                <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-brand-300 text-sm font-medium">Ready to Execute</p>
                      <p className="text-brand-400/70 text-xs mt-1">
                        Trigger the agent or execute manually
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {intent.status === 'executed' && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-emerald-300 text-sm font-medium">Completed</p>
                      <p className="text-emerald-400/70 text-xs mt-1">
                        Payment has been executed successfully
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {intent.status === 'failed' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <p className="text-red-300 text-sm font-medium">Failed</p>
                      <p className="text-red-400/70 text-xs mt-1">
                        Execution failed. Check transaction for details.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Condition Info */}
            <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white mb-4">Condition Details</h2>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-white font-medium capitalize">
                    {intent.condition.type.replace('-', ' ')}
                  </span>
                </div>

                {intent.condition.type === 'manual' ? (
                  <p className="text-slate-400 text-sm">
                    This intent will be executed manually or when triggered by the AI agent.
                  </p>
                ) : (
                  <p className="text-slate-400 text-sm">
                    This intent will execute when price is below {intent.condition.value}.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackButton() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span className="text-sm">Back to Dashboard</span>
    </Link>
  );
}
