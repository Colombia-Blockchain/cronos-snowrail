'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerAgent } from '@/services/api';

export function useTriggerAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (intentId: string) => triggerAgent(intentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intents'] });
    },
  });
}
