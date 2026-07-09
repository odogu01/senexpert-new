// @ts-nocheck
import { BaseRepository } from './BaseRepository';

export class NotificationRepository extends BaseRepository<any> {
  constructor() {
    super('notifications');
  }

  /**
   * Get notifications for a specific user, newest first.
   */
  async findByRecipient(recipientId: string, limit = 50, skip = 0) {
    return this.findAll(
      { recipient_id: recipientId },
      { sort: { created_at: -1 }, limit, skip },
    );
  }

  /**
   * Count unread notifications for a user.
   */
  async countUnread(recipientId: string): Promise<number> {
    return this.countDocuments({ recipient_id: recipientId, is_read: false });
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: string): Promise<boolean> {
    const result = await this.updateOneRaw(id, { is_read: true, read_at: new Date() });
    return result.matchedCount > 0;
  }

  /**
   * Mark all notifications for a user as read.
   */
  async markAllAsRead(recipientId: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.updateMany(
      { recipient_id: recipientId, is_read: false },
      { $set: { is_read: true, read_at: new Date(), updated_at: new Date() } },
    );
    return result.modifiedCount > 0;
  }
}
