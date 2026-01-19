'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useWebSocket } from './use-websocket';
import { useEffect } from 'react';
import type {
  Notification,
  GetNotificationsResponse,
  ApiResponse,
} from '@cronos-x402/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Hook for notifications
 */
export function useNotifications() {
  const { address } = useAccount();
  const { subscribe } = useWebSocket();
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading,
    error,
  } = useQuery<GetNotificationsResponse>({
    queryKey: ['notifications', address],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/notifications?limit=50`, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Address': address || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const apiResponse: ApiResponse<GetNotificationsResponse> = await response.json();
      return apiResponse.data || { notifications: [], unreadCount: 0, hasMore: false };
    },
    enabled: !!address,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Address': address || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return notificationId;
    },
    onSuccess: (notificationId) => {
      // Update cache
      queryClient.setQueryData<GetNotificationsResponse>(
        ['notifications', address],
        (old) => {
          if (!old) return old;

          const notifications = old.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          );

          const unreadCount = notifications.filter((n) => !n.read).length;

          return { ...old, notifications, unreadCount };
        }
      );
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Address': address || '',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
    },
    onSuccess: () => {
      // Update cache
      queryClient.setQueryData<GetNotificationsResponse>(
        ['notifications', address],
        (old) => {
          if (!old) return old;

          const notifications = old.notifications.map((n) => ({ ...n, read: true }));

          return { ...old, notifications, unreadCount: 0 };
        }
      );
    },
  });

  // Dismiss notification mutation
  const dismissNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Address': address || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss notification');
      }

      return notificationId;
    },
    onSuccess: (notificationId) => {
      // Update cache
      queryClient.setQueryData<GetNotificationsResponse>(
        ['notifications', address],
        (old) => {
          if (!old) return old;

          const notifications = old.notifications.filter((n) => n.id !== notificationId);
          const unreadCount = notifications.filter((n) => !n.read).length;

          return { ...old, notifications, unreadCount };
        }
      );
    },
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!address) return;

    const unsubscribe = subscribe('notification', (notification: Notification) => {
      // Add notification to cache
      queryClient.setQueryData<GetNotificationsResponse>(
        ['notifications', address],
        (old) => {
          if (!old) {
            return {
              notifications: [notification],
              unreadCount: 1,
              hasMore: false,
            };
          }

          // Avoid duplicates
          if (old.notifications.find((n) => n.id === notification.id)) {
            return old;
          }

          const notifications = [notification, ...old.notifications];
          const unreadCount = notifications.filter((n) => !n.read).length;

          return { ...old, notifications, unreadCount };
        }
      );

      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: notification.icon,
          tag: notification.id,
        });
      }
    });

    return unsubscribe;
  }, [address, subscribe, queryClient]);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  return {
    notifications: notificationsData?.notifications || [],
    unreadCount: notificationsData?.unreadCount || 0,
    hasMore: notificationsData?.hasMore || false,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    dismissNotification: dismissNotificationMutation.mutateAsync,
    requestNotificationPermission,
  };
}
