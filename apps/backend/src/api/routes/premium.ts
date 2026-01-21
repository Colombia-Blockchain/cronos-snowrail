// ============================================================
// Premium Routes - x402 Gated Endpoints
// These endpoints require payment via x402 protocol
// ============================================================

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { createX402Middleware, getX402Config } from '../../x402/middleware';

interface PremiumDataResponse {
  status: 'success';
  code: string;
  message: string;
  data: {
    content: string;
    accessLevel: string;
    timestamp: string;
    payer?: string;
    paymentTxHash?: string;
  };
}

interface PremiumAnalyticsResponse {
  status: 'success';
  code: string;
  message: string;
  data: {
    metrics: {
      totalTransactions: number;
      totalVolume: string;
      uniqueUsers: number;
      avgTransactionSize: string;
    };
    timestamp: string;
    payer?: string;
  };
}

/**
 * Premium routes protected by x402 payment protocol
 *
 * These endpoints demonstrate the full x402 handshake:
 * 1. Client requests without payment → 402 + challenge
 * 2. Client signs payment, retries with X-Payment header
 * 3. Server verifies + settles → 200 + data
 */
export const premiumRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // ============================================================
  // GET /premium/data - Basic premium content
  // Requires: 1 USDC (default amount)
  // ============================================================
  server.get<{ Reply: PremiumDataResponse }>(
    '/premium/data',
    {
      preHandler: [
        createX402Middleware('/api/premium/data', 'Access premium treasury data'),
      ],
    },
    async (request) => {
      return {
        status: 'success',
        code: 'PREMIUM_DATA_ACCESS',
        message: 'Premium data access granted via x402 payment',
        data: {
          content: 'This is premium content that required x402 payment to access.',
          accessLevel: 'premium',
          timestamp: new Date().toISOString(),
          payer: request.x402Payer || undefined,
          paymentTxHash: request.x402TxHash || undefined,
        },
      };
    }
  );

  // ============================================================
  // GET /premium/analytics - Premium analytics (higher price)
  // Requires: 5 USDC
  // ============================================================
  server.get<{ Reply: PremiumAnalyticsResponse }>(
    '/premium/analytics',
    {
      preHandler: [
        createX402Middleware(
          '/api/premium/analytics',
          'Access premium analytics dashboard',
          '5000000' // 5 USDC (6 decimals)
        ),
      ],
    },
    async (request) => {
      // Mock analytics data
      return {
        status: 'success',
        code: 'PREMIUM_ANALYTICS_ACCESS',
        message: 'Premium analytics access granted via x402 payment',
        data: {
          metrics: {
            totalTransactions: 1247,
            totalVolume: '125000.50',
            uniqueUsers: 89,
            avgTransactionSize: '100.24',
          },
          timestamp: new Date().toISOString(),
          payer: request.x402Payer || undefined,
        },
      };
    }
  );

  // ============================================================
  // GET /premium/status - Check x402 status (no payment required)
  // ============================================================
  server.get('/premium/status', async () => {
    const config = getX402Config();

    return {
      status: 'success',
      code: 'X402_STATUS',
      message: 'x402 protocol status',
      data: {
        enabled: config.enabled,
        facilitatorUrl: config.enabled ? config.facilitatorUrl : null,
        network: config.network,
        scheme: config.scheme,
        challengeAsset: config.challengeAsset,
        endpoints: {
          '/api/premium/data': {
            amount: config.challengeAmount,
            description: 'Basic premium data access',
          },
          '/api/premium/analytics': {
            amount: '5000000',
            description: 'Premium analytics dashboard',
          },
        },
      },
    };
  });

  server.log.info('[PremiumRoutes] Premium x402-gated routes registered');
};
