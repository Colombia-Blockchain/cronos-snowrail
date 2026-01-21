// ============================================================
// x402 HTTP Middleware
// Implements the 402 Payment Required handshake
// ============================================================

import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import type {
  X402ChallengeResponse,
  X402MiddlewareConfig,
  X402PaymentRequirements,
} from './types';
import { X402_HEADERS } from './types';
import { getX402Client, isX402ClientInitialized, initializeX402Client } from './client';

/**
 * Get x402 configuration from environment
 */
export function getX402Config(): X402MiddlewareConfig {
  return {
    enabled: process.env.X402_ENABLED === 'true',
    facilitatorUrl: process.env.X402_FACILITATOR_URL || 'http://localhost:3002',
    challengeRecipient: process.env.X402_CHALLENGE_RECIPIENT || '',
    challengeAmount: process.env.X402_CHALLENGE_AMOUNT || '1000000', // 1 USDC (6 decimals)
    challengeAsset: process.env.X402_CHALLENGE_ASSET || 'USDC',
    network: process.env.X402_NETWORK || 'cronos-testnet',
    scheme: (process.env.X402_SCHEME as 'exact' | 'eip-3009') || 'eip-3009',
    timeoutSeconds: parseInt(process.env.X402_TIMEOUT_SECONDS || '300', 10),
  };
}

/**
 * Build 402 challenge response
 */
function buildChallengeResponse(
  requirements: X402PaymentRequirements
): X402ChallengeResponse {
  return {
    x402Version: 1,
    accepts: [requirements],
  };
}

/**
 * Create x402 middleware for a specific resource
 *
 * Usage:
 * ```typescript
 * server.get('/api/premium/data', {
 *   preHandler: [createX402Middleware('/api/premium/data', 'Access premium data')]
 * }, handler);
 * ```
 */
export function createX402Middleware(
  resource: string,
  description?: string,
  customAmount?: string
) {
  return async function x402Middleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const config = getX402Config();

    // If x402 is disabled, skip middleware (feature flag)
    if (!config.enabled) {
      request.server.log.debug('[X402Middleware] x402 disabled, skipping');
      return;
    }

    // Check if client is initialized
    if (!isX402ClientInitialized()) {
      request.server.log.warn('[X402Middleware] x402 client not initialized');
      return;
    }

    const client = getX402Client();

    // Check for payment header
    const paymentHeader = request.headers[X402_HEADERS.PAYMENT] as string | undefined;

    // Build requirements for this resource
    const requirements = client.getDefaultRequirements(resource, description);
    if (customAmount) {
      requirements.maxAmountRequired = customAmount;
    }

    // If no payment header, return 402 challenge
    if (!paymentHeader) {
      request.server.log.info(
        { resource, requestId: request.id },
        '[X402Middleware] No payment header, returning 402 challenge'
      );

      const challenge = buildChallengeResponse(requirements);

      reply
        .code(402)
        .header('Content-Type', 'application/json')
        .send(challenge);
      return;
    }

    // Verify payment with facilitator
    request.server.log.info(
      { resource, requestId: request.id },
      '[X402Middleware] Verifying payment header'
    );

    const verifyResult = await client.verify(paymentHeader, requirements);

    if (!verifyResult.isValid) {
      request.server.log.warn(
        { resource, reason: verifyResult.invalidReason, requestId: request.id },
        '[X402Middleware] Payment verification failed'
      );

      const challenge = buildChallengeResponse(requirements);
      challenge.error = verifyResult.invalidReason;

      reply
        .code(402)
        .header('Content-Type', 'application/json')
        .send(challenge);
      return;
    }

    // Payment verified! Settle the payment
    request.server.log.info(
      { resource, payer: verifyResult.payer, requestId: request.id },
      '[X402Middleware] Payment verified, settling...'
    );

    const settleResult = await client.settle(paymentHeader, requirements);

    if (!settleResult.success) {
      request.server.log.error(
        { resource, error: settleResult.error, requestId: request.id },
        '[X402Middleware] Payment settlement failed'
      );

      const challenge = buildChallengeResponse(requirements);
      challenge.error = `Settlement failed: ${settleResult.error}`;

      reply
        .code(402)
        .header('Content-Type', 'application/json')
        .send(challenge);
      return;
    }

    // Success! Add payment response header and continue
    request.server.log.info(
      { resource, txHash: settleResult.transactionHash, requestId: request.id },
      '[X402Middleware] Payment settled successfully'
    );

    // Add payment receipt to response headers
    const paymentReceipt = {
      success: true,
      network: settleResult.network,
      transactionHash: settleResult.transactionHash,
      settledAmount: settleResult.settledAmount,
    };

    reply.header(
      X402_HEADERS.PAYMENT_RESPONSE,
      Buffer.from(JSON.stringify(paymentReceipt)).toString('base64')
    );

    // Store payer info in request for handlers to use
    (request as any).x402Payer = verifyResult.payer;
    (request as any).x402TxHash = settleResult.transactionHash;

    // Continue to route handler
  };
}

/**
 * Plugin to register x402 support in Fastify
 */
export async function x402Plugin(server: FastifyInstance): Promise<void> {
  const config = getX402Config();

  if (!config.enabled) {
    server.log.info('[X402Plugin] x402 protocol DISABLED (X402_ENABLED=false)');
    return;
  }

  if (!config.challengeRecipient) {
    server.log.warn('[X402Plugin] X402_CHALLENGE_RECIPIENT not set, x402 will not work');
    return;
  }

  // Initialize client
  initializeX402Client(config, server.log);

  // Check facilitator health
  const client = getX402Client();
  const isHealthy = await client.healthCheck();

  if (isHealthy) {
    server.log.info(
      {
        facilitatorUrl: config.facilitatorUrl,
        challengeRecipient: config.challengeRecipient,
        challengeAmount: config.challengeAmount,
        scheme: config.scheme,
      },
      '[X402Plugin] x402 protocol ENABLED and facilitator is healthy'
    );
  } else {
    server.log.warn(
      { facilitatorUrl: config.facilitatorUrl },
      '[X402Plugin] x402 ENABLED but facilitator is not responding'
    );
  }

  // Decorate request with x402 info
  server.decorateRequest('x402Payer', null);
  server.decorateRequest('x402TxHash', null);
}

/**
 * Type augmentation for Fastify request
 */
declare module 'fastify' {
  interface FastifyRequest {
    x402Payer?: string | null;
    x402TxHash?: string | null;
  }
}
