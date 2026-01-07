'use client';

import { useQuery } from '@tanstack/react-query';
import { getMixerInfo } from '@/services';
import type { MixerInfo } from '@cronos-x402/shared-types';

/**
 * Query key for mixer info
 */
export const MIXER_INFO_QUERY_KEY = ['mixer', 'info'] as const;

/**
 * Hook to fetch mixer information and statistics
 * Automatically refetches every 10 seconds
 */
export function useMixerInfo() {
  return useQuery({
    queryKey: MIXER_INFO_QUERY_KEY,
    queryFn: async (): Promise<MixerInfo> => {
      const response = await getMixerInfo();
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      if (!response.data) {
        throw new Error('Failed to fetch mixer info');
      }
      return response.data;
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
