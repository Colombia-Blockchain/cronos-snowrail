'use client';

import { useState, useEffect } from 'react';
import { useExecuteIntent } from '@/hooks';
import { Spinner, useToast } from '@/components/ui';

interface ExecuteButtonProps {
  intentId: string;
  disabled?: boolean;
}

export function ExecuteButton({ intentId, disabled }: ExecuteButtonProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const executeIntent = useExecuteIntent();
  const toast = useToast();

  const handleExecute = () => {
    setIsSuccess(false);
    toast.info('Executing payment...', 'Processing your intent');

    executeIntent.mutate(intentId, {
      onSuccess: (data) => {
        setIsSuccess(true);
        if (data.executedTxHash) {
          toast.success('Payment executed!', `Transaction: ${data.executedTxHash.slice(0, 10)}...`);
        } else {
          toast.success('Payment executed!', 'Intent has been processed successfully');
        }
      },
      onError: (error) => {
        toast.error('Execution failed', error instanceof Error ? error.message : 'Failed to execute payment');
      },
    });
  };

  // Reset success state after a delay
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => setIsSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return (
    <button
      onClick={handleExecute}
      disabled={disabled || executeIntent.isPending || isSuccess}
      className={`
        w-full px-4 py-2.5 font-medium rounded-xl transition-all duration-200
        flex items-center justify-center gap-2
        ${isSuccess
          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
          : 'bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40'
        }
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
      `}
    >
      {executeIntent.isPending && <Spinner size="sm" />}
      {isSuccess && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {executeIntent.isPending ? 'Executing...' : isSuccess ? 'Executed' : 'Execute Payment'}
    </button>
  );
}
