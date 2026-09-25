// @ts-nocheck
import { BaseRepository } from './BaseRepository';

/** Separate, longer-retention activity stream reserved for developer review. */
export class DevAuditLogRepository extends BaseRepository<any> {
  constructor() {
    super('dev_audit_logs');
  }

  async getRecent(limit = 100) {
    return this.findAll({}, { sort: { committed_at: -1 }, limit });
  }

  async recordCommit(commit: {
    commit_sha: string; message: string; author_name: string; author_email?: string;
    committed_at: Date; pushed_at: Date; branch: string; repository: string;
    url: string; feature_added: boolean; changed_files: string[];
  }) {
    const collection = await this.getCollection();
    await collection.updateOne(
      { commit_sha: commit.commit_sha },
      { $set: commit, $setOnInsert: { created_at: new Date() } },
      { upsert: true },
    );
  }
}
