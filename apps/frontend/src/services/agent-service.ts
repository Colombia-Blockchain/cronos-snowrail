/**
 * Agent Service
 * API functions for AI agent operations
 */

import { api } from './api-client';
import type {
  ApiResponse,
  TriggerAgentRequest,
  TriggerAgentResponse,
} from '@cronos-x402/shared-types';

/**
 * Trigger agent to evaluate and potentially execute a payment intent
 * Agent will check conditions and decide to EXECUTE or SKIP
 */
export async function triggerAgent(
  data: TriggerAgentRequest
): Promise<ApiResponse<TriggerAgentResponse>> {
  return api.post<TriggerAgentResponse>('/api/agent/trigger', data);
}

/**
 * Convenience function to trigger agent by intent ID
 */
export async function triggerAgentForIntent(
  intentId: string
): Promise<ApiResponse<TriggerAgentResponse>> {
  return triggerAgent({ intentId });
}
