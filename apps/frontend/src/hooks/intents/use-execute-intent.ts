'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executeIntent } from '@/services';
import { INTENTS_QUERY_KEY } from './use-intents';
import { INTENT_QUERY_KEY } from './use-intent';
import type { IntentExecuteResponse } from '@cronos-x402/shared-types';

/**
 * Hook to execute a funded payment intent
 * Requires intent to be in 'funded' status
 */
export function useExecuteIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (intentId: string): Promise<IntentExecuteResponse> => {
      const response = await executeIntent(intentId);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      if (!response.data) {
        throw new Error('Failed to execute intent');
      }
      return response.data;
    },
    onSuccess: (_data: IntentExecuteResponse, intentId: string) => {
      queryClient.invalidateQueries({ queryKey: INTENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INTENT_QUERY_KEY(intentId) });
    },
  });
}
