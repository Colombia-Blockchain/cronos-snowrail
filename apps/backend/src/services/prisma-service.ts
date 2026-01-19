import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

let prismaInstance: PrismaClient | null = null;

/**
 * Initialize Prisma client as singleton
 * @param server Fastify server instance for logging
 */
export function initializePrismaService(server: FastifyInstance): void {
  if (prismaInstance) {
    server.log.warn('[PrismaService] Already initialized');
    return;
  }

  prismaInstance = new PrismaClient({
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
  });

  // Log warnings
  prismaInstance.$on('warn', (e) => {
    server.log.warn({ prisma: e }, '[Prisma] Warning');
  });

  // Log errors
  prismaInstance.$on('error', (e) => {
    server.log.error({ prisma: e }, '[Prisma] Error');
  });

  // Connect to database
  prismaInstance
    .$connect()
    .then(() => {
      server.log.info('[PrismaService] Connected to database');
    })
    .catch((error) => {
      server.log.error({ error }, '[PrismaService] Failed to connect to database');
      throw error;
    });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
      server.log.info('[PrismaService] Disconnected from database');
    }
  });

  process.on('SIGTERM', async () => {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
      server.log.info('[PrismaService] Disconnected from database');
    }
  });

  server.log.info('[PrismaService] Initialized');
}

/**
 * Get Prisma client singleton instance
 * @throws Error if not initialized
 */
export function getPrismaService(): PrismaClient {
  if (!prismaInstance) {
    throw new Error('[PrismaService] Not initialized. Call initializePrismaService first.');
  }
  return prismaInstance;
}

/**
 * Disconnect from database (for testing)
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
