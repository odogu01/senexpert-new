// @ts-nocheck
import { BaseRepository } from './BaseRepository';

export class MaintenanceRepository extends BaseRepository<any> {
  constructor() {
    super('maintenance');
  }

  /**
   * Fetch maintenance records with optional filters, sorted by scheduled_date.
   */
  async findAllFiltered(filters?: { status?: string; tool_id?: string }) {
    const query: Record<string, any> = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.tool_id) query.tool_id = filters.tool_id;
    return this.findAll(query, { sort: { scheduled_date: 1 } });
  }
}
