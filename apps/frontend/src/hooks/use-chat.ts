'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useWebSocket } from './use-websocket';
import { useEffect } from 'react';
import type {
  ChatMessage,
  SendMessageRequest,
  SendMessageResponse,
  GetChatHistoryResponse,
  ApiResponse,
} from '@cronos-x402/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Hook for chat functionality
 */
export function useChat() {
  const { address } = useAccount();
  const { subscribe } = useWebSocket();
  const queryClient = useQueryClient();

  // Fetch chat history
  const {
    data: chatData,
    isLoading,
    error,
  } = useQuery<GetChatHistoryResponse>({
    queryKey: ['chat', 'history', address],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/chat/messages?limit=50`, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Address': address || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const apiResponse: ApiResponse<GetChatHistoryResponse> = await response.json();
      return apiResponse.data || { messages: [], hasMore: false };
    },
    enabled: !!address,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const request: SendMessageRequest = { content };

      const response = await fetch(`${API_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Address': address || '',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const apiResponse: ApiResponse<SendMessageResponse> = await response.json();
      return apiResponse.data;
    },
    onSuccess: (data) => {
      // Add messages to cache optimistically
      if (data) {
        queryClient.setQueryData<GetChatHistoryResponse>(
          ['chat', 'history', address],
          (old) => {
            const messages = [...(old?.messages || [])];
            messages.push(data.message);
            if (data.systemResponse) {
              messages.push(data.systemResponse);
            }
            return { messages, hasMore: old?.hasMore || false };
          }
        );
      }
    },
  });

  // Subscribe to real-time chat messages
  useEffect(() => {
    if (!address) return;

    const unsubscribe = subscribe('chat:message', (message: ChatMessage) => {
      // Update cache with new message
      queryClient.setQueryData<GetChatHistoryResponse>(
        ['chat', 'history', address],
        (old) => {
          const messages = [...(old?.messages || [])];
          // Avoid duplicates
          if (!messages.find((m) => m.id === message.id)) {
            messages.push(message);
          }
          return { messages, hasMore: old?.hasMore || false };
        }
      );
    });

    return unsubscribe;
  }, [address, subscribe, queryClient]);

  return {
    messages: chatData?.messages || [],
    hasMore: chatData?.hasMore || false,
    isLoading,
    error,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
  };
}
