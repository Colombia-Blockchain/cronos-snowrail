/**
 * Mixer Service
 * API functions for ZK privacy mixer operations
 */

import { api } from './api-client';
import type {
  ApiResponse,
  MixerInfo,
  GenerateNoteResponse,
  MixerDepositRequest,
  MixerDepositResponse,
  MixerConfirmDepositRequest,
  MixerConfirmDepositResponse,
  MixerWithdrawRequest,
  MixerWithdrawResponse,
  MixerSimulateWithdrawResponse,
} from '@cronos-x402/shared-types';

/**
 * Get mixer information and statistics
 */
export async function getMixerInfo(): Promise<ApiResponse<MixerInfo>> {
  return api.get<MixerInfo>('/api/mixer/info');
}

/**
 * Generate a new deposit note
 * WARNING: User MUST save this note securely - it's required for withdrawal
 */
export async function generateNote(): Promise<ApiResponse<GenerateNoteResponse>> {
  return api.post<GenerateNoteResponse>('/api/mixer/generate-note');
}

/**
 * Prepare mixer deposit transaction data
 * Returns TX data that the user's wallet must sign and send
 */
export async function prepareMixerDeposit(
  data: MixerDepositRequest
): Promise<ApiResponse<MixerDepositResponse>> {
  return api.post<MixerDepositResponse>('/api/mixer/deposit', data);
}

/**
 * Confirm mixer deposit after frontend executes the transaction
 * Records the deposit in the local Merkle tree
 */
export async function confirmMixerDeposit(
  data: MixerConfirmDepositRequest
): Promise<ApiResponse<MixerConfirmDepositResponse>> {
  return api.post<MixerConfirmDepositResponse>('/api/mixer/confirm-deposit', data);
}

/**
 * Prepare mixer withdrawal transaction data
 * Generates ZK proof and returns TX data for frontend to execute
 */
export async function prepareMixerWithdraw(
  data: MixerWithdrawRequest
): Promise<ApiResponse<MixerWithdrawResponse>> {
  return api.post<MixerWithdrawResponse>('/api/mixer/withdraw', data);
}

/**
 * Simulate withdrawal without executing
 * Useful for testing if withdrawal will succeed
 */
export async function simulateMixerWithdraw(
  data: MixerWithdrawRequest
): Promise<ApiResponse<MixerSimulateWithdrawResponse>> {
  return api.post<MixerSimulateWithdrawResponse>('/api/mixer/simulate-withdraw', data);
}
