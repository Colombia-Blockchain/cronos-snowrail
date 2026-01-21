// ============================================================
// x402 Protocol Types for Backend
// HTTP 402 Payment Required Handshake
// ============================================================

/**
 * Payment requirements sent in 402 challenge response
 * Following Coinbase x402 specification
 */
export interface X402PaymentRequirements {
  scheme: 'exact' | 'eip-3009';
  network: string;
  maxAmountRequired: string;
  resource: string;
  description?: string;
  payTo: string;
  maxTimeoutSeconds?: number;
  asset?: string;
  extra?: Record<string, unknown>;
}

/**
 * Challenge response body for 402 Payment Required
 */
export interface X402ChallengeResponse {
  x402Version: number;
  accepts: X402PaymentRequirements[];
  error?: string;
}

/**
 * EIP-3009 payload for transferWithAuthorization
 */
export interface X402EIP3009Payload {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

/**
 * Payment signature (v, r, s)
 */
export interface X402PaymentSignature {
  v: number;
  r: string;
  s: string;
}

/**
 * Payment token sent by client in X-Payment header
 */
export interface X402PaymentToken {
  scheme: string;
  network: string;
  payload: X402EIP3009Payload;
  signature: X402PaymentSignature;
}

/**
 * Verification result from facilitator
 */
export interface X402VerifyResult {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
  paymentToken?: X402PaymentToken;
}

/**
 * Settlement result from facilitator
 */
export interface X402SettleResult {
  success: boolean;
  transactionHash?: string;
  network: string;
  settledAmount?: string;
  error?: string;
}

/**
 * x402 middleware configuration
 */
export interface X402MiddlewareConfig {
  enabled: boolean;
  facilitatorUrl: string;
  challengeRecipient: string;
  challengeAmount: string;
  challengeAsset: string;
  network: string;
  scheme: 'exact' | 'eip-3009';
  timeoutSeconds: number;
}

/**
 * Headers used in x402 protocol
 */
export const X402_HEADERS = {
  /** Client sends payment proof */
  PAYMENT: 'x-payment',
  /** Server sends payment response/receipt */
  PAYMENT_RESPONSE: 'x-payment-response',
} as const;
