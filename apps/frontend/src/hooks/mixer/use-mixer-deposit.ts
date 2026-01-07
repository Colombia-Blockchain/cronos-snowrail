'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prepareMixerDeposit } from '@/services';
import { MIXER_INFO_QUERY_KEY } from './use-mixer-info';
import type { MixerDepositResponse } from '@cronos-x402/shared-types';

/**
 * Hook to prepare mixer deposit transaction data
 * Returns TX data that the user's wallet must sign and send
 */
export function useMixerDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commitment: string): Promise<MixerDepositResponse> => {
      const response = await prepareMixerDeposit({ commitment });
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      if (!response.data) {
        throw new Error('Failed to prepare mixer deposit');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MIXER_INFO_QUERY_KEY });
    },
  });
}
