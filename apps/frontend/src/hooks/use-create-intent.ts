'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createIntent, CreateIntentRequest } from '@/services/api';

export function useCreateIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIntentRequest) => createIntent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intents'] });
    },
  });
}
