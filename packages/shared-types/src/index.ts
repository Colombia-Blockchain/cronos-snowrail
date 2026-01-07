// ============================================================
// Cronos Snow Rail - Shared Types
// Complete type definitions for frontend-backend integration
// ============================================================

// ============ COMMON TYPES ============

/**
 * Standard transaction data for frontend wallet signing
 */
export interface TransactionData {
  to: string;
  data: string;
  value: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  status: 'success' | 'warning' | 'error';
  code: string;
  message: string;
  data?: T;
  details?: Record<string, unknown>;
}

/**
 * Supported currencies
 * - CRO: Native Cronos token
 * - WCRO: Wrapped CRO (ERC-20)
 * - USDC: USD Coin stablecoin
 * - USDT: Tether stablecoin
 */
export type Currency = 'CRO' | 'WCRO' | 'USDC' | 'USDT';

// ============ PAYMENT INTENT TYPES ============

/**
 * Intent lifecycle status
 */
export type IntentStatus = 'pending' | 'funded' | 'executed' | 'failed';

/**
 * Condition types for payment execution
 */
export type ConditionType = 'manual' | 'price-below';

/**
 * Payment condition configuration
 */
export interface PaymentCondition {
  type: ConditionType;
  value: string;
}

/**
 * Deposit information for funded intents
 */
export interface DepositInfo {
  txHash: string;
  amount: string;
  confirmedAt: string;
}

/**
 * Core payment intent type
 */
export interface PaymentIntent {
  intentId: string;
  amount: string;
  currency: string;
  recipient: string;
  condition: PaymentCondition;
  status: IntentStatus;
  createdAt: string;
  txHash?: string;
  depositTxHash?: string;
  executedTxHash?: string;
  deposit?: DepositInfo;
}

/**
 * Request to create a new payment intent
 */
export interface CreateIntentRequest {
  amount: string;
  currency: Currency;
  recipient: string;
  condition: PaymentCondition;
}

/**
 * Response when creating an intent (includes agent pre-evaluation)
 */
export interface CreateIntentResponse extends PaymentIntent {
  agentDecision?: AgentDecision;
}

/**
 * Response for preparing intent deposit
 */
export interface IntentDepositResponse {
  tx: TransactionData;
  intentId: string;
  amount: string;
  instructions: string[];
}

/**
 * Request to confirm an intent deposit
 */
export interface IntentConfirmDepositRequest {
  txHash: string;
}

/**
 * Response after confirming intent deposit
 */
export interface IntentConfirmDepositResponse {
  intentId: string;
  txHash: string;
  amount: string;
  status: IntentStatus;
  nextStep: string;
}

/**
 * Response for intent execution
 */
export interface IntentExecuteResponse extends PaymentIntent {
  agentDecision: AgentDecision;
}

// ============ AGENT TYPES ============

/**
 * Agent decision result
 */
export type AgentDecisionType = 'EXECUTE' | 'SKIP';

/**
 * Agent decision with reasoning
 */
export interface AgentDecision {
  decision: AgentDecisionType;
  reason: string;
  proof?: string;
  verificationStatus?: {
    checked: boolean;
    verified: boolean;
  };
}

/**
 * Request to trigger agent evaluation
 */
export interface TriggerAgentRequest {
  intentId: string;
}

/**
 * Response from agent trigger
 */
export interface TriggerAgentResponse {
  intentId: string;
  amount: string;
  currency: string;
  recipient: string;
  condition: PaymentCondition;
  status: IntentStatus;
  txHash?: string;
  agentDecision: AgentDecision;
}

// ============ MIXER TYPES ============

/**
 * Deposit note - MUST be saved by user for withdrawal
 */
export interface DepositNote {
  nullifier: string;
  secret: string;
  commitment: string;
  nullifierHash: string;
  leafIndex?: number;
  depositTxHash?: string;
}

/**
 * On-chain mixer information
 */
export interface MixerOnChainInfo {
  contractAddress: string;
  currentRoot: string;
  depositCount: number;
  denomination: string;
}

/**
 * Privacy model description
 */
export interface MixerPrivacyModel {
  description: string;
  anonymitySet: number;
}

/**
 * Complete mixer info response
 */
export interface MixerInfo {
  denomination: string;
  localDepositCount: number;
  localRoot: string;
  onChain: MixerOnChainInfo | null;
  privacyModel: MixerPrivacyModel;
}

/**
 * Response from generating a new deposit note
 */
export interface GenerateNoteResponse {
  note: DepositNote;
  warning: string;
  instructions: string[];
}

/**
 * Request to prepare mixer deposit
 */
export interface MixerDepositRequest {
  commitment: string;
}

/**
 * Response with deposit transaction data
 */
export interface MixerDepositResponse {
  tx: TransactionData;
  commitment: string;
  amount: string;
  instructions: string[];
}

/**
 * Request to confirm mixer deposit
 */
export interface MixerConfirmDepositRequest {
  txHash: string;
  commitment: string;
}

/**
 * Response after confirming mixer deposit
 */
export interface MixerConfirmDepositResponse {
  txHash: string;
  leafIndex: number;
  commitment: string;
  instructions: string[];
}

/**
 * Request to prepare mixer withdrawal
 */
export interface MixerWithdrawRequest {
  note: DepositNote;
  leafIndex: number;
  recipient: string;
  relayer?: string;
  fee?: string;
}

/**
 * Response with withdrawal transaction data
 */
export interface MixerWithdrawResponse {
  tx: TransactionData;
  recipient: string;
  amount: string;
  privacy: string;
  instructions: string[];
}

/**
 * Response from withdrawal simulation
 */
export interface MixerSimulateWithdrawResponse {
  proof: string;
  root: string;
  nullifierHash: string;
  recipient: string;
  relayer: string;
  fee: string;
  canExecute: boolean;
}

// ============ ERROR CODES ============

/**
 * All possible API error/success codes
 */
export enum ApiCode {
  // Health
  HEALTH_CHECK_OK = 'HEALTH_CHECK_OK',
  READINESS_CHECK_OK = 'READINESS_CHECK_OK',

  // Intent success codes
  INTENT_CREATED = 'INTENT_CREATED',
  INTENT_RETRIEVED = 'INTENT_RETRIEVED',
  INTENTS_RETRIEVED = 'INTENTS_RETRIEVED',
  INTENT_EXECUTED = 'INTENT_EXECUTED',
  INTENT_SKIPPED = 'INTENT_SKIPPED',
  DEPOSIT_TX_PREPARED = 'DEPOSIT_TX_PREPARED',
  DEPOSIT_CONFIRMED = 'DEPOSIT_CONFIRMED',

  // Intent error codes
  INTENT_NOT_FOUND = 'INTENT_NOT_FOUND',
  INTENT_NOT_FUNDED = 'INTENT_NOT_FUNDED',
  INTENT_ALREADY_COMPLETED = 'INTENT_ALREADY_COMPLETED',
  ALREADY_FUNDED = 'ALREADY_FUNDED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  EXECUTION_FAILED = 'EXECUTION_FAILED',

  // Agent codes
  AGENT_EXECUTED = 'AGENT_EXECUTED',
  AGENT_SKIPPED = 'AGENT_SKIPPED',

  // Mixer success codes
  MIXER_INFO = 'MIXER_INFO',
  NOTE_GENERATED = 'NOTE_GENERATED',
  WITHDRAW_TX_PREPARED = 'WITHDRAW_TX_PREPARED',
  SIMULATION_SUCCESS = 'SIMULATION_SUCCESS',

  // Mixer error codes
  MIXER_NOT_DEPLOYED = 'MIXER_NOT_DEPLOYED',
  COMMITMENT_REQUIRED = 'COMMITMENT_REQUIRED',
  INVALID_NOTE = 'INVALID_NOTE',
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  ALREADY_WITHDRAWN = 'ALREADY_WITHDRAWN',
  INVALID_ROOT = 'INVALID_ROOT',
  TX_NOT_FOUND = 'TX_NOT_FOUND',
  TX_FAILED = 'TX_FAILED',
  DEPOSIT_EVENT_NOT_FOUND = 'DEPOSIT_EVENT_NOT_FOUND',

  // Common errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  MISSING_PARAMS = 'MISSING_PARAMS',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

// ============ UTILITY TYPES ============

/**
 * Extract data type from ApiResponse
 */
export type ApiResponseData<T> = T extends ApiResponse<infer U> ? U : never;

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Intent with optional agent decision (used in list views)
 */
export type PaymentIntentWithDecision = PaymentIntent & {
  agentDecision?: AgentDecision;
};
