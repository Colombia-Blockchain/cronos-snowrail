import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { healthRoutes } from './api/routes/health';
import { supportedRoutes } from './api/routes/supported';
import { verifyRoutes } from './api/routes/verify';
import { settleRoutes } from './api/routes/settle';
import { initializeWalletService } from './services/wallet-service';
import type { ApiResponse } from './types';

dotenv.config();

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
  xFrameOptions: { action: 'deny' },
});

// CORS configuration
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000'];

server.register(cors, {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
});

// Initialize services
initializeWalletService(server);

// Register routes
server.register(healthRoutes);
server.register(supportedRoutes);
server.register(verifyRoutes);
server.register(settleRoutes);

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

const showBanner = (port: number, network: string) => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ❄️  SNOWRAIL x402 FACILITATOR                           ║
║                                                           ║
║   Network: ${network.padEnd(44)}║
║   Port: ${port.toString().padEnd(48)}║
║   Protocol: x402 v${process.env.X402_PROTOCOL_VERSION || '1.0'}                                     ║
║                                                           ║
║   Endpoints:                                              ║
║   • GET  /health     - Health status                      ║
║   • GET  /version    - Version info                       ║
║   • GET  /supported  - Supported schemes                  ║
║   • GET  /verify     - Verification schema                ║
║   • POST /verify     - Verify payment                     ║
║   • GET  /settle     - Settlement schema                  ║
║   • POST /settle     - Execute settlement                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
};

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3002', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    showBanner(port, process.env.CRONOS_NETWORK_NAME || 'Cronos Testnet');
    server.log.info(`Facilitator running on http://${host}:${port}`);
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
