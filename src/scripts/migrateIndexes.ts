// @ts-nocheck
/**
 * Migration script: add MongoDB indexes for query performance.
 * Run: npx tsx src/scripts/migrateIndexes.ts
 */
import { connectToDatabase, getDatabase, closeDatabase } from '@/lib/mongodb';

async function migrate() {
  await connectToDatabase();
  const db = getDatabase();

  // Tools collection: compound index for paginated queries
  // The main query pattern: find({ quantity: { $gt: 0 } }).sort({ name: 1 })
  await db.collection('tools').createIndex(
    { quantity: 1, name: 1 },
    { name: 'idx_quantity_name' },
  );
  console.log('✓ Created index tools: { quantity: 1, name: 1 }');

  // Text search index for $regex on name, work_order_number, part_number
  // A text index would be better but require different query syntax;
  // keeping existing $regex approach but listing indexes for visibility
  await db.collection('tools').createIndex(
    { name: 1 },
    { name: 'idx_name' },
  );
  console.log('✓ Created index tools: { name: 1 }');

  // Users collection: email index for login lookups
  await db.collection('users').createIndex(
    { email: 1 },
    { name: 'idx_user_email', unique: true },
  );
  console.log('✓ Created index users: { email: 1 }');

  // Audit logs collection: TTL index for 90-day auto-expiry
  // Prevents MongoDB Atlas free tier (512MB) from filling up
  await db.collection('audit_logs').createIndex(
    { created_at: 1 },
    { name: 'idx_audit_logs_ttl', expireAfterSeconds: 90 * 24 * 60 * 60 },
  );
  console.log('✓ Created TTL index audit_logs: { created_at: 1 } (90-day expiry)');

  await closeDatabase();
  console.log('\nMigration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
