'use client';

import { useMutation } from '@tanstack/react-query';
import { simulateMixerWithdraw } from '@/services';
import type { MixerWithdrawRequest, MixerSimulateWithdrawResponse } from '@cronos-x402/shared-types';

/**
 * Hook to simulate a mixer withdrawal without executing
 * Useful for testing if withdrawal will succeed before committing
 */
export function useSimulateWithdraw() {
  return useMutation({
    mutationFn: async (data: MixerWithdrawRequest): Promise<MixerSimulateWithdrawResponse> => {
      const response = await simulateMixerWithdraw(data);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      if (!response.data) {
        throw new Error('Failed to simulate withdrawal');
      }
      return response.data;
    },
  });
}
