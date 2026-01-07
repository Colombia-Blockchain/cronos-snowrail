'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createIntent } from '@/services';
import { INTENTS_QUERY_KEY } from './use-intents';
import type { CreateIntentRequest, CreateIntentResponse } from '@cronos-x402/shared-types';

/**
 * Hook to create a new payment intent
 * Automatically invalidates the intents list on success
 */
export function useCreateIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIntentRequest): Promise<CreateIntentResponse> => {
      const response = await createIntent(data);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      if (!response.data) {
        throw new Error('Failed to create intent');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTENTS_QUERY_KEY });
    },
  });
}
