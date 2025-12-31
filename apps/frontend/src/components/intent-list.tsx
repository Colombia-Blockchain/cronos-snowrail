'use client';

import { useIntents } from '@/hooks/use-intents';
import { TriggerAgentButton } from './trigger-agent-button';

const CRONOSCAN_URL = 'https://testnet.cronoscan.com/tx';

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-700';
    case 'executed':
      return 'bg-green-500/20 text-green-300 border-green-700';
    case 'failed':
      return 'bg-red-500/20 text-red-300 border-red-700';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-700';
  }
}

function IntentCard({
  intent,
}: {
  intent: {
    intentId: string;
    amount: string;
    currency: string;
    recipient: string;
    condition: { type: string; value: string };
    status: string;
    createdAt: string;
    executedTxHash?: string;
  };
}) {
  return (
    <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg hover:border-blue-500/50 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2">{intent.amount} {intent.currency}</h3>
          <p className="text-sm text-gray-400 mb-2">
            To: <span className="font-mono">{intent.recipient.slice(0, 10)}...{intent.recipient.slice(-8)}</span>
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(intent.status)}`}>
          {intent.status.charAt(0).toUpperCase() + intent.status.slice(1)}
        </div>
      </div>

      <div className="mb-4 space-y-2 text-sm text-gray-400">
        <p>
          <span className="text-gray-500">Condition:</span> {intent.condition.type}
          {intent.condition.value && ` (${intent.condition.value})`}
        </p>
        <p>
          <span className="text-gray-500">Created:</span> {new Date(intent.createdAt).toLocaleString()}
        </p>
        {intent.executedTxHash && (
          <p>
            <span className="text-gray-500">Tx Hash:</span>{' '}
            <a
              href={`${CRONOSCAN_URL}/${intent.executedTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono"
            >
              {intent.executedTxHash.slice(0, 10)}...{intent.executedTxHash.slice(-8)}
            </a>
          </p>
        )}
      </div>

      {intent.status === 'pending' && (
        <TriggerAgentButton intentId={intent.intentId} />
      )}
    </div>
  );
}

export function IntentList() {
  const { data: intents = [], isLoading, error } = useIntents();

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 text-center">
        <div className="inline-flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
          <span className="text-gray-300 ml-2">Loading intents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8">
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-300">
          Failed to load intents. Please try again.
        </div>
      </div>
    );
  }

  if (intents.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 text-center">
        <p className="text-gray-400 text-lg">No intents yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Payment Intents</h2>
      <div className="grid gap-4">
        {intents.map((intent) => (
          <IntentCard key={intent.intentId} intent={intent} />
        ))}
      </div>
    </div>
  );
}
