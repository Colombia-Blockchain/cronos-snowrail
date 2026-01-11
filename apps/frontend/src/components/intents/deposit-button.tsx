'use client';

import { useState, useEffect, useRef } from 'react';
import { useDepositIntent, useConfirmDeposit } from '@/hooks';
import { Spinner, useToast } from '@/components/ui';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';

interface DepositButtonProps {
  intentId: string;
  amount: string;
  currency: string;
  disabled?: boolean;
}

type DepositStep = 'idle' | 'preparing' | 'signing' | 'confirming' | 'done' | 'error';

export function DepositButton({ intentId, amount, currency, disabled }: DepositButtonProps) {
  const [step, setStep] = useState<DepositStep>('idle');
  const toast = useToast();

  const prepareDeposit = useDepositIntent();
  const confirmDeposit = useConfirmDeposit();
  const { sendTransaction, data: txHash, error: sendError, reset: resetSend } = useSendTransaction();
  const { isSuccess: txConfirmed, isLoading: txPending } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle deposit flow
  const handleDeposit = async () => {
    resetSend();

    try {
      // Step 1: Prepare deposit TX
      setStep('preparing');
      toast.info('Preparing deposit...', 'Getting transaction data from backend');
      const depositData = await prepareDeposit.mutateAsync(intentId);

      // Step 2: Send TX (user signs in wallet)
      setStep('signing');
      toast.info('Sign transaction', 'Please confirm in your wallet');
      sendTransaction({
        to: depositData.tx.to as `0x${string}`,
        data: depositData.tx.data as `0x${string}`,
        value: BigInt(depositData.tx.value),
      });
    } catch (error) {
      setStep('error');
      toast.error('Deposit failed', error instanceof Error ? error.message : 'Failed to prepare deposit');
    }
  };

  // Track shown toasts to prevent duplicates
  const toastShownRef = useRef<{ error?: boolean; sent?: boolean; confirmed?: boolean }>({});

  // Handle send error
  useEffect(() => {
    if (sendError && !toastShownRef.current.error) {
      toastShownRef.current.error = true;
      setStep('error');
      toast.error('Transaction rejected', sendError.message || 'User rejected the transaction');
    }
  }, [sendError, toast]);

  // When TX is sent, wait for confirmation
  useEffect(() => {
    if (txHash && txPending && !toastShownRef.current.sent) {
      toastShownRef.current.sent = true;
      setStep('confirming');
      toast.info('Transaction sent', 'Waiting for confirmation...');
    }
  }, [txHash, txPending, toast]);

  // Track if confirmation mutation was already called
  const confirmCalledRef = useRef<string | null>(null);

  // When TX is confirmed, call confirm-deposit endpoint
  useEffect(() => {
    if (txConfirmed && txHash && confirmCalledRef.current !== txHash) {
      confirmCalledRef.current = txHash;
      confirmDeposit.mutate(
        { intentId, txHash },
        {
          onSuccess: () => {
            setStep('done');
            toast.success('Deposit successful!', 'Intent is now funded and ready for execution');
          },
          onError: (error) => {
            setStep('error');
            toast.error('Confirmation failed', error instanceof Error ? error.message : 'Failed to confirm deposit');
          },
        }
      );
    }
  }, [txConfirmed, txHash, intentId, confirmDeposit, toast]);

  // Reset to idle after success
  useEffect(() => {
    if (step === 'done') {
      const timer = setTimeout(() => {
        setStep('idle');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const isLoading = step !== 'idle' && step !== 'done' && step !== 'error';

  const getButtonText = () => {
    switch (step) {
      case 'preparing':
        return 'Preparing...';
      case 'signing':
        return 'Sign in Wallet...';
      case 'confirming':
        return 'Confirming...';
      case 'done':
        return 'Deposited';
      default:
        return `Deposit ${amount} ${currency}`;
    }
  };

  return (
    <button
      onClick={handleDeposit}
      disabled={disabled || isLoading || step === 'done'}
      className={`
        w-full px-4 py-2.5 font-medium rounded-xl transition-all duration-200
        flex items-center justify-center gap-2
        ${step === 'done'
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : step === 'error'
            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
            : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
        }
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
      `}
    >
      {isLoading && <Spinner size="sm" />}
      {step === 'done' && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {getButtonText()}
    </button>
  );
}
