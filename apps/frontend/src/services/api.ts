/**
 * Legacy API module
 * @deprecated Use individual services from '@/services' instead
 *
 * This file is kept for backwards compatibility with existing components.
 * New code should import from '@/services' directly:
 *
 * import { createIntent, listIntents, triggerAgentForIntent } from '@/services';
 */

import { triggerAgentForIntent } from './agent-service';
import type { ApiResponse, TriggerAgentResponse } from '@cronos-x402/shared-types';

// Re-export everything from the new services for backwards compatibility
export {
  // Intent functions
  createIntent,
  listIntents,
  getIntent,
  prepareIntentDeposit,
  confirmIntentDeposit,
  executeIntent,
  // Mixer functions
  getMixerInfo,
  generateNote,
  prepareMixerDeposit,
  confirmMixerDeposit,
  prepareMixerWithdraw,
  simulateMixerWithdraw,
  // Agent functions
  triggerAgentForIntent,
  // API client
  api,
  ApiError,
  getApiBaseUrl,
} from './index';

// Re-export types
export type {
  ApiResponse,
  PaymentIntent,
  CreateIntentRequest,
  AgentDecision,
  DepositNote,
  MixerInfo,
  Currency,
} from './index';

/**
 * @deprecated Use `listIntents` instead
 */
export { listIntents as fetchIntents } from './index';

/**
 * Legacy triggerAgent function that accepts a string intentId
 * @deprecated Use `triggerAgentForIntent` from '@/services' instead
 */
export async function triggerAgent(
  intentId: string
): Promise<{ txHash?: string; reason?: string }> {
  const response: ApiResponse<TriggerAgentResponse> = await triggerAgentForIntent(intentId);

  if (response.status === 'success' && response.data) {
    return { txHash: response.data.txHash };
  }

  if (response.status === 'warning') {
    return { reason: response.message };
  }

  return { reason: response.message };
}
