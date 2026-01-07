'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerAgentForIntent } from '@/services';
import { INTENTS_QUERY_KEY } from './use-intents';
import { INTENT_QUERY_KEY } from './use-intent';
import type { TriggerAgentResponse } from '@cronos-x402/shared-types';

/**
 * Hook to trigger the AI agent to evaluate and potentially execute an intent
 * Agent will check conditions and decide to EXECUTE or SKIP
 */
export function useTriggerAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (intentId: string): Promise<TriggerAgentResponse> => {
      const response = await triggerAgentForIntent(intentId);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      if (!response.data) {
        throw new Error('Failed to trigger agent');
      }
      return response.data;
    },
    onSuccess: (_data: TriggerAgentResponse, intentId: string) => {
      queryClient.invalidateQueries({ queryKey: INTENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INTENT_QUERY_KEY(intentId) });
    },
  });
}
