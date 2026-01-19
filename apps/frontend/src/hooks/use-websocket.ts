'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { getWebSocketClient } from '../services/websocket-client';
import type { WSEventType } from '@cronos-x402/shared-types';

export function useWebSocket() {
  const { address, isConnected: isWalletConnected } = useAccount();
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const wsClient = useRef(getWebSocketClient(address)).current;

  // Connect to WebSocket when wallet is connected
  useEffect(() => {
    if (isWalletConnected && address) {
      wsClient.connect();

      // Setup connection listeners
      wsClient.on('connect', () => {
        setIsConnected(true);
      });

      wsClient.on('disconnect', () => {
        setIsConnected(false);
        setIsAuthenticated(false);
      });

      wsClient.on('auth:success', () => {
        setIsAuthenticated(true);
      });

      wsClient.on('auth:error', () => {
        setIsAuthenticated(false);
      });

      return () => {
        // Don't disconnect on unmount, keep connection alive
        // wsClient.disconnect();
      };
    }
  }, [isWalletConnected, address, wsClient]);

  // Subscribe to an event
  const subscribe = useCallback(
    (event: WSEventType | string, handler: (data: any) => void) => {
      wsClient.on(event, handler);

      return () => {
        wsClient.off(event, handler);
      };
    },
    [wsClient]
  );

  // Emit an event
  const emit = useCallback(
    (event: WSEventType, data: any) => {
      wsClient.emit(event, data);
    },
    [wsClient]
  );

  return {
    isConnected,
    isAuthenticated,
    subscribe,
    emit,
  };
}
