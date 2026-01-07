/**
 * Intent Service
 * API functions for payment intent operations
 */

import { api } from './api-client';
import type {
  ApiResponse,
  PaymentIntent,
  CreateIntentRequest,
  CreateIntentResponse,
  IntentDepositResponse,
  IntentConfirmDepositRequest,
  IntentConfirmDepositResponse,
  IntentExecuteResponse,
} from '@cronos-x402/shared-types';

/**
 * Create a new payment intent
 */
export async function createIntent(
  data: CreateIntentRequest
): Promise<ApiResponse<CreateIntentResponse>> {
  return api.post<CreateIntentResponse>('/api/intents', data);
}

/**
 * List all payment intents
 */
export async function listIntents(): Promise<ApiResponse<PaymentIntent[]>> {
  return api.get<PaymentIntent[]>('/api/intents');
}

/**
 * Get a specific payment intent by ID
 */
export async function getIntent(
  intentId: string
): Promise<ApiResponse<PaymentIntent>> {
  return api.get<PaymentIntent>(`/api/intents/${intentId}`);
}

/**
 * Prepare deposit transaction data for frontend wallet
 * Returns TX data that the user's wallet must sign and send
 */
export async function prepareIntentDeposit(
  intentId: string
): Promise<ApiResponse<IntentDepositResponse>> {
  return api.post<IntentDepositResponse>(`/api/intents/${intentId}/deposit`);
}

/**
 * Confirm deposit after frontend executes the transaction
 * Updates intent status to 'funded'
 */
export async function confirmIntentDeposit(
  intentId: string,
  data: IntentConfirmDepositRequest
): Promise<ApiResponse<IntentConfirmDepositResponse>> {
  return api.post<IntentConfirmDepositResponse>(
    `/api/intents/${intentId}/confirm-deposit`,
    data
  );
}

/**
 * Execute a funded payment intent
 * Requires intent to be in 'funded' status
 */
export async function executeIntent(
  intentId: string
): Promise<ApiResponse<IntentExecuteResponse>> {
  return api.post<IntentExecuteResponse>(`/api/intents/${intentId}/execute`);
}
