import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getSettlementService } from '../../services/settlement-service';
import { isWalletServiceAvailable } from '../../services/wallet-service';
import type { ApiResponse, SettleRequest, SettleResponse, SettleSchema } from '../../types';

// JSON Schema for settlement request
const SETTLE_REQUEST_SCHEMA: SettleSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'x402 Settle Request',
  description: 'Request schema for executing x402 payment settlement on-chain via EIP-3009',
  type: 'object',
  properties: {
    paymentHeader: {
      type: 'string',
      description: 'Base64-encoded x-payment header containing the payment token with signature',
    },
    paymentRequirements: {
      type: 'object',
      description: 'Original payment requirements for validation',
      properties: {
        scheme: {
          type: 'string',
          description: 'Payment scheme (e.g., "exact", "eip-3009")',
        },
        network: {
          type: 'string',
          description: 'Network identifier (e.g., "cronos-testnet")',
        },
        maxAmountRequired: {
          type: 'string',
          description: 'Maximum amount required in smallest unit (wei)',
        },
        resource: {
          type: 'string',
          description: 'Resource URL or identifier being paid for',
        },
        payTo: {
          type: 'string',
          description: 'Recipient address for the payment',
        },
      },
      required: ['scheme', 'network', 'maxAmountRequired', 'payTo'],
    },
  },
  required: ['paymentHeader', 'paymentRequirements'],
};

export const settleRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // GET /settle - Get settlement request schema
  server.get<{ Reply: ApiResponse<SettleSchema> }>('/settle', async () => {
    const walletAvailable = isWalletServiceAvailable();

    const response: ApiResponse<SettleSchema> = {
      status: 'success',
      code: 'SETTLE_SCHEMA',
      message: 'Schema for settlement requests',
      data: SETTLE_REQUEST_SCHEMA,
      details: {
        settlementEnabled: walletAvailable,
        note: walletAvailable
          ? 'Settlement service is ready to execute payments'
          : 'Settlement unavailable - facilitator wallet not configured',
      },
    };
    return response;
  });

  // POST /settle - Execute payment on-chain via EIP-3009
  server.post<{ Body: SettleRequest; Reply: ApiResponse<SettleResponse> }>(
    '/settle',
    async (request, reply) => {
      const { paymentHeader, paymentRequirements } = request.body;

      // Validate required fields
      if (!paymentHeader) {
        return reply.code(400).send({
          status: 'error',
          code: 'MISSING_PAYMENT_HEADER',
          message: 'paymentHeader is required',
        });
      }

      if (!paymentRequirements) {
        return reply.code(400).send({
          status: 'error',
          code: 'MISSING_REQUIREMENTS',
          message: 'paymentRequirements is required',
        });
      }

      if (!paymentRequirements.scheme || !paymentRequirements.network || !paymentRequirements.payTo) {
        return reply.code(400).send({
          status: 'error',
          code: 'INVALID_REQUIREMENTS',
          message: 'scheme, network, and payTo are required in paymentRequirements',
        });
      }

      // Check if settlement is available
      if (!isWalletServiceAvailable()) {
        return reply.code(503).send({
          status: 'error',
          code: 'SETTLEMENT_UNAVAILABLE',
          message: 'Settlement service is not available - facilitator wallet not configured',
        });
      }

      try {
        server.log.info(
          {
            scheme: paymentRequirements.scheme,
            network: paymentRequirements.network,
            payTo: paymentRequirements.payTo,
          },
          '[Settle] Processing settlement request'
        );

        const settlementService = getSettlementService();
        const result = await settlementService.settle({ paymentHeader, paymentRequirements });

        if (result.success) {
          server.log.info(
            { txHash: result.transactionHash },
            '[Settle] Settlement executed successfully'
          );

          return {
            status: 'success',
            code: 'SETTLEMENT_EXECUTED',
            message: 'Payment settled successfully on-chain',
            data: result,
          };
        } else {
          server.log.warn({ error: result.error }, '[Settle] Settlement failed');

          return reply.code(400).send({
            status: 'error',
            code: 'SETTLEMENT_FAILED',
            message: result.error || 'Settlement execution failed',
            data: result,
          });
        }
      } catch (error) {
        server.log.error({ error }, '[Settle] Settlement error');
        return reply.code(500).send({
          status: 'error',
          code: 'SETTLEMENT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown settlement error',
        });
      }
    }
  );
};
