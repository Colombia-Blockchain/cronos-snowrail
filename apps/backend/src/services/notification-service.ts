import type { FastifyInstance } from 'fastify';
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationAction,
  CreateNotificationRequest,
  GetNotificationsRequest,
  GetNotificationsResponse,
  WSEventType,
} from '@cronos-x402/shared-types';
import { getPrismaService } from './prisma-service';
import { emitToUser } from './websocket-service';

let serverInstance: FastifyInstance | null = null;

/**
 * Initialize Notification service
 */
export function initializeNotificationService(server: FastifyInstance): void {
  serverInstance = server;
  server.log.info('[NotificationService] Initialized');
}

/**
 * Create and send a notification
 */
export async function createNotification(
  userId: string,
  request: CreateNotificationRequest
): Promise<Notification> {
  const prisma = getPrismaService();

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { address: userId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        address: userId,
      },
    });
  }

  // Default values
  const icon = request.icon || getDefaultIcon(request.type);
  const priority = request.priority || getDefaultPriority(request.type);

  // Create notification
  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      type: request.type,
      title: request.title,
      message: request.message,
      icon,
      priority,
      data: request.data || {},
      actions: request.actions || null,
      read: false,
      dismissible: true,
    },
  });

  const notificationResponse: Notification = {
    id: notification.id,
    userId: notification.userId,
    type: notification.type as NotificationType,
    title: notification.title,
    message: notification.message,
    icon: notification.icon,
    priority: notification.priority as NotificationPriority,
    data: notification.data as Record<string, any>,
    actions: notification.actions as NotificationAction[] | undefined,
    read: notification.read,
    dismissible: notification.dismissible,
    createdAt: notification.createdAt.toISOString(),
  };

  // Emit to user via WebSocket
  emitToUser(userId, 'notification' as WSEventType, notificationResponse);

  serverInstance?.log.info(
    { userId, type: request.type },
    '[NotificationService] Notification created and sent'
  );

  return notificationResponse;
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  request: GetNotificationsRequest
): Promise<GetNotificationsResponse> {
  const prisma = getPrismaService();
  const limit = Math.min(request.limit || 20, 100);

  const user = await prisma.user.findUnique({
    where: { address: userId },
  });

  if (!user) {
    return { notifications: [], unreadCount: 0, hasMore: false };
  }

  const where = {
    userId: user.id,
    ...(request.unreadOnly && { read: false }),
    ...(request.before && { id: { lt: request.before } }),
  };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    }),
    prisma.notification.count({
      where: { userId: user.id, read: false },
    }),
  ]);

  const hasMore = notifications.length > limit;
  const returnNotifications = hasMore ? notifications.slice(0, limit) : notifications;

  const notificationResponses: Notification[] = returnNotifications.map((n) => ({
    id: n.id,
    userId: n.userId,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
    icon: n.icon,
    priority: n.priority as NotificationPriority,
    data: n.data as Record<string, any>,
    actions: n.actions as NotificationAction[] | undefined,
    read: n.read,
    dismissible: n.dismissible,
    createdAt: n.createdAt.toISOString(),
  }));

  return {
    notifications: notificationResponses,
    unreadCount,
    hasMore,
  };
}

/**
 * Mark notification as read
 */
export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  const prisma = getPrismaService();

  const user = await prisma.user.findUnique({
    where: { address: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: user.id,
    },
    data: {
      read: true,
    },
  });

  emitToUser(userId, 'notification:read' as WSEventType, { notificationId });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string, before?: string): Promise<void> {
  const prisma = getPrismaService();

  const user = await prisma.user.findUnique({
    where: { address: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      read: false,
      ...(before && { createdAt: { lte: new Date(before) } }),
    },
    data: {
      read: true,
    },
  });
}

/**
 * Dismiss (delete) a notification
 */
export async function dismissNotification(userId: string, notificationId: string): Promise<void> {
  const prisma = getPrismaService();

  const user = await prisma.user.findUnique({
    where: { address: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId: user.id,
      dismissible: true,
    },
  });

  emitToUser(userId, 'notification:dismiss' as WSEventType, { notificationId });
}

/**
 * Get default icon for notification type
 */
function getDefaultIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    payment_received: '🎉',
    payment_sent: '💸',
    deposit_confirmed: '📥',
    withdrawal_ready: '📤',
    intent_funded: '💰',
    intent_executed: '✅',
    batch_progress: '⏳',
    batch_complete: '🎊',
    transaction_pending: '⏱️',
    transaction_confirmed: '✅',
    transaction_failed: '❌',
    price_alert: '📈',
    security_alert: '🔐',
  };

  return icons[type] || '📢';
}

/**
 * Get default priority for notification type
 */
function getDefaultPriority(type: NotificationType): NotificationPriority {
  const priorities: Record<NotificationType, NotificationPriority> = {
    payment_received: 'high',
    payment_sent: 'medium',
    deposit_confirmed: 'medium',
    withdrawal_ready: 'high',
    intent_funded: 'medium',
    intent_executed: 'high',
    batch_progress: 'low',
    batch_complete: 'high',
    transaction_pending: 'low',
    transaction_confirmed: 'medium',
    transaction_failed: 'high',
    price_alert: 'medium',
    security_alert: 'critical',
  };

  return priorities[type] || 'medium';
}

/**
 * Helper: Send payment received notification
 */
export async function notifyPaymentReceived(
  userId: string,
  amount: string,
  currency: string,
  from: string,
  txHash: string
): Promise<void> {
  await createNotification(userId, {
    type: 'payment_received' as NotificationType,
    title: 'Payment Received!',
    message: `+${amount} ${currency} from ${from.slice(0, 10)}...`,
    data: { amount, currency, from, txHash },
    actions: [
      {
        label: 'View Details',
        command: `/status ${txHash}`,
        style: 'primary',
      },
    ],
  });
}

/**
 * Helper: Send transaction confirmed notification
 */
export async function notifyTransactionConfirmed(
  userId: string,
  txHash: string,
  type: string
): Promise<void> {
  await createNotification(userId, {
    type: 'transaction_confirmed' as NotificationType,
    title: 'Transaction Confirmed',
    message: `Your ${type} transaction has been confirmed`,
    data: { txHash, type },
    actions: [
      {
        label: 'View on Explorer',
        command: `https://testnet.cronoscan.com/tx/${txHash}`,
        style: 'secondary',
      },
    ],
  });
}

/**
 * Helper: Send batch progress notification
 */
export async function notifyBatchProgress(
  userId: string,
  batchId: string,
  processedCount: number,
  totalCount: number,
  percentage: number
): Promise<void> {
  await createNotification(userId, {
    type: 'batch_progress' as NotificationType,
    title: 'Bulk Payment Processing',
    message: `Progress: ${percentage}% (${processedCount}/${totalCount})`,
    priority: 'low',
    data: { batchId, processedCount, totalCount, percentage },
    actions: [
      {
        label: 'View Status',
        command: `/bulk status ${batchId}`,
        style: 'secondary',
      },
    ],
  });
}
