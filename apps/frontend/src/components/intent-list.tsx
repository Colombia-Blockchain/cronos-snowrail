'use client';

import Link from 'next/link';
import { useIntents } from '@/hooks';
import { Card, StatusBadge, TxLink, AddressLink, Spinner } from '@/components/ui';
import { DepositButton, ExecuteButton, TriggerAgentButton } from '@/components/intents';
import type { PaymentIntent } from '@cronos-x402/shared-types';

interface IntentCardProps {
  intent: PaymentIntent;
  index: number;
}

function IntentCard({ intent, index }: IntentCardProps) {
  const canDeposit = intent.status === 'pending';
  const canExecute = intent.status === 'funded';
  const canTriggerAgent = intent.status === 'pending' || intent.status === 'funded';

  return (
    <div
      className="group p-5 bg-surface-800/60 border border-white/[0.06] rounded-xl hover:border-white/[0.1] hover:bg-surface-800/80 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/dashboard/intents/${intent.intentId}`}
            className="inline-flex items-center gap-2 group/link"
          >
            <span className="text-xl font-semibold text-white group-hover/link:text-brand-400 transition-colors">
              {intent.amount}
            </span>
            <span className="text-lg text-slate-400">{intent.currency}</span>
            <svg
              className="w-4 h-4 text-slate-600 group-hover/link:text-brand-400 group-hover/link:translate-x-0.5 transition-all"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">To</span>
            <AddressLink address={intent.recipient} />
          </div>
        </div>
        <StatusBadge status={intent.status} />
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-slate-400">
            {new Date(intent.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-slate-400 capitalize">{intent.condition.type.replace('-', ' ')}</span>
          {intent.condition.value && (
            <span className="text-slate-500">({intent.condition.value})</span>
          )}
        </div>
      </div>

      {/* Transaction Links */}
      {(intent.depositTxHash || intent.executedTxHash) && (
        <div className="flex flex-wrap gap-3 mb-4 pt-3 border-t border-white/[0.04]">
          {intent.depositTxHash && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-500">Deposit:</span>
              <TxLink hash={intent.depositTxHash} />
            </div>
          )}
          {intent.executedTxHash && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-500">Execution:</span>
              <TxLink hash={intent.executedTxHash} />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {(canDeposit || canExecute || canTriggerAgent) && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/[0.04]">
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
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card variant="outlined" padding="lg" className="text-center">
      <div className="py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No intents yet</h3>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">
          Create your first payment intent to get started with conditional treasury management.
        </p>
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card variant="outlined" padding="lg" className="text-center">
      <div className="py-8 flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-brand-400" />
        <p className="text-slate-400 text-sm">Loading intents...</p>
      </div>
    </Card>
  );
}

function ErrorState() {
  return (
    <Card variant="outlined" padding="lg">
      <div className="flex items-start gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-red-400 mb-1">Failed to load intents</h3>
          <p className="text-sm text-red-400/70">Please check your connection and try again.</p>
        </div>
      </div>
    </Card>
  );
}

export function IntentList() {
  const { data: intents = [], isLoading, error } = useIntents();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;
  if (intents.length === 0) return <EmptyState />;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">Payment Intents</h2>
        <span className="text-sm text-slate-500">{intents.length} total</span>
      </div>
      <div className="space-y-3">
        {intents.map((intent, index) => (
          <IntentCard key={intent.intentId} intent={intent} index={index} />
        ))}
      </div>
    </div>
  );
}
