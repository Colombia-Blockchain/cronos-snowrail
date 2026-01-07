'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prepareMixerWithdraw } from '@/services';
import { MIXER_INFO_QUERY_KEY } from './use-mixer-info';
import type { MixerWithdrawRequest, MixerWithdrawResponse } from '@cronos-x402/shared-types';

/**
 * Hook to prepare mixer withdrawal transaction data
 * Generates ZK proof and returns TX data for frontend to execute
 */
export function useMixerWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MixerWithdrawRequest): Promise<MixerWithdrawResponse> => {
      const response = await prepareMixerWithdraw(data);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      if (!response.data) {
        throw new Error('Failed to prepare mixer withdrawal');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MIXER_INFO_QUERY_KEY });
    },
  });
}
