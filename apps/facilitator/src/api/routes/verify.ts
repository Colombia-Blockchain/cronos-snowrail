import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getX402Service } from '../../services/x402-service';
import type { ApiResponse, VerifyRequest, VerifyResponse, VerifySchema } from '../../types';

// JSON Schema for verification request
const VERIFY_REQUEST_SCHEMA: VerifySchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'x402 Verify Request',
  description: 'Request schema for verifying x402 payment signatures',
  type: 'object',
  properties: {
    paymentHeader: {
      type: 'string',
      description: 'Base64-encoded x-payment header containing the payment token',
    },
    paymentRequirements: {
      type: 'object',
      description: 'Payment requirements that the payment must satisfy',
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
        description: {
          type: 'string',
          description: 'Human-readable description of the payment',
        },
        payTo: {
          type: 'string',
          description: 'Recipient address for the payment',
        },
        maxTimeoutSeconds: {
          type: 'string',
          description: 'Maximum time in seconds for the payment to be valid',
        },
      },
      required: ['scheme', 'network', 'maxAmountRequired', 'resource', 'payTo'],
    },
  },
  required: ['paymentHeader', 'paymentRequirements'],
};

export const verifyRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // GET /verify - Get verification request schema
  server.get<{ Reply: ApiResponse<VerifySchema> }>('/verify', async () => {
    const response: ApiResponse<VerifySchema> = {
      status: 'success',
      code: 'VERIFY_SCHEMA',
      message: 'Schema for verification requests',
      data: VERIFY_REQUEST_SCHEMA,
    };
    return response;
  });

  // POST /verify - Verify payment signature and requirements
  server.post<{ Body: VerifyRequest; Reply: ApiResponse<VerifyResponse> }>(
    '/verify',
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

      if (!paymentRequirements.scheme || !paymentRequirements.network) {
        return reply.code(400).send({
          status: 'error',
          code: 'INVALID_REQUIREMENTS',
          message: 'scheme and network are required in paymentRequirements',
        });
      }

      try {
        const x402Service = getX402Service();
        const result = await x402Service.verify({ paymentHeader, paymentRequirements });

        if (result.isValid) {
          return {
            status: 'success',
            code: 'PAYMENT_VALID',
            message: 'Payment signature and requirements verified successfully',
            data: result,
          };
        } else {
          return reply.code(400).send({
            status: 'error',
            code: 'PAYMENT_INVALID',
            message: result.invalidReason || 'Payment verification failed',
            data: result,
          });
        }
      } catch (error) {
        server.log.error({ error }, '[Verify] Verification error');
        return reply.code(500).send({
          status: 'error',
          code: 'VERIFICATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown verification error',
        });
      }
    }
  );
};
