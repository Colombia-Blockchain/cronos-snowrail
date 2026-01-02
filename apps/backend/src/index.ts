import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { showBanner } from './utils/banner';
import { intentRoutes } from './api/routes/intents';
import { agentRoutes } from './api/routes/agent';
import { initializeAgentService } from './services/agent-service';
import { initializeWalletService } from './services/wallet-service';
import { getWalletService } from './services/wallet-service';
import { initializePriceService } from './services/price-service';
import { mcpPlugin } from './mcp';

dotenv.config();

interface ApiResponse<T = Record<string, unknown> | null> {
  status: 'success' | 'warning' | 'error';
  code: string;
  message: string;
  data?: T;
  details?: Record<string, unknown>;
}

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Security middleware
server.register(helmet, {
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  xFrameOptions: {
    action: 'deny',
  },
});

// CORS configuration
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

server.register(cors, {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

// Initialize services
initializeAgentService(server);
initializeWalletService(server);
initializePriceService(server);
const walletAddress = getWalletService().getAddress();
server.log.info(`[WalletService] Wallet address: ${walletAddress}`);

// Register API routes
server.register(intentRoutes, { prefix: '/api' });
server.register(agentRoutes, { prefix: '/api' });

// Register MCP plugin for AI assistant integration
server.register(mcpPlugin);

// Health check endpoint
server.get<{ Reply: ApiResponse }>('/health', async () => {
  const response: ApiResponse = {
    status: 'success',
    code: 'HEALTH_CHECK_OK',
    message: 'Backend server is running',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '0.0.1',
      environment: process.env.NODE_ENV || 'development',
      network: process.env.CRONOS_NETWORK_NAME || 'Cronos Testnet',
    },
  };
  return response;
});

// Health readiness check (includes service initialization)
server.get<{ Reply: ApiResponse }>('/health/ready', async () => {
  // Verify wallet service is initialized
  getWalletService();

  const response: ApiResponse = {
    status: 'success',
    code: 'READINESS_CHECK_OK',
    message: 'System is ready for E2E testing',
    data: {
      timestamp: new Date().toISOString(),
      services: {
        wallet: {
          initialized: true,
        },
        agent: {
          initialized: true,
        },
      },
      environment: {
        network: process.env.CRONOS_NETWORK_NAME || 'Cronos Testnet',
        chainId: process.env.CHAIN_ID || '43113',
      },
      endpoints: {
        createIntent: 'POST /api/intents',
        executeIntent: 'POST /api/intents/:id/execute',
        getIntent: 'GET /api/intents/:id',
        listIntents: 'GET /api/intents',
        triggerAgent: 'POST /api/agent/trigger',
      },
      mcp: {
        enabled: true,
        endpoint: 'POST /mcp',
        toolsDiscovery: 'GET /mcp/tools',
        health: 'GET /mcp/health',
      },
    },
  };
  return response;
});

// Global error handler
server.setErrorHandler((error, request, reply) => {
  const traceId = request.id || 'unknown';

  server.log.error(error);

  const response: ApiResponse = {
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: error.message || 'An unexpected error occurred',
    details: {
      traceId,
      originalError: process.env.NODE_ENV === 'development' ? error.message : undefined,
    },
  };

  reply.code(error.statusCode || 500).send(response);
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    showBanner(port, process.env.CRONOS_NETWORK_NAME || 'Cronos Testnet');
    server.log.info(`Server running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  server.log.info('Shutting down gracefully...');
  await server.close();
  process.exit(0);
});

start();

