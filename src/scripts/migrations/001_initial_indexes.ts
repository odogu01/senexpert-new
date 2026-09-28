// @ts-nocheck
import type { Db } from 'mongodb';

/** Existing application indexes, captured as the first tracked migration. */
export const id = '001_initial_indexes';
export const description = 'Create application query, uniqueness, and retention indexes';

export async function up(db: Db) {
  await db.collection('tools').createIndex(
    { quantity: 1, name: 1 },
    { name: 'idx_quantity_name' },
  );
  await db.collection('tools').createIndex(
    { name: 1 },
    { name: 'idx_name' },
  );
  await db.collection('users').createIndex(
    { email: 1 },
    { name: 'idx_user_email', unique: true },
  );
  await db.collection('tool_requests').createIndex(
    { ref_number: 1 },
    { name: 'idx_tool_request_ref', unique: true, sparse: true },
  );
  await db.collection('tool_requests').createIndex(
    { requested_by: 1, status: 1, created_at: -1 },
    { name: 'idx_tool_request_owner_status' },
  );
  await db.collection('financial_requests').createIndex(
    { requested_by: 1, status: 1, created_at: -1 },
    { name: 'idx_financial_request_owner_status' },
  );
  await db.collection('audit_logs').createIndex(
    { created_at: 1 },
    { name: 'idx_audit_logs_ttl', expireAfterSeconds: 90 * 24 * 60 * 60 },
  );
  await db.collection('notifications').createIndex(
    { recipient_id: 1, created_at: -1 },
    { name: 'idx_notif_recipient_created' },
  );
  await db.collection('notifications').createIndex(
    { recipient_id: 1, is_read: 1 },
    { name: 'idx_notif_recipient_unread' },
  );
}
