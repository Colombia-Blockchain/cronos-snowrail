'use client';

import { useMutation } from '@tanstack/react-query';
import { generateNote } from '@/services';
import type { GenerateNoteResponse } from '@cronos-x402/shared-types';

/**
 * Hook to generate a new deposit note
 * WARNING: User MUST save this note securely - it's required for withdrawal
 */
export function useGenerateNote() {
  return useMutation({
    mutationFn: async (): Promise<GenerateNoteResponse> => {
      const response = await generateNote();
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      if (!response.data) {
        throw new Error('Failed to generate note');
      }
      return response.data;
    },
  });
}
