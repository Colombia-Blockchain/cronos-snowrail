import type { FastifyInstance } from 'fastify';
import { Server as SocketIOServer, Socket } from 'socket.io';
import type { WSEventType, WSMessage, WSAuthMessage } from '@cronos-x402/shared-types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  address?: string;
}

let io: SocketIOServer | null = null;
let fastifyInstance: FastifyInstance | null = null;

/**
 * Initialize WebSocket server with Socket.io
 */
export function initializeWebSocketService(server: FastifyInstance): SocketIOServer {
  if (io) {
    server.log.warn('[WebSocketService] Already initialized');
    return io;
  }

  fastifyInstance = server;

  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'];

  io = new SocketIOServer(server.server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    server.log.info({ socketId: socket.id }, '[WebSocket] Client connected');

    // Authentication handler
    socket.on('auth', (data: WSAuthMessage) => {
      try {
        // TODO: Validate JWT token here
        // For now, we'll use a simple address-based auth
        const { address } = data;

        if (!address || !isValidAddress(address)) {
          socket.emit('auth:error', {
            code: 'INVALID_ADDRESS',
            message: 'Invalid wallet address',
          });
          return;
        }

        // Authenticate socket
        socket.userId = address.toLowerCase();
        socket.address = address;

        // Join user-specific room
        socket.join(`user:${socket.userId}`);

        socket.emit('auth:success', {
          userId: socket.userId,
          address: socket.address,
        });

        server.log.info(
          { socketId: socket.id, userId: socket.userId },
          '[WebSocket] Client authenticated'
        );
      } catch (error) {
        server.log.error({ error }, '[WebSocket] Authentication error');
        socket.emit('auth:error', {
          code: 'AUTH_FAILED',
          message: 'Authentication failed',
        });
      }
    });

    // Ping/Pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      server.log.info(
        { socketId: socket.id, userId: socket.userId, reason },
        '[WebSocket] Client disconnected'
      );
    });

    // Error handler
    socket.on('error', (error) => {
      server.log.error({ error, socketId: socket.id }, '[WebSocket] Socket error');
    });
  });

  server.log.info('[WebSocketService] Initialized');
  return io;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketService(): SocketIOServer {
  if (!io) {
    throw new Error('[WebSocketService] Not initialized. Call initializeWebSocketService first.');
  }
  return io;
}

/**
 * Emit event to specific user
 */
export function emitToUser(userId: string, event: WSEventType, data: any): void {
  if (!io) {
    throw new Error('[WebSocketService] Not initialized');
  }

  const message: WSMessage = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  io.to(`user:${userId}`).emit(event, message);

  fastifyInstance?.log.debug(
    { userId, event },
    '[WebSocket] Emitted event to user'
  );
}

/**
 * Emit event to all connected clients
 */
export function emitToAll(event: WSEventType, data: any): void {
  if (!io) {
    throw new Error('[WebSocketService] Not initialized');
  }

  const message: WSMessage = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  io.emit(event, message);

  fastifyInstance?.log.debug({ event }, '[WebSocket] Emitted event to all');
}

/**
 * Emit event to multiple users
 */
export function emitToUsers(userIds: string[], event: WSEventType, data: any): void {
  if (!io) {
    throw new Error('[WebSocketService] Not initialized');
  }

  const message: WSMessage = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  userIds.forEach((userId) => {
    io!.to(`user:${userId}`).emit(event, message);
  });

  fastifyInstance?.log.debug(
    { userIds, event },
    '[WebSocket] Emitted event to multiple users'
  );
}

/**
 * Get connected sockets for a user
 */
export function getUserSockets(userId: string): Set<string> {
  if (!io) {
    throw new Error('[WebSocketService] Not initialized');
  }

  const room = io.sockets.adapter.rooms.get(`user:${userId}`);
  return room || new Set();
}

/**
 * Check if user is connected
 */
export function isUserConnected(userId: string): boolean {
  const sockets = getUserSockets(userId);
  return sockets.size > 0;
}

/**
 * Get total connected clients count
 */
export function getConnectedCount(): number {
  if (!io) {
    return 0;
  }
  return io.sockets.sockets.size;
}

/**
 * Disconnect user's sockets
 */
export function disconnectUser(userId: string): void {
  if (!io) {
    return;
  }

  const sockets = getUserSockets(userId);
  sockets.forEach((socketId) => {
    const socket = io!.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
    }
  });

  fastifyInstance?.log.info({ userId }, '[WebSocket] Disconnected user');
}

// Helper function
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
