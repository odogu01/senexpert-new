// @ts-nocheck
/**
 * Notification Service — Server-only
 *
 * Creates and retrieves user-targeted notifications.
 * Notifications are separate from alerts (which are system-level warnings).
 */
import { NotificationRepository } from '@/services/repositories';

const notificationRepo = new NotificationRepository();

export async function createNotification(notification: {
  recipient_id: string;
  sender_id?: string;
  sender_name?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  related_id?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await notificationRepo.insertOne({
      recipient_id: notification.recipient_id,
      sender_id: notification.sender_id,
      sender_name: notification.sender_name,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      related_id: notification.related_id,
      is_read: false,
    });
    return { success: true };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

export async function getNotifications(
  recipientId: string,
  limit = 50,
  skip = 0,
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const data = await notificationRepo.findByRecipient(recipientId, limit, skip);
    return { success: true, data: data as any };
  } catch (error) {
    console.error('Get notifications error:', error);
    return { success: false, error: 'Failed to fetch notifications' };
  }
}

export async function getUnreadCount(
  recipientId: string,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const count = await notificationRepo.countUnread(recipientId);
    return { success: true, data: count };
  } catch (error) {
    console.error('Unread count error:', error);
    return { success: false, error: 'Failed to count unread' };
  }
}

export async function markNotificationAsRead(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const ok = await notificationRepo.markAsRead(id);
    if (!ok) return { success: false, error: 'Notification not found' };
    return { success: true };
  } catch (error) {
    console.error('Mark notification error:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

export async function markAllNotificationsAsRead(
  recipientId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await notificationRepo.markAllAsRead(recipientId);
    return { success: true };
  } catch (error) {
    console.error('Mark all error:', error);
    return { success: false, error: 'Failed to mark all as read' };
  }
}
