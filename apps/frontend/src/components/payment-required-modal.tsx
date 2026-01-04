'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Wallet,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, formatAddress } from '@/lib/utils';
import { toast } from 'sonner';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

export interface PaymentRequiredInfo {
  address: string;
  amount: string;
  token: string;
  network: string;
  recipient: string;
  description?: string;
}

interface PaymentRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentInfo: PaymentRequiredInfo | null;
  onPaymentComplete: () => void;
  onRetry: () => void;
}

type PaymentStatus = 'idle' | 'confirming' | 'sending' | 'waiting' | 'success' | 'error';

export function PaymentRequiredModal({
  open,
  onOpenChange,
  paymentInfo,
  onPaymentComplete,
  onRetry,
}: PaymentRequiredModalProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const { address, isConnected } = useAccount();

  const { sendTransaction, isPending: isSending } = useSendTransaction();

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  const handlePay = async () => {
    if (!paymentInfo || !isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setStatus('confirming');

      sendTransaction(
        {
          to: paymentInfo.recipient as `0x${string}`,
          value: parseEther(paymentInfo.amount),
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
            setStatus('waiting');
            toast.info('Transaction submitted', {
              description: 'Waiting for confirmation...',
            });
          },
          onError: (error) => {
            setStatus('error');
            toast.error('Transaction failed', {
              description: error.message,
            });
          },
        }
      );
    } catch (error) {
      setStatus('error');
      toast.error('Payment failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handlePayAndRetry = async () => {
    await handlePay();
  };

  const handleCopyAddress = () => {
    if (paymentInfo?.recipient) {
      navigator.clipboard.writeText(paymentInfo.recipient);
      toast.success('Address copied to clipboard');
    }
  };

  const resetAndClose = () => {
    setStatus('idle');
    setTxHash(null);
    onOpenChange(false);
  };

  // Handle successful transaction
  if (isSuccess && status === 'waiting') {
    setStatus('success');
    toast.success('Payment successful!', {
      description: 'Your request will be retried automatically.',
    });
    setTimeout(() => {
      onPaymentComplete();
      resetAndClose();
      onRetry();
    }, 2000);
  }

  if (!paymentInfo) return null;

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                Payment Required
                <Badge variant="warning">402</Badge>
              </DialogTitle>
              <DialogDescription>
                This request requires payment to proceed
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Details */}
          <div className="rounded-xl bg-secondary/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-lg font-bold text-cyan-400">
                {paymentInfo.amount} {paymentInfo.token}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <Badge variant="outline">{paymentInfo.network}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recipient</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{formatAddress(paymentInfo.recipient)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {paymentInfo.description && (
              <div className="pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">{paymentInfo.description}</span>
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <AnimatePresence mode="wait">
            {status !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-secondary/30 p-4"
              >
                <div className="flex items-center gap-3">
                  {(status === 'confirming' || status === 'sending') && (
                    <>
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      <div>
                        <p className="text-sm font-medium">Confirm in wallet</p>
                        <p className="text-xs text-muted-foreground">
                          Please confirm the transaction in your wallet
                        </p>
                      </div>
                    </>
                  )}

                  {status === 'waiting' && (
                    <>
                      <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Transaction pending</p>
                        <p className="text-xs text-muted-foreground">
                          Waiting for blockchain confirmation
                        </p>
                        <Progress value={66} className="mt-2 h-1" />
                      </div>
                    </>
                  )}

                  {status === 'success' && (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-emerald-400">Payment successful!</p>
                        <p className="text-xs text-muted-foreground">
                          Retrying original request...
                        </p>
                      </div>
                    </>
                  )}

                  {status === 'error' && (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Payment failed</p>
                        <p className="text-xs text-muted-foreground">
                          Please try again
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {txHash && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatAddress(txHash)}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wallet Status */}
          {!isConnected && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Wallet className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-400">
                Please connect your wallet to make payment
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={resetAndClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handlePayAndRetry}
            disabled={!isConnected || status === 'confirming' || status === 'sending' || status === 'waiting' || status === 'success'}
            className="w-full sm:w-auto"
            variant="glow"
          >
            {(status === 'confirming' || status === 'sending' || status === 'waiting') && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {status === 'success' && <CheckCircle2 className="h-4 w-4 mr-2" />}
            {status === 'idle' || status === 'error' ? (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay & Retry
              </>
            ) : status === 'success' ? (
              'Done!'
            ) : (
              'Processing...'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
