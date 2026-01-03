import { useState, useCallback } from 'react';
import { PaymentRequiredInfo } from '@/components/payment-required-modal';

interface UseX402FetchOptions {
  onPaymentRequired?: (info: PaymentRequiredInfo) => void;
}

interface FetchState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  requiresPayment: boolean;
  paymentInfo: PaymentRequiredInfo | null;
}

export function useX402Fetch<T = unknown>(options?: UseX402FetchOptions) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    isLoading: false,
    requiresPayment: false,
    paymentInfo: null,
  });

  const [pendingRequest, setPendingRequest] = useState<{
    url: string;
    options?: RequestInit;
  } | null>(null);

  const fetchWithX402 = useCallback(
    async (url: string, fetchOptions?: RequestInit): Promise<T | null> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        requiresPayment: false,
        paymentInfo: null,
      }));

      try {
        const response = await fetch(url, fetchOptions);

        // Handle x402 Payment Required
        if (response.status === 402) {
          const paymentInfo: PaymentRequiredInfo = {
            address: response.headers.get('x-payment-address') || '',
            amount: response.headers.get('x-payment-amount') || '0',
            token: response.headers.get('x-payment-token') || 'TCRO',
            network: response.headers.get('x-payment-network') || 'Cronos Testnet',
            recipient: response.headers.get('x-payment-recipient') || response.headers.get('x-payment-address') || '',
            description: `Payment required for: ${url}`,
          };

          // Try to get more info from response body
          try {
            const body = await response.json();
            if (body.payment) {
              paymentInfo.address = body.payment.address || paymentInfo.address;
              paymentInfo.amount = body.payment.amount || paymentInfo.amount;
              paymentInfo.token = body.payment.token || paymentInfo.token;
              paymentInfo.recipient = body.payment.recipient || paymentInfo.recipient;
              paymentInfo.description = body.message || paymentInfo.description;
            }
          } catch {
            // Body might not be JSON, that's okay
          }

          setState((prev) => ({
            ...prev,
            isLoading: false,
            requiresPayment: true,
            paymentInfo,
          }));

          // Store pending request for retry
          setPendingRequest({ url, options: fetchOptions });

          // Notify parent if callback provided
          options?.onPaymentRequired?.(paymentInfo);

          return null;
        }

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        setState({
          data,
          error: null,
          isLoading: false,
          requiresPayment: false,
          paymentInfo: null,
        });

        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        setState((prev) => ({
          ...prev,
          error: err,
          isLoading: false,
        }));
        return null;
      }
    },
    [options]
  );

  const retry = useCallback(async () => {
    if (!pendingRequest) return null;
    return fetchWithX402(pendingRequest.url, pendingRequest.options);
  }, [pendingRequest, fetchWithX402]);

  const clearPaymentRequired = useCallback(() => {
    setState((prev) => ({
      ...prev,
      requiresPayment: false,
      paymentInfo: null,
    }));
    setPendingRequest(null);
  }, []);

  return {
    ...state,
    fetch: fetchWithX402,
    retry,
    clearPaymentRequired,
  };
}
