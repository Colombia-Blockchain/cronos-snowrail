// ============================================================
// x402 Facilitator Client
// Connects backend to facilitator for payment verification
// ============================================================

import type { FastifyBaseLogger } from 'fastify';
import type {
  X402PaymentRequirements,
  X402VerifyResult,
  X402SettleResult,
  X402MiddlewareConfig,
} from './types';

/**
 * Client for communicating with x402 Facilitator service
 */
export class X402FacilitatorClient {
  private config: X402MiddlewareConfig;
  private logger: FastifyBaseLogger;

  constructor(config: X402MiddlewareConfig, logger: FastifyBaseLogger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Verify a payment header against requirements
   */
  async verify(
    paymentHeader: string,
    paymentRequirements: X402PaymentRequirements
  ): Promise<X402VerifyResult> {
    const url = `${this.config.facilitatorUrl}/verify`;

    this.logger.info(
      { url, scheme: paymentRequirements.scheme },
      '[X402Client] Verifying payment with facilitator'
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentHeader,
          paymentRequirements,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        this.logger.info(
          { payer: data.data?.payer },
          '[X402Client] Payment verified successfully'
        );
        return data.data as X402VerifyResult;
      }

      this.logger.warn(
        { code: data.code, reason: data.message },
        '[X402Client] Payment verification failed'
      );

      return {
        isValid: false,
        invalidReason: data.message || 'Verification failed',
      };
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : error },
        '[X402Client] Failed to connect to facilitator'
      );

      return {
        isValid: false,
        invalidReason: 'Facilitator unavailable',
      };
    }
  }

  /**
   * Settle a payment (execute the transfer)
   */
  async settle(
    paymentHeader: string,
    paymentRequirements: X402PaymentRequirements
  ): Promise<X402SettleResult> {
    const url = `${this.config.facilitatorUrl}/settle`;

    this.logger.info(
      { url, amount: paymentRequirements.maxAmountRequired },
      '[X402Client] Settling payment with facilitator'
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentHeader,
          paymentRequirements,
        }),
      });

      const data = await response.json();

      if (data.status === 'success' && data.data?.success) {
        this.logger.info(
          { txHash: data.data?.transactionHash },
          '[X402Client] Payment settled successfully'
        );
        return data.data as X402SettleResult;
      }

      this.logger.warn(
        { code: data.code, error: data.message },
        '[X402Client] Payment settlement failed'
      );

      return {
        success: false,
        network: this.config.network,
        error: data.message || 'Settlement failed',
      };
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : error },
        '[X402Client] Failed to connect to facilitator for settlement'
      );

      return {
        success: false,
        network: this.config.network,
        error: 'Facilitator unavailable',
      };
    }
  }

  /**
   * Check if facilitator is healthy
   */
  async healthCheck(): Promise<boolean> {
    const url = `${this.config.facilitatorUrl}/health`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data.status === 'success';
    } catch {
      return false;
    }
  }

  /**
   * Get default payment requirements for this backend
   */
  getDefaultRequirements(resource: string, description?: string): X402PaymentRequirements {
    return {
      scheme: this.config.scheme,
      network: this.config.network,
      maxAmountRequired: this.config.challengeAmount,
      resource,
      description: description || `Payment required for ${resource}`,
      payTo: this.config.challengeRecipient,
      maxTimeoutSeconds: this.config.timeoutSeconds,
      asset: this.config.challengeAsset,
    };
  }
}

// Singleton instance
let x402ClientInstance: X402FacilitatorClient | null = null;

/**
 * Initialize the x402 client
 */
export function initializeX402Client(
  config: X402MiddlewareConfig,
  logger: FastifyBaseLogger
): X402FacilitatorClient {
  x402ClientInstance = new X402FacilitatorClient(config, logger);
  return x402ClientInstance;
}

/**
 * Get the x402 client instance
 */
export function getX402Client(): X402FacilitatorClient {
  if (!x402ClientInstance) {
    throw new Error('X402 client not initialized. Call initializeX402Client first.');
  }
  return x402ClientInstance;
}

/**
 * Check if x402 client is initialized
 */
export function isX402ClientInitialized(): boolean {
  return x402ClientInstance !== null;
}
