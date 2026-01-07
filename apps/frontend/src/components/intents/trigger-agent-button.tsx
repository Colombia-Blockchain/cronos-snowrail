'use client';

import { useState } from 'react';
import { useTriggerAgent } from '@/hooks';
import { Spinner, TxLink, useToast } from '@/components/ui';

interface TriggerAgentButtonProps {
  intentId: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function TriggerAgentButton({ intentId, disabled, variant = 'primary' }: TriggerAgentButtonProps) {
  const [showResult, setShowResult] = useState(false);
  const triggerAgent = useTriggerAgent();
  const toast = useToast();

  const handleTrigger = () => {
    setShowResult(false);
    toast.info('Triggering agent...', 'AI is evaluating the payment condition');

    triggerAgent.mutate(intentId, {
      onSuccess: (data) => {
        setShowResult(true);
        if (data.txHash) {
          toast.success('Payment executed!', `Transaction: ${data.txHash.slice(0, 10)}...`);
        } else if (data.agentDecision?.decision === 'SKIP') {
          toast.warning('Agent skipped execution', data.agentDecision.reason || 'Condition not met');
        } else {
          toast.info('Agent evaluated', 'Check the result below');
        }
      },
      onError: (error) => {
        toast.error('Agent trigger failed', error instanceof Error ? error.message : 'Failed to trigger agent');
      },
    });
  };

  const buttonClasses = variant === 'primary'
    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-blue-500/50'
    : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:shadow-gray-500/50';

  return (
    <div className="space-y-2">
      <button
        onClick={handleTrigger}
        disabled={disabled || triggerAgent.isPending}
        className={`w-full px-4 py-2 ${buttonClasses} text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
      >
        {triggerAgent.isPending && <Spinner size="sm" />}
        {triggerAgent.isPending ? 'Triggering Agent...' : 'Trigger Agent'}
      </button>

      {triggerAgent.error && (
        <div className="p-2 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm">
          {triggerAgent.error instanceof Error ? triggerAgent.error.message : 'Failed to trigger agent'}
        </div>
      )}

      {showResult && triggerAgent.data && (
        <>
          {triggerAgent.data.txHash ? (
            <div className="p-2 bg-green-900/20 border border-green-700 rounded-lg text-green-300 text-sm">
              <p className="font-semibold mb-1">Executed!</p>
              <TxLink hash={triggerAgent.data.txHash} />
            </div>
          ) : (
            <div className="p-2 bg-yellow-900/20 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
              <p className="font-semibold">Agent Decision: {triggerAgent.data.agentDecision?.decision}</p>
              <p className="text-xs mt-1">{triggerAgent.data.agentDecision?.reason}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
