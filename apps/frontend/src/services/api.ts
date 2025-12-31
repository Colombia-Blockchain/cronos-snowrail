const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreateIntentRequest {
  amount: string;
  currency: string;
  recipient: string;
  condition: {
    type: 'manual' | 'price-below';
    value: string;
  };
}

export interface PaymentIntent {
  intentId: string;
  amount: string;
  currency: string;
  recipient: string;
  condition: { type: string; value: string };
  status: 'pending' | 'executed' | 'failed';
  createdAt: string;
  executedTxHash?: string;
}

export async function createIntent(data: CreateIntentRequest): Promise<PaymentIntent> {
  const response = await fetch(`${API_URL}/api/intents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create intent');
  }

  const result = await response.json();
  return result.data;
}

export async function fetchIntents(): Promise<PaymentIntent[]> {
  const response = await fetch(`${API_URL}/api/intents`);
  if (!response.ok) {
    throw new Error('Failed to fetch intents');
  }
  const result = await response.json();
  return result.data || [];
}

export async function triggerAgent(intentId: string): Promise<{ txHash?: string; reason?: string }> {
  const response = await fetch(`${API_URL}/api/agent/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intentId }),
  });

  const result = await response.json();

  if (result.status === 'success') {
    return { txHash: result.data?.txHash };
  }

  if (result.status === 'warning') {
    return { reason: result.message };
  }

  throw new Error(result.message || 'Failed to trigger agent');
}
