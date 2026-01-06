// x402 Protocol Types for Facilitator API

export interface ApiResponse<T = unknown> {
  status: 'success' | 'warning' | 'error';
  code: string;
  message: string;
  data?: T;
  details?: Record<string, unknown>;
}

// Health & Info Types
export interface HealthData {
  version: string;
  uptime: number;
  timestamp: string;
  network: string;
  chainId: number;
}

export interface VersionData {
  version: string;
  x402Protocol: string;
  apiVersion: string;
  buildInfo: {
    name: string;
    network: string;
  };
}

// Supported Schemes Types
export interface PaymentScheme {
  scheme: string;
  network: string;
  chainId: number;
  token: string;
  tokenAddress: string | null;
  description: string;
}

export interface SupportedData {
  schemes: PaymentScheme[];
  networks: NetworkInfo[];
  tokens: TokenInfo[];
}

export interface NetworkInfo {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string | null;
  decimals: number;
  network: string;
}

// x402 Verification Types
export interface VerifyRequest {
  paymentHeader: string;
  paymentRequirements: PaymentRequirements;
}

export interface PaymentRequirements {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description?: string;
  mimeType?: string;
  payTo: string;
  maxTimeoutSeconds?: number;
  asset?: string;
  extra?: Record<string, unknown>;
}

export interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
  paymentToken?: PaymentToken;
}

export interface PaymentToken {
  scheme: string;
  network: string;
  payload: EIP3009Payload;
  signature: PaymentSignature;
}

export interface EIP3009Payload {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

export interface PaymentSignature {
  v: number;
  r: string;
  s: string;
}

// x402 Settlement Types
export interface SettleRequest {
  paymentHeader: string;
  paymentRequirements: PaymentRequirements;
}

export interface SettleResponse {
  success: boolean;
  transactionHash?: string;
  network: string;
  settledAmount?: string;
  error?: string;
}

// Schema Types (for GET endpoints)
export interface VerifySchema {
  $schema: string;
  title: string;
  description: string;
  type: string;
  properties: Record<string, SchemaProperty>;
  required: string[];
}

export interface SettleSchema {
  $schema: string;
  title: string;
  description: string;
  type: string;
  properties: Record<string, SchemaProperty>;
  required: string[];
}

export interface SchemaProperty {
  type: string;
  description: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}
