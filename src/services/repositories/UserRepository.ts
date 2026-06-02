// @ts-nocheck
import { BaseRepository } from './BaseRepository';

export class UserRepository extends BaseRepository<any> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string) {
    return this.findOne({ email: email.toLowerCase() });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const col = await this.getCollection();
    const count = await col.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  /**
   * Bulk-update a user's password hash (admin reset or self-change).
   */
  async updatePassword(userId: string, passwordHash: string): Promise<boolean> {
    const mongodb = await this.getMongoDb();
    const col = await this.getCollection();
    let oid: any;
    try { oid = new mongodb.ObjectId(userId); } catch { return false; }
    const result = await col.updateOne(
      { _id: oid },
      { $set: { password_hash: passwordHash, updated_at: new Date() } },
    );
    return result.matchedCount > 0;
  }

  /**
   * Returns every user with `id` mapped (password_hash excluded by caller).
   */
  async getAll(): Promise<any[]> {
    return this.findAll({});
  }

  /**
   * Find one by raw ObjectId filter — used internally when we already have
   * a resolved ObjectId.
   */
  async findOneRaw(filter: Record<string, any>) {
    const col = await this.getCollection();
    const doc = await col.findOne(filter);
    return doc ? this.toApp(doc) : null;
  }
}
