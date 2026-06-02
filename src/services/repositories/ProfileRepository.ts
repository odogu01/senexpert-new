// @ts-nocheck
import { BaseRepository } from './BaseRepository';

export class ProfileRepository extends BaseRepository<any> {
  constructor() {
    super('profiles');
  }

  /**
   * Find a profile by its _id (which matches the user's _id).
   */
  async findByUserId(userId: string) {
    const mongodb = await this.getMongoDb();
    const col = await this.getCollection();
    let oid: any;
    try { oid = new mongodb.ObjectId(userId); } catch { return null; }
    const doc = await col.findOne({ _id: oid });
    return doc ? this.toApp(doc) : null;
  }

  /**
   * Upsert a profile document (insert if not exists, update if exists).
   */
  async upsertProfile(userId: string, data: Record<string, any>) {
    const mongodb = await this.getMongoDb();
    const col = await this.getCollection();
    let oid: any;
    try { oid = new mongodb.ObjectId(userId); } catch { return null; }
    const result = await col.findOneAndUpdate(
      { _id: oid },
      {
        $set: { ...data, updated_at: new Date() },
        $setOnInsert: { _id: oid, created_at: new Date() },
      },
      { upsert: true, returnDocument: 'after' },
    );
    return result ? this.toApp(result) : null;
  }
}
