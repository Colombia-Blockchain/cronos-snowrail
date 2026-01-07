'use client';

import { useState } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useGenerateNote, useMixerDeposit, useConfirmMixerDeposit, useMixerInfo } from '@/hooks';
import { Spinner, useToast } from '@/components/ui';
import type { DepositNote } from '@cronos-x402/shared-types';

type DepositStep = 'idle' | 'generating' | 'signing' | 'confirming' | 'done' | 'error';

interface MixerDepositProps {
  onNoteGenerated?: (note: DepositNote) => void;
}

export function MixerDeposit({ onNoteGenerated }: MixerDepositProps) {
  const [step, setStep] = useState<DepositStep>('idle');
  const [note, setNote] = useState<DepositNote | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noteCopied, setNoteCopied] = useState(false);
  const [noteConfirmed, setNoteConfirmed] = useState(false);

  const { isConnected } = useAccount();
  const { data: mixerInfo } = useMixerInfo();
  const generateNote = useGenerateNote();
  const mixerDeposit = useMixerDeposit();
  const confirmDeposit = useConfirmMixerDeposit();
  const { sendTransaction, data: txHash } = useSendTransaction();
  const { isLoading: isConfirmingTx, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const toast = useToast();

  const handleStartDeposit = async () => {
    setStep('generating');
    setErrorMessage(null);
    setNote(null);
    setNoteCopied(false);
    setNoteConfirmed(false);
    toast.info('Generating note...', 'Creating secure deposit credentials');

    generateNote.mutate(undefined, {
      onSuccess: (data) => {
        setNote(data.note);
        onNoteGenerated?.(data.note);
        toast.warning('Save your note!', 'You must save this note to withdraw your funds');
      },
      onError: (err) => {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to generate note');
        setStep('error');
        toast.error('Generation failed', err instanceof Error ? err.message : 'Failed to generate note');
      },
    });
  };

  const handlePrepareDeposit = () => {
    if (!note) return;

    setStep('signing');
    toast.info('Sign transaction', 'Please confirm in your wallet');
    mixerDeposit.mutate(
      note.commitment,
      {
        onSuccess: (data) => {
          sendTransaction({
            to: data.tx.to as `0x${string}`,
            data: data.tx.data as `0x${string}`,
            value: BigInt(data.tx.value),
          });
        },
        onError: (err) => {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to prepare deposit');
          setStep('error');
          toast.error('Deposit failed', err instanceof Error ? err.message : 'Failed to prepare deposit');
        },
      }
    );
  };

  const handleConfirmDeposit = () => {
    if (!note || !txHash) return;

    setStep('confirming');
    toast.info('Confirming deposit...', 'Waiting for blockchain confirmation');
    confirmDeposit.mutate(
      { txHash, commitment: note.commitment },
      {
        onSuccess: (data) => {
          setNote((prev) => prev ? { ...prev, leafIndex: data.leafIndex, depositTxHash: txHash } : null);
          setStep('done');
          toast.success('Deposit successful!', 'Your funds are now in the mixer');
        },
        onError: (err) => {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to confirm deposit');
          setStep('error');
          toast.error('Confirmation failed', err instanceof Error ? err.message : 'Failed to confirm deposit');
        },
      }
    );
  };

  const copyNote = async () => {
    if (!note) return;
    const noteString = JSON.stringify(note, null, 2);
    await navigator.clipboard.writeText(noteString);
    setNoteCopied(true);
  };

  const resetDeposit = () => {
    setStep('idle');
    setNote(null);
    setErrorMessage(null);
    setNoteCopied(false);
    setNoteConfirmed(false);
    generateNote.reset();
    mixerDeposit.reset();
    confirmDeposit.reset();
  };

  // Trigger confirm when tx is confirmed on chain
  if (isTxConfirmed && step === 'signing' && txHash) {
    handleConfirmDeposit();
  }

  if (!isConnected) {
    return (
      <div className="p-8 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          </div>
          <p className="text-slate-400 font-medium">Connect your wallet to deposit</p>
          <p className="text-slate-500 text-sm mt-1">Use the connect button in the navbar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-surface-800/80 border border-white/[0.06]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Deposit to Mixer</h3>
          <p className="text-slate-500 text-sm">Add funds to the privacy pool</p>
        </div>
      </div>

      {/* Mixer Info */}
      {mixerInfo && (
        <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fixed Amount</p>
              <p className="text-2xl font-semibold text-white">{mixerInfo.denomination}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Anonymity Set</p>
              <p className="text-lg font-semibold text-brand-400">{mixerInfo.privacyModel.anonymitySet} deposits</p>
            </div>
          </div>
        </div>
      )}

      {/* Step: Idle */}
      {step === 'idle' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-amber-300 text-sm font-medium mb-1">Important</p>
                <ul className="text-amber-400/70 text-sm space-y-1">
                  <li>You MUST save the deposit note to withdraw your funds</li>
                  <li>Without the note, funds are permanently lost</li>
                  <li>Do not share your note with anyone</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartDeposit}
            className="w-full px-4 py-3.5 bg-brand-500 hover:bg-brand-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40"
          >
            Generate Deposit Note
          </button>
        </div>
      )}

      {/* Step: Generating Note */}
      {step === 'generating' && generateNote.isPending && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="mt-4 text-slate-300">Generating secure note...</span>
        </div>
      )}

      {/* Step: Note Generated - Save it */}
      {step === 'generating' && note && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3 mb-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-red-300 text-sm font-medium">CRITICAL: Save Your Note!</p>
                <p className="text-red-400/70 text-xs mt-1">
                  This note is required to withdraw your funds. Store it securely offline.
                </p>
              </div>
            </div>

            <div className="bg-surface-900 p-4 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto border border-white/[0.06]">
              <pre>{JSON.stringify(note, null, 2)}</pre>
            </div>

            <button
              onClick={copyNote}
              className={`mt-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                noteCopied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.08]'
              }`}
            >
              {noteCopied ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied to Clipboard
                </span>
              ) : (
                'Copy Note to Clipboard'
              )}
            </button>
          </div>

          <label className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors">
            <input
              type="checkbox"
              checked={noteConfirmed}
              onChange={(e) => setNoteConfirmed(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-surface-700 text-brand-500 focus:ring-brand-500 focus:ring-offset-0"
            />
            <span className="text-slate-300 text-sm">
              I have saved my note securely and understand I cannot recover funds without it
            </span>
          </label>

          <button
            onClick={handlePrepareDeposit}
            disabled={!noteConfirmed}
            className="w-full px-4 py-3.5 bg-brand-500 hover:bg-brand-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Continue to Deposit
          </button>
        </div>
      )}

      {/* Step: Signing Transaction */}
      {step === 'signing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="mt-4 text-slate-300">
            {isConfirmingTx ? 'Waiting for confirmation...' : 'Sign transaction in your wallet...'}
          </span>
        </div>
      )}

      {/* Step: Confirming */}
      {step === 'confirming' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="mt-4 text-slate-300">Confirming deposit...</span>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && note && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-300 font-medium">Deposit Successful!</p>
                <p className="text-emerald-400/70 text-sm">Your funds are now in the mixer</p>
              </div>
            </div>

            {note.leafIndex !== undefined && (
              <p className="text-slate-400 text-sm">
                Leaf Index: <span className="font-mono text-slate-300">{note.leafIndex}</span>
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-300 text-sm font-medium mb-3">Updated Note (Save This!)</p>
            <div className="bg-surface-900 p-4 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto border border-white/[0.06]">
              <pre>{JSON.stringify(note, null, 2)}</pre>
            </div>
            <button
              onClick={copyNote}
              className={`mt-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                noteCopied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.08]'
              }`}
            >
              {noteCopied ? 'Copied!' : 'Copy Updated Note'}
            </button>
          </div>

          <button
            onClick={resetDeposit}
            className="w-full px-4 py-3 bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium rounded-xl border border-white/[0.08] transition-colors"
          >
            Make Another Deposit
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
                <p className="text-red-300 font-medium">Deposit Failed</p>
                <p className="text-red-400/70 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>

          <button
            onClick={resetDeposit}
            className="w-full px-4 py-3 bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium rounded-xl border border-white/[0.08] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
