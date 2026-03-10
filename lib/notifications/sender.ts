import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  notifications,
  type NewNotification,
} from '@/lib/db/notifications-schema';
import {
  NotificationChannel,
  type SendNotificationOptions,
} from './types';

export async function sendNotification(
  options: SendNotificationOptions
): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const newNotification: NewNotification = {
      userId: options.userId,
      teamId: options.teamId,
      type: options.type,
      title: options.title,
      body: options.body,
      isRead: false,
      channel: options.channel ?? NotificationChannel.IN_APP,
      metadata: options.metadata ?? null,
    };

    const result = await db
      .insert(notifications)
      .values(newNotification)
      .returning({ id: notifications.id });

    return { success: true, id: result[0]?.id };
  } catch (err) {
    console.error('[notifications] Failed to send notification:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function sendToTeam(
  teamId: number,
  userIds: number[],
  options: Omit<SendNotificationOptions, 'userId' | 'teamId'>
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (userIds.length === 0) return { success: true, count: 0 };

    const rows: NewNotification[] = userIds.map((userId) => ({
      userId,
      teamId,
      type: options.type,
      title: options.title,
      body: options.body,
      isRead: false,
      channel: options.channel ?? NotificationChannel.IN_APP,
      metadata: options.metadata ?? null,
    }));

    await db.insert(notifications).values(rows);

    return { success: true, count: userIds.length };
  } catch (err) {
    console.error('[notifications] Failed to send team notifications:', err);
    return {
      success: false,
      count: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function markAsRead(
  notificationId: number,
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
    return { success: true };
  } catch (err) {
    console.error('[notifications] Failed to mark as read:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function markAllRead(
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      );
    return { success: true };
  } catch (err) {
    console.error('[notifications] Failed to mark all as read:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function getUnreadCount(userId: number): Promise<number> {
  try {
    const result = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      );
    return result.length;
  } catch (err) {
    console.error('[notifications] Failed to get unread count:', err);
    return 0;
  }
}

export async function getUserNotifications(
  userId: number,
  page = 1,
  pageSize = 20
) {
  try {
    const offset = (page - 1) * pageSize;
    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { success: true, data: items };
  } catch (err) {
    console.error('[notifications] Failed to list notifications:', err);
    return { success: false, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
