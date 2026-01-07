/**
 * Services Index
 * Re-export all API services and types for convenient imports
 */

// API Client
export { api, apiRequest, ApiError, getApiBaseUrl } from './api-client';

// Intent Service
export {
  createIntent,
  listIntents,
  getIntent,
  prepareIntentDeposit,
  confirmIntentDeposit,
  executeIntent,
} from './intent-service';

// Mixer Service
export {
  getMixerInfo,
  generateNote,
  prepareMixerDeposit,
  confirmMixerDeposit,
  prepareMixerWithdraw,
  simulateMixerWithdraw,
} from './mixer-service';

// Agent Service
export { triggerAgent, triggerAgentForIntent } from './agent-service';

// Re-export commonly used types for convenience
export type {
  // Common
  ApiResponse,
  TransactionData,
  Currency,
  ApiCode,
  // Intent types
  PaymentIntent,
  PaymentCondition,
  IntentStatus,
  DepositInfo,
  CreateIntentRequest,
  CreateIntentResponse,
  IntentDepositResponse,
  IntentConfirmDepositRequest,
  IntentConfirmDepositResponse,
  IntentExecuteResponse,
  PaymentIntentWithDecision,
  // Agent types
  AgentDecision,
  AgentDecisionType,
  TriggerAgentRequest,
  TriggerAgentResponse,
  // Mixer types
  DepositNote,
  MixerInfo,
  MixerOnChainInfo,
  MixerPrivacyModel,
  GenerateNoteResponse,
  MixerDepositRequest,
  MixerDepositResponse,
  MixerConfirmDepositRequest,
  MixerConfirmDepositResponse,
  MixerWithdrawRequest,
  MixerWithdrawResponse,
  MixerSimulateWithdrawResponse,
} from '@cronos-x402/shared-types';
