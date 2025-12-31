'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchIntents, PaymentIntent } from '@/services/api';

export function useIntents() {
  return useQuery({
    queryKey: ['intents'],
    queryFn: fetchIntents,
    refetchInterval: 5000,
  });
}
