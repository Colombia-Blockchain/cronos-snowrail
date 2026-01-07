'use client';

import { useQuery } from '@tanstack/react-query';
import { getIntent } from '@/services';
import type { PaymentIntent } from '@cronos-x402/shared-types';

/**
 * Query key factory for individual intent
 */
export const INTENT_QUERY_KEY = (id: string) => ['intent', id] as const;

/**
 * Hook to fetch a specific payment intent by ID
 */
export function useIntent(intentId: string) {
  return useQuery({
    queryKey: INTENT_QUERY_KEY(intentId),
    queryFn: async (): Promise<PaymentIntent> => {
      const response = await getIntent(intentId);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      if (!response.data) {
        throw new Error('Intent not found');
      }
      return response.data;
    },
    enabled: !!intentId,
    staleTime: 5000,
  });
}
