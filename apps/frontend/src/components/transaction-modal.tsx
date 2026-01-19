'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

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

const SETTLEMENT_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'intentId', type: 'bytes32' },
      { internalType: 'address', name: 'recipient', type: 'address' },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
];

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

  const { writeContract, data: hash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  if (!isOpen || !transaction) return null;

  const handleSign = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setStatus('signing');
      setError(null);

      const abi = transaction.type === 'mix' || transaction.type === 'withdraw' ? MIXER_ABI : SETTLEMENT_ABI;

      if (transaction.type === 'deposit') {
        // Deposit to settlement contract
        await writeContract({
          address: transaction.contractAddress as `0x${string}`,
          abi: SETTLEMENT_ABI,
          functionName: 'deposit',
          args: [
            transaction.params.intentId as `0x${string}`,
            transaction.params.recipient as `0x${string}`,
          ],
          value: parseEther(transaction.amount),
        });

        setStatus('pending');
      } else if (transaction.type === 'mix') {
        // Deposit to mixer
        await writeContract({
          address: transaction.contractAddress as `0x${string}`,
          abi: MIXER_ABI,
          functionName: 'deposit',
          args: [transaction.params.commitment as `0x${string}`],
          value: parseEther(transaction.amount),
        });

        setStatus('pending');
      } else if (transaction.type === 'withdraw') {
        // Withdraw from mixer
        await writeContract({
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

        setStatus('pending');
      }
    } catch (err: any) {
      console.error('Transaction error:', err);
      setError(err.message || 'Transaction failed');
      setStatus('error');
    }
  };

  // Update status based on confirmation
  if (isConfirmed && status === 'pending') {
    setStatus('success');
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {transaction.type === 'deposit' && '📥 Confirm Deposit'}
            {transaction.type === 'mix' && '🎭 Confirm Mixer Deposit'}
            {transaction.type === 'withdraw' && '📤 Confirm Withdrawal'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={status === 'signing' || status === 'pending'}
          >
            ✕
          </button>
        </div>

        {/* Transaction Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Type:</span>
            <span className="font-semibold text-gray-900 capitalize">{transaction.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold text-gray-900">{transaction.amount} CRO</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Contract:</span>
            <span className="font-mono text-xs text-gray-900">
              {transaction.contractAddress.slice(0, 10)}...{transaction.contractAddress.slice(-8)}
            </span>
          </div>
          {transaction.intentId && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Intent ID:</span>
              <span className="font-mono text-xs text-gray-900">{transaction.intentId}</span>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {status === 'signing' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">⏳ Please sign the transaction in your wallet...</p>
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">⏳ Transaction pending confirmation...</p>
            {hash && (
              <p className="text-xs text-blue-600 mt-1 font-mono">
                TX: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            )}
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-800">✅ Transaction confirmed!</p>
            {hash && (
              <a
                href={`https://explorer.cronos.org/testnet/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 hover:underline mt-1 block"
              >
                View on Explorer →
              </a>
            )}
          </div>
        )}

        {status === 'error' && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Privacy Warning for Mixer */}
        {transaction.type === 'mix' && status === 'idle' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <p className="text-sm font-semibold text-orange-900 mb-1">⚠️ Important!</p>
            <p className="text-xs text-orange-800">
              Make sure you have saved your mixer note securely. You will need it to withdraw your funds anonymously.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={status === 'signing' || status === 'pending'}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'success' ? 'Close' : 'Cancel'}
          </button>
          {status !== 'success' && (
            <button
              onClick={handleSign}
              disabled={status === 'signing' || status === 'pending' || !isConnected}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {status === 'signing' && 'Signing...'}
              {status === 'pending' && 'Confirming...'}
              {(status === 'idle' || status === 'error') && 'Sign Transaction'}
            </button>
          )}
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <div className="mt-4 text-center">
            <p className="text-sm text-red-600">⚠️ Please connect your wallet to continue</p>
          </div>
        )}
      </div>
    </div>
  );
}
