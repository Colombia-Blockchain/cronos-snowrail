'use client';

import { useState } from 'react';
import { useTriggerAgent } from '@/hooks/use-trigger-agent';

const CRONOSCAN_URL = 'https://testnet.cronoscan.com/tx';

export function TriggerAgentButton({ intentId }: { intentId: string }) {
  const [showResult, setShowResult] = useState(false);
  const { mutate, isPending, data, error } = useTriggerAgent();

  const handleTrigger = () => {
    setShowResult(false);
    mutate(intentId, {
      onSuccess: () => {
        setShowResult(true);
      },
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleTrigger}
        disabled={isPending}
        className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Triggering Agent...' : 'Trigger Agent'}
      </button>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm">
          {error instanceof Error ? error.message : 'Failed to trigger agent'}
        </div>
      )}

      {showResult && data && (
        <>
          {data.txHash ? (
            <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-300 text-sm">
              <p className="font-semibold mb-1">Success! Transaction executed:</p>
              <a
                href={`${CRONOSCAN_URL}/${data.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono break-all"
              >
                {data.txHash}
              </a>
            </div>
          ) : (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
              <p className="font-semibold">Agent Decision:</p>
              <p>{data.reason || 'Agent skipped this intent based on current conditions'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
