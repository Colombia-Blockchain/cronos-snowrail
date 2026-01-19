import type { FastifyPluginAsync } from 'fastify';
import type {
  ApiResponse,
  GetNotificationsRequest,
  GetNotificationsResponse,
  MarkNotificationReadRequest,
  MarkAllReadRequest,
} from '@cronos-x402/shared-types';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  dismissNotification,
} from '../../services/notification-service';

export const notificationRoutes: FastifyPluginAsync = async (server) => {
  // Get notifications
  server.get<{
    Querystring: GetNotificationsRequest;
    Reply: ApiResponse<GetNotificationsResponse>;
  }>('/notifications', async (request, reply) => {
    try {
      const { unreadOnly, limit, before } = request.query;

      // TODO: Get userId from authenticated session
      const userId = (request.headers['x-user-address'] as string) || '0x0000000000000000000000000000000000000000';

      const result = await getNotifications(userId, { unreadOnly, limit, before });

      const response: ApiResponse<GetNotificationsResponse> = {
        status: 'success',
        code: 'NOTIFICATIONS_RETRIEVED',
        message: 'Notifications retrieved successfully',
        data: result,
      };

      return reply.code(200).send(response);
    } catch (error) {
      server.log.error({ error }, '[NotificationRoutes] Error getting notifications');

      const response: ApiResponse = {
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get notifications',
      };

      return reply.code(500).send(response);
    }
  });

  // Mark notification as read
  server.post<{
    Params: { id: string };
    Reply: ApiResponse;
  }>('/notifications/:id/read', async (request, reply) => {
    try {
      const { id } = request.params;

      // TODO: Get userId from authenticated session
      const userId = (request.headers['x-user-address'] as string) || '0x0000000000000000000000000000000000000000';

      await markAsRead(userId, id);

      const response: ApiResponse = {
        status: 'success',
        code: 'NOTIFICATION_MARKED_READ',
        message: 'Notification marked as read',
      };

      return reply.code(200).send(response);
    } catch (error) {
      server.log.error({ error }, '[NotificationRoutes] Error marking notification as read');

      const response: ApiResponse = {
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to mark notification as read',
      };

      return reply.code(500).send(response);
    }
  });

  // Mark all notifications as read
  server.post<{
    Body: MarkAllReadRequest;
    Reply: ApiResponse;
  }>('/notifications/read-all', async (request, reply) => {
    try {
      const { before } = request.body;

      // TODO: Get userId from authenticated session
      const userId = (request.headers['x-user-address'] as string) || '0x0000000000000000000000000000000000000000';

      await markAllAsRead(userId, before);

      const response: ApiResponse = {
        status: 'success',
        code: 'ALL_NOTIFICATIONS_MARKED_READ',
        message: 'All notifications marked as read',
      };

      return reply.code(200).send(response);
    } catch (error) {
      server.log.error({ error }, '[NotificationRoutes] Error marking all notifications as read');

      const response: ApiResponse = {
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
      };

      return reply.code(500).send(response);
    }
  });

  // Dismiss notification
  server.delete<{
    Params: { id: string };
    Reply: ApiResponse;
  }>('/notifications/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // TODO: Get userId from authenticated session
      const userId = (request.headers['x-user-address'] as string) || '0x0000000000000000000000000000000000000000';

      await dismissNotification(userId, id);

      const response: ApiResponse = {
        status: 'success',
        code: 'NOTIFICATION_DISMISSED',
        message: 'Notification dismissed',
      };

      return reply.code(200).send(response);
    } catch (error) {
      server.log.error({ error }, '[NotificationRoutes] Error dismissing notification');

      const response: ApiResponse = {
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to dismiss notification',
      };

      return reply.code(500).send(response);
    }
  });
};
