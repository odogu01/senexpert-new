// @ts-nocheck
import { BaseRepository } from './BaseRepository';

export class ToolRepository extends BaseRepository<any> {
  constructor() {
    super('tools');
  }

  /**
   * Build the common filter query (excludes zero-quantity tools).
   */
  _buildFilterQuery(filters?: {
    category?: string;
    status?: string;
    location?: string;
    search?: string;
    lowStock?: boolean;
    created_by?: string;
    created_after?: string;
  }): Record<string, any> {
    const query: Record<string, any> = {};

    if (filters?.category) query.category = filters.category;
    if (filters?.status) query.status = filters.status;
    if (filters?.location) query.location = filters.location;
    if (filters?.created_by) query.created_by = filters.created_by;
    if (filters?.created_after) {
      query.created_at = { $gte: new Date(filters.created_after) };
    }
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { work_order_number: { $regex: filters.search, $options: 'i' } },
        { part_number: { $regex: filters.search, $options: 'i' } },
      ];
    }
    if (filters?.lowStock) {
      query.$expr = { $lte: ['$quantity', { $ifNull: ['$min_quantity', 1] }] };
    }

    return query;
  }

  /**
   * List tools with optional filters. Excludes zero-quantity tools.
   * When page/limit are provided, returns paginated results with total count.
   * Without pagination params, returns all matching tools (backward-compatible).
   */
  async findAllFiltered(filters?: {
    category?: string;
    status?: string;
    location?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string; // e.g. "name" or "-created_at" (descending)
    lowStock?: boolean;
    created_by?: string;
    created_after?: string;
  }): Promise<{ data: any[]; total?: number }> {
    const query = this._buildFilterQuery(filters);
    const col = await this.getCollection();

    // Build sort object from sort string: "-created_at" → { created_at: -1 }
    const sortField = filters?.sort ?? 'name';
    const sortDir = sortField.startsWith('-') ? -1 : 1;
    const sortKey = sortField.startsWith('-') ? sortField.slice(1) : sortField;
    const sort: Record<string, 1 | -1> = { [sortKey]: sortDir };

    // Paginated mode — when either page or limit is explicitly provided
    if (filters?.page !== undefined || filters?.limit !== undefined) {
      const page = Math.max(1, filters.page ?? 1);
      const limit = Math.min(100, Math.max(1, filters.limit ?? 10));
      const skip = (page - 1) * limit;

      const [docs, total] = await Promise.all([
        col.find(query).sort(sort).skip(skip).limit(limit).toArray(),
        col.countDocuments(query),
      ]);

      return { data: this.toAppList(docs), total };
    }

    // Non-paginated mode — return all matching docs
    const docs = await col.find(query).sort(sort).toArray();
    return { data: this.toAppList(docs) };
  }

  /**
   * Get distinct categories from tools that have quantity > 0.
   */
  async getCategories(): Promise<string[]> {
    return this.distinct('category');
  }

  async getLocations(): Promise<string[]> {
    return this.distinct('location');
  }

  /**
   * Update tool — quantity can go to 0 but the document stays in the database
   * for record-keeping. The _buildFilterQuery filter ({ quantity: { $gt: 0 } })
   * keeps zero-quantity tools out of inventory lists.
   */
  async updateWithAutoDelete(
    id: string,
    updates: Record<string, any>,
  ): Promise<{ data?: any; deleted?: boolean; error?: string }> {
    const mongodb = await this.getMongoDb();
    const col = await this.getCollection();

    let oid: any;
    try { oid = new mongodb.ObjectId(id); } catch { return { error: 'Invalid tool ID' }; }

    // Clamp quantity to 0 minimum — no more auto-delete
    if (updates.quantity !== undefined) {
      updates.quantity = Math.max(0, updates.quantity);
    }

    const result = await col.findOneAndUpdate(
      { _id: oid },
      { $set: { ...updates, updated_at: new Date() } },
      { returnDocument: 'after' },
    );
    if (!result) return { error: 'Tool not found' };
    return { data: this.toApp(result) };
  }
}
