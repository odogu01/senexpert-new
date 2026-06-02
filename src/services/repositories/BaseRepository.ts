// @ts-nocheck
/**
 * Base Repository
 * Generic CRUD operations over the native MongoDB driver.
 * All repositories extend this class to inherit consistent data access.
 *
 * Why a repository layer?
 * - Eliminates repetitive ObjectId / _id-to-id boilerplate
 * - Gives a single place to fix connection & mapping logic
 * - Domain-specific queries live in named methods, not inline pipeline objects
 */

export type SortDir = 1 | -1;

export interface FindOptions {
  sort?: Record<string, SortDir>;
  limit?: number;
  skip?: number;
}

/**
 * Generic repository. T is the app-level type (e.g. Tool).
 * The class handles _id → id mapping internally.
 */
export class BaseRepository<T extends Record<string, any>> {
  constructor(protected readonly collectionName: string) {}

  // ───────── Dynamic import helpers (server-only) ─────────

  /**
   * Get the underlying MongoDB collection.
   * Public so that service code can run ad-hoc queries when the
   * repository methods don't cover a specific need.
   */
  async getCollection(): Promise<any> {
    const { connectToDatabase, getCollection } = await import('@/lib/mongodb');
    await connectToDatabase();
    return getCollection(this.collectionName);
  }

  protected async getMongoDb(): Promise<typeof import('mongodb')> {
    return import('mongodb');
  }

  // ───────── Document mapping ─────────

  /**
   * Convert a raw MongoDB doc (with _id) to an app-friendly shape (with id).
   */
  protected toApp<TDoc extends Record<string, any>>(doc: TDoc): TDoc & { id: string } {
    const { _id, ...rest } = doc;
    return { id: _id?.toString() ?? '', ...rest } as any;
  }

  protected toAppList<TDoc extends Record<string, any>>(docs: TDoc[]): (TDoc & { id: string })[] {
    return docs.map((d) => this.toApp(d));
  }

  // ───────── CRUD ─────────

  async findAll(filter: Record<string, any> = {}, options?: FindOptions): Promise<(T & { id: string })[]> {
    const col = await this.getCollection();
    let cursor = col.find(filter);
    if (options?.sort) cursor = cursor.sort(options.sort);
    if (options?.limit) cursor = cursor.limit(options.limit);
    if (options?.skip) cursor = cursor.skip(options.skip);
    const docs = await cursor.toArray();
    return this.toAppList(docs);
  }

  async findById(id: string): Promise<(T & { id: string }) | null> {
    const mongodb = await this.getMongoDb();
    const col = await this.getCollection();
    let oid: any;
    try { oid = new mongodb.ObjectId(id); } catch { return null; }
    const doc = await col.findOne({ _id: oid });
    return doc ? this.toApp(doc) : null;
  }

  async findOne(filter: Record<string, any>): Promise<(T & { id: string }) | null> {
    const col = await this.getCollection();
    const doc = await col.findOne(filter);
    return doc ? this.toApp(doc) : null;
  }

  async insertOne(data: Partial<T>): Promise<(T & { id: string })> {
    const mongodb = await this.getMongoDb();
    const col = await this.getCollection();
    const doc = {
      _id: new mongodb.ObjectId(),
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await col.insertOne(doc);
    return this.toApp(doc);
  }

  /**
   * Update a document by its string ID. Returns the updated document or null.
   */
  async updateOne(id: string, updates: Partial<T>): Promise<(T & { id: string }) | null> {
    const mongodb = await this.getMongoDb();
    const col = await this.getCollection();
    let oid: any;
    try { oid = new mongodb.ObjectId(id); } catch { return null; }
    const result = await col.findOneAndUpdate(
      { _id: oid },
      { $set: { ...updates, updated_at: new Date() } },
      { returnDocument: 'after' },
    );
    return result ? this.toApp(result) : null;
  }

  /**
   * Low-level update for status transitions where we only need matchedCount.
   * Returns { matchedCount } so callers can check if the document existed.
   */
  async updateOneRaw(id: string, updates: Record<string, any>): Promise<{ matchedCount: number }> {
    const mongodb = await this.getMongoDb();
    const col = await this.getCollection();
    let oid: any;
    try { oid = new mongodb.ObjectId(id); } catch { return { matchedCount: 0 }; }
    const result = await col.updateOne(
      { _id: oid },
      { $set: { ...updates, updated_at: new Date() } },
    );
    return { matchedCount: result.matchedCount };
  }

  /**
   * Advanced findOneAndUpdate — useful when you need the old document for audit.
   */
  async findOneAndUpdate(
    filter: Record<string, any>,
    update: Record<string, any>,
    opts?: { returnDocument?: 'before' | 'after' },
  ): Promise<(T & { id: string }) | null> {
    const col = await this.getCollection();
    const result = await col.findOneAndUpdate(filter, update, {
      returnDocument: opts?.returnDocument ?? 'after',
    });
    return result ? this.toApp(result) : null;
  }

  async deleteOne(id: string): Promise<boolean> {
    const mongodb = await this.getMongoDb();
    const col = await this.getCollection();
    let oid: any;
    try { oid = new mongodb.ObjectId(id); } catch { return false; }
    const result = await col.deleteOne({ _id: oid });
    return result.deletedCount > 0;
  }

  /**
   * Delete and return the deleted document (for audit logging).
   */
  async deleteOneWithDoc(id: string): Promise<(T & { id: string }) | null> {
    const mongodb = await this.getMongoDb();
    const col = await this.getCollection();
    let oid: any;
    try { oid = new mongodb.ObjectId(id); } catch { return null; }
    const doc = await col.findOne({ _id: oid });
    if (!doc) return null;
    await col.deleteOne({ _id: oid });
    return this.toApp(doc);
  }

  // ───────── Aggregation & utilities ─────────

  async aggregate(pipeline: Record<string, any>[]): Promise<any[]> {
    const col = await this.getCollection();
    return col.aggregate(pipeline).toArray();
  }

  async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    const col = await this.getCollection();
    return col.countDocuments(filter);
  }

  async distinct(field: string, filter: Record<string, any> = {}): Promise<any[]> {
    const col = await this.getCollection();
    return col.distinct(field, filter);
  }

  /**
   * Run a raw cursor-based find (for cases where findAll doesn't cut it).
   * Returns app-mapped docs.
   */
  async findRaw(filter: Record<string, any>): Promise<(T & { id: string })[]> {
    const col = await this.getCollection();
    const docs = await col.find(filter).toArray();
    return this.toAppList(docs);
  }
}
