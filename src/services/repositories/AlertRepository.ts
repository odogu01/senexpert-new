// @ts-nocheck
import { BaseRepository } from './BaseRepository';

export class AlertRepository extends BaseRepository<any> {
  constructor() {
    super('alerts');
  }

  /**
   * Fetch alerts, newest first. Optionally only unread.
   */
  async findAllFiltered(unreadOnly = false) {
    const query: Record<string, any> = {};
    if (unreadOnly) query.is_read = false;
    return this.findAll(query, { sort: { created_at: -1 } });
  }

  /**
   * Mark a single alert as read.
   */
  async markAsRead(id: string): Promise<boolean> {
    const result = await this.updateOneRaw(id, { is_read: true });
    return result.matchedCount > 0;
  }
}
