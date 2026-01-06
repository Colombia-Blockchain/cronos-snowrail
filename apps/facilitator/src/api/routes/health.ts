import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { ApiResponse, HealthData, VersionData } from '../../types';

export const healthRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // GET /health - Check facilitator health status
  server.get<{ Reply: ApiResponse<HealthData> }>('/health', async () => {
    const response: ApiResponse<HealthData> = {
      status: 'success',
      code: 'FACILITATOR_HEALTHY',
      message: 'Facilitator is running and healthy',
      data: {
        version: process.env.npm_package_version || '0.1.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        network: process.env.CRONOS_NETWORK_NAME || 'Cronos Testnet',
        chainId: parseInt(process.env.CHAIN_ID || '338', 10),
      },
    };
    return response;
  });

  // GET /version - Facilitator version and build info
  server.get<{ Reply: ApiResponse<VersionData> }>('/version', async () => {
    const response: ApiResponse<VersionData> = {
      status: 'success',
      code: 'VERSION_INFO',
      message: 'Facilitator version information',
      data: {
        version: process.env.npm_package_version || '0.1.0',
        x402Protocol: process.env.X402_PROTOCOL_VERSION || '1.0',
        apiVersion: 'v1',
        buildInfo: {
          name: process.env.FACILITATOR_NAME || 'Cronos Snowrail Facilitator',
          network: process.env.CRONOS_NETWORK_NAME || 'Cronos Testnet',
        },
      },
    };
    return response;
  });
};
