'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSendTransaction } from 'wagmi';
import { parseEther, getAddress } from 'viem';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    type: 'deposit' | 'mix' | 'withdraw';
    contractAddress: string;
    amount: string;
    params: any;
    intentId?: string;
  } | null;
}

// Settlement contract just receives ETH via receive() function - no special deposit function
// The backend tracks the intent and will execute the settlement with signatures

const MIXER_ABI = [
  {
    inputs: [{ internalType: 'bytes32', name: 'commitment', type: 'bytes32' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes', name: 'proof', type: 'bytes' },
      { internalType: 'bytes32', name: 'root', type: 'bytes32' },
      { internalType: 'bytes32', name: 'nullifierHash', type: 'bytes32' },
      { internalType: 'address payable', name: 'recipient', type: 'address' },
      { internalType: 'address payable', name: 'relayer', type: 'address' },
      { internalType: 'uint256', name: 'fee', type: 'uint256' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const { address, isConnected } = useAccount();
  const [status, setStatus] = useState<'idle' | 'signing' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Reset state when modal opens with a new transaction
  useEffect(() => {
    if (isOpen && transaction) {
      setStatus('idle');
      setError(null);
      setTxHash(undefined);
    }
  }, [isOpen, transaction?.type, transaction?.contractAddress, transaction?.params?.commitment, transaction?.params?.nullifierHash]);

  // Update status based on confirmation
  useEffect(() => {
    if (isConfirmed && status === 'pending') {
      setStatus('success');
    }
  }, [isConfirmed, status]);

  if (!isOpen || !transaction) return null;

  const handleSign = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setStatus('signing');
      setError(null);

      console.log('Transaction params:', {
        contractAddress: transaction.contractAddress,
        amount: transaction.amount,
        params: transaction.params,
      });

      let hash: `0x${string}`;

      if (transaction.type === 'deposit') {
        // Settlement contract uses receive() function - just send ETH directly
        // The backend will track the deposit and execute the settlement with signatures
        console.log('Sending ETH deposit to Settlement contract:', transaction.contractAddress);

        hash = await sendTransactionAsync({
          to: transaction.contractAddress as `0x${string}`,
          value: parseEther(transaction.amount),
        });
      } else if (transaction.type === 'mix') {
        // Deposit to mixer - mixer has a deposit(commitment) function
        hash = await writeContractAsync({
          address: transaction.contractAddress as `0x${string}`,
          abi: MIXER_ABI,
          functionName: 'deposit',
          args: [transaction.params.commitment as `0x${string}`],
          value: parseEther(transaction.amount),
        });
      } else if (transaction.type === 'withdraw') {
        // Withdraw from mixer
        hash = await writeContractAsync({
          address: transaction.contractAddress as `0x${string}`,
          abi: MIXER_ABI,
          functionName: 'withdraw',
          args: [
            transaction.params.proof as `0x${string}`,
            transaction.params.root as `0x${string}`,
            transaction.params.nullifierHash as `0x${string}`,
            transaction.params.recipient as `0x${string}`,
            transaction.params.relayer as `0x${string}`,
            BigInt(transaction.params.fee || '0'),
          ],
        });
      } else {
        throw new Error('Unknown transaction type');
      }

      console.log('Transaction submitted:', hash);
      setTxHash(hash);
      setStatus('pending');
    } catch (err: any) {
      console.error('Transaction error:', err);
      setError(err.shortMessage || err.message || 'Transaction failed');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-obsidian-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric-500/20 border border-electric-500/30 flex items-center justify-center">
              <span className="text-xl">
                {transaction.type === 'deposit' && '📥'}
                {transaction.type === 'mix' && '🎭'}
                {transaction.type === 'withdraw' && '📤'}
              </span>
            </div>
            <h2 className="text-xl font-display font-bold text-white">
              {transaction.type === 'deposit' && 'Confirm Deposit'}
              {transaction.type === 'mix' && 'Confirm Mixer Deposit'}
              {transaction.type === 'withdraw' && 'Confirm Withdrawal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300"
            disabled={status === 'signing' || status === 'pending'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Transaction Details */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Type</span>
            <span className="text-sm font-semibold text-white capitalize">{transaction.type}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Amount</span>
            <span className="text-sm font-semibold text-electric-400">{transaction.amount} CRO</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Contract</span>
            <span className="font-mono text-xs text-slate-300 bg-white/5 px-2 py-1 rounded">
              {transaction.contractAddress.slice(0, 10)}...{transaction.contractAddress.slice(-8)}
            </span>
          </div>
          {transaction.intentId && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Intent ID</span>
              <span className="font-mono text-xs text-slate-300 bg-white/5 px-2 py-1 rounded truncate max-w-[180px]">
                {transaction.intentId}
              </span>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {status === 'signing' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
              <p className="text-sm text-yellow-200">Please sign the transaction in your wallet...</p>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-electric-500/10 border border-electric-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-electric-400/30 border-t-electric-400 rounded-full animate-spin" />
              <div>
                <p className="text-sm text-electric-200">Transaction pending confirmation...</p>
                {txHash && (
                  <p className="text-xs text-electric-400/70 mt-1 font-mono">
                    TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-200">Transaction confirmed!</p>
                {txHash && (
                  <a
                    href={`https://explorer.cronos.org/testnet/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:text-green-300 mt-1 inline-flex items-center gap-1 transition-colors"
                  >
                    View on Explorer
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {status === 'error' && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Privacy Warning for Mixer */}
        {transaction.type === 'mix' && status === 'idle' && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">⚠️</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-200 mb-1">Important!</p>
                <p className="text-xs text-orange-300/80">
                  Make sure you have saved your mixer note securely. You will need it to withdraw your funds anonymously.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={status === 'signing' || status === 'pending'}
            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {status === 'success' ? 'Close' : 'Cancel'}
          </button>
          {status !== 'success' && (
            <button
              onClick={handleSign}
              disabled={status === 'signing' || status === 'pending' || !isConnected}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-electric-600 to-accent-600 text-white font-semibold rounded-xl hover:from-electric-500 hover:to-accent-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300 shadow-glow-sm hover:shadow-glow-md disabled:shadow-none flex items-center justify-center gap-2"
            >
              {status === 'signing' && (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing...
                </>
              )}
              {status === 'pending' && (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Confirming...
                </>
              )}
              {(status === 'idle' || status === 'error') && (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Sign Transaction
                </>
              )}
            </button>
          )}
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <div className="mt-4 text-center p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-300">⚠️ Please connect your wallet to continue</p>
          </div>
        )}
      </div>
    </div>
  );
}
