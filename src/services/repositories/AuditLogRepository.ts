// @ts-nocheck
import { BaseRepository } from './BaseRepository';

export class AuditLogRepository extends BaseRepository<any> {
  constructor() {
    super('audit_logs');
  }

  /**
   * Get the most recent audit log entries for the activity feed.
   */
  async getRecent(limit = 10) {
    return this.findAll({}, { sort: { created_at: -1 }, limit });
  }

  /**
   * Fetch audit logs with optional filters, pagination, newest first.
   */
  async findAllFiltered(filters?: {
    userId?: string;
    action?: string;
    tableName?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
  }) {
    const query: Record<string, any> = {};

    if (filters?.userId) query.user_id = filters.userId;
    if (filters?.action) query.action = filters.action;
    if (filters?.tableName) query.table_name = filters.tableName;
    if (filters?.startDate || filters?.endDate) {
      query.created_at = {};
      if (filters.startDate) query.created_at.$gte = filters.startDate;
      if (filters.endDate) query.created_at.$lte = filters.endDate;
    }

    return this.findAll(query, {
      sort: { created_at: -1 },
      limit: filters?.limit ?? 50,
      skip: filters?.skip ?? 0,
    });
  }
}
