'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmMixerDeposit } from '@/services';
import { MIXER_INFO_QUERY_KEY } from './use-mixer-info';
import type { MixerConfirmDepositResponse } from '@cronos-x402/shared-types';

interface ConfirmMixerDepositParams {
  txHash: string;
  commitment: string;
}

/**
 * Hook to confirm a mixer deposit after frontend executes the TX
 * Records the deposit in the local Merkle tree and returns the leafIndex
 */
export function useConfirmMixerDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ txHash, commitment }: ConfirmMixerDepositParams): Promise<MixerConfirmDepositResponse> => {
      const response = await confirmMixerDeposit({ txHash, commitment });
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      if (!response.data) {
        throw new Error('Failed to confirm mixer deposit');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MIXER_INFO_QUERY_KEY });
    },
  });
}
