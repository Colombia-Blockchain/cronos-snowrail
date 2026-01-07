'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prepareIntentDeposit } from '@/services';
import { INTENTS_QUERY_KEY } from './use-intents';
import { INTENT_QUERY_KEY } from './use-intent';
import type { IntentDepositResponse } from '@cronos-x402/shared-types';

/**
 * Hook to prepare deposit transaction data for an intent
 * Returns TX data that the user's wallet must sign and send
 */
export function useDepositIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (intentId: string): Promise<IntentDepositResponse> => {
      const response = await prepareIntentDeposit(intentId);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      if (!response.data) {
        throw new Error('Failed to prepare deposit');
      }
      return response.data;
    },
    onSuccess: (_data: IntentDepositResponse, intentId: string) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: INTENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INTENT_QUERY_KEY(intentId) });
    },
  });
}
