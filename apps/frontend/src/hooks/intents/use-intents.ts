'use client';

import { useQuery } from '@tanstack/react-query';
import { listIntents } from '@/services';
import type { PaymentIntent } from '@cronos-x402/shared-types';

/**
 * Query key for intents list
 */
export const INTENTS_QUERY_KEY = ['intents'] as const;

/**
 * Hook to fetch all payment intents
 * Automatically refetches every 5 seconds
 */
export function useIntents() {
  return useQuery({
    queryKey: INTENTS_QUERY_KEY,
    queryFn: async (): Promise<PaymentIntent[]> => {
      const response = await listIntents();
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      return response.data ?? [];
    },
    refetchInterval: 5000,
    staleTime: 2000,
  });
}
