'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useMixerWithdraw, useSimulateWithdraw, useMixerInfo } from '@/hooks';
import { Spinner, TxLink, useToast } from '@/components/ui';
import type { DepositNote } from '@cronos-x402/shared-types';

type WithdrawStep = 'input' | 'simulating' | 'signing' | 'done' | 'error';

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function MixerWithdraw() {
  const [step, setStep] = useState<WithdrawStep>('input');
  const [noteJson, setNoteJson] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState<DepositNote | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);

  const { isConnected, address } = useAccount();
  const { data: mixerInfo } = useMixerInfo();
  const simulateWithdraw = useSimulateWithdraw();
  const mixerWithdraw = useMixerWithdraw();
  const { sendTransaction, data: txHash, error: sendError, reset: resetSend } = useSendTransaction();
  const { isLoading: isConfirmingTx, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const toast = useToast();

  const parseNote = (): DepositNote | null => {
    try {
      const parsed = JSON.parse(noteJson);
      if (!parsed.nullifier || !parsed.secret || !parsed.commitment || !parsed.nullifierHash) {
        throw new Error('Invalid note format');
      }
      return parsed as DepositNote;
    } catch {
      return null;
    }
  };

  const handleSimulate = () => {
    const parsedNote = parseNote();
    if (!parsedNote) {
      setErrorMessage('Invalid note format. Please paste a valid deposit note.');
      toast.error('Invalid note', 'Please paste a valid deposit note in JSON format');
      return;
    }

    if (!recipient && !address) {
      setErrorMessage('Please enter a recipient address');
      toast.error('Missing recipient', 'Please enter a recipient address');
      return;
    }

    if (recipient && !isValidAddress(recipient)) {
      setErrorMessage('Invalid recipient address format');
      toast.error('Invalid address', 'Please enter a valid Ethereum address');
      return;
    }

    const recipientAddress = recipient || address!;
    setNote(parsedNote);
    setErrorMessage(null);
    setStep('simulating');
    toast.info('Verifying withdrawal...', 'Checking if note can be withdrawn');

    simulateWithdraw.mutate(
      {
        note: parsedNote,
        leafIndex: parsedNote.leafIndex ?? 0,
        recipient: recipientAddress,
      },
      {
        onSuccess: (data) => {
          if (data.canExecute) {
            handleWithdraw(parsedNote, recipientAddress);
          } else {
            setErrorMessage('Cannot execute withdrawal. The note may have already been spent.');
            setStep('error');
            toast.error('Cannot withdraw', 'The note may have already been spent');
          }
        },
        onError: (err) => {
          setErrorMessage(err instanceof Error ? err.message : 'Simulation failed');
          setStep('error');
          toast.error('Verification failed', err instanceof Error ? err.message : 'Simulation failed');
        },
      }
    );
  };

  const handleWithdraw = (withdrawNote: DepositNote, recipientAddr: string) => {
    setStep('signing');
    toast.info('Sign transaction', 'Please confirm the withdrawal in your wallet');

    mixerWithdraw.mutate(
      {
        note: withdrawNote,
        leafIndex: withdrawNote.leafIndex ?? 0,
        recipient: recipientAddr,
      },
      {
        onSuccess: (data) => {
          sendTransaction({
            to: data.tx.to as `0x${string}`,
            data: data.tx.data as `0x${string}`,
            value: BigInt(data.tx.value),
          });
        },
        onError: (err) => {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to prepare withdrawal');
          setStep('error');
          toast.error('Withdrawal failed', err instanceof Error ? err.message : 'Failed to prepare withdrawal');
        },
      }
    );
  };

  // Track if toast was already shown for this tx
  const toastShownRef = useRef<string | null>(null);
  const errorShownRef = useRef<boolean>(false);

  // Handle wallet rejection/error
  useEffect(() => {
    if (sendError && step === 'signing' && !errorShownRef.current) {
      errorShownRef.current = true;
      setErrorMessage(sendError.message || 'User rejected the transaction');
      setStep('error');
      toast.error('Transaction rejected', sendError.message || 'User rejected the transaction');
    }
  }, [sendError, step, toast]);

  // Watch for transaction confirmation
  useEffect(() => {
    if (isTxConfirmed && step === 'signing' && txHash && toastShownRef.current !== txHash) {
      toastShownRef.current = txHash;
      setCompletedTxHash(txHash);
      setStep('done');
      toast.success('Withdrawal successful!', 'Your funds have been withdrawn privately');
    }
  }, [isTxConfirmed, step, txHash, toast]);

  const resetWithdraw = () => {
    setStep('input');
    setNoteJson('');
    setRecipient('');
    setNote(null);
    setErrorMessage(null);
    setCompletedTxHash(null);
    simulateWithdraw.reset();
    mixerWithdraw.reset();
    resetSend();
    toastShownRef.current = null;
    errorShownRef.current = false;
  };

  const useConnectedAddress = () => {
    if (address) {
      setRecipient(address);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-8 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          </div>
          <p className="text-slate-400 font-medium">Connect your wallet to withdraw</p>
          <p className="text-slate-500 text-sm mt-1">Use the connect button in the navbar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Withdraw from Mixer</h3>
          <p className="text-slate-500 text-sm">Privately withdraw your funds</p>
        </div>
      </div>

      {/* Mixer Info */}
      {mixerInfo && (
        <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Withdrawal Amount</p>
              <p className="text-2xl font-semibold text-white">{mixerInfo.denomination}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Step: Input */}
      {step === 'input' && (
        <div className="space-y-5">
          {/* Note Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Deposit Note
            </label>
            <textarea
              value={noteJson}
              onChange={(e) => setNoteJson(e.target.value)}
              placeholder='Paste your deposit note JSON here...'
              rows={5}
              className="w-full px-4 py-3 bg-surface-900 border border-white/[0.08] rounded-xl text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-colors"
            />
          </div>

          {/* Recipient Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Recipient Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x... (leave empty to use connected wallet)"
                className="flex-1 px-4 py-2.5 bg-surface-900 border border-white/[0.08] rounded-xl text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-colors"
              />
              <button
                onClick={useConnectedAddress}
                className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-sm font-medium rounded-xl border border-white/[0.08] transition-colors"
              >
                Use Mine
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              For privacy, use a fresh address that has no connection to your deposit
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div>
                <p className="text-brand-300 text-sm font-medium mb-1">Privacy Tips</p>
                <ul className="text-brand-400/70 text-sm space-y-1">
                  <li>Wait some time between deposit and withdrawal</li>
                  <li>Use a fresh wallet address for withdrawal</li>
                  <li>Avoid withdrawing exact amounts to known addresses</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-300 text-sm">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Withdraw Button */}
          <button
            onClick={handleSimulate}
            disabled={!noteJson.trim()}
            className="w-full px-4 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Withdraw Funds
          </button>
        </div>
      )}

      {/* Step: Simulating */}
      {step === 'simulating' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="mt-4 text-slate-300">Verifying withdrawal...</span>
        </div>
      )}

      {/* Step: Signing */}
      {step === 'signing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="mt-4 text-slate-300">
            {isConfirmingTx ? 'Waiting for confirmation...' : 'Sign transaction in your wallet...'}
          </span>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-300 font-semibold text-lg">Withdrawal Successful!</p>
                <p className="text-emerald-400/70 text-sm">Your funds have been withdrawn privately</p>
              </div>
            </div>

            {completedTxHash && (
              <div className="pt-4 border-t border-emerald-500/20">
                <TxLink hash={completedTxHash} label="View Transaction" />
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-amber-300 text-sm font-medium">Note Spent</p>
                <p className="text-amber-400/70 text-sm mt-1">
                  This deposit note has been used and cannot be withdrawn again. You can safely delete it.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={resetWithdraw}
            className="w-full px-4 py-3 bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium rounded-xl border border-white/[0.08] transition-colors"
          >
            Withdraw Another
          </button>
        </div>
      )}

      {/* Step: Error */}
      {step === 'error' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div>
                <p className="text-red-300 font-medium">Withdrawal Failed</p>
                <p className="text-red-400/70 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>

          <button
            onClick={resetWithdraw}
            className="w-full px-4 py-3 bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium rounded-xl border border-white/[0.08] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
