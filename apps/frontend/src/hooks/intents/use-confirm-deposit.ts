'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmIntentDeposit } from '@/services';
import { INTENTS_QUERY_KEY } from './use-intents';
import { INTENT_QUERY_KEY } from './use-intent';
import type { IntentConfirmDepositResponse } from '@cronos-x402/shared-types';

interface ConfirmDepositParams {
  intentId: string;
  txHash: string;
}

/**
 * Hook to confirm an intent deposit after frontend executes the TX
 * Updates intent status to 'funded'
 */
export function useConfirmDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ intentId, txHash }: ConfirmDepositParams): Promise<IntentConfirmDepositResponse> => {
      const response = await confirmIntentDeposit(intentId, { txHash });
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      if (!response.data) {
        throw new Error('Failed to confirm deposit');
      }
      return response.data;
    },
    onSuccess: (_data: IntentConfirmDepositResponse, { intentId }: ConfirmDepositParams) => {
      queryClient.invalidateQueries({ queryKey: INTENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INTENT_QUERY_KEY(intentId) });
    },
  });
}
