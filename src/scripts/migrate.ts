// @ts-nocheck
import dotenv from 'dotenv';
import { migrations } from './migrations';

// Local runs use .env.local; CI/Vercel environment variables take precedence.
dotenv.config({ path: '.env.local' });
let closeDatabase: (() => Promise<void>) | undefined;

async function migrate() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Configure the target database before migrating.');
  }

  // Import after dotenv has loaded because mongodb.ts captures MONGODB_URI at module load.
  const mongo = await import('@/lib/mongodb');
  closeDatabase = mongo.closeDatabase;
  const { connectToDatabase, getDatabase } = mongo;
  await connectToDatabase();
  const db = getDatabase();
  const ledger = db.collection('_schema_migrations');
  await ledger.createIndex({ migration_id: 1 }, { unique: true, name: 'idx_schema_migration_id' });

  const alreadyApplied = new Set(
    (await ledger.find({}, { projection: { migration_id: 1 } }).toArray())
      .map((entry) => entry.migration_id),
  );

  for (const migration of migrations) {
    if (alreadyApplied.has(migration.id)) {
      console.log(`↷ Skipping ${migration.id} (already applied)`);
      continue;
    }

    console.log(`→ Applying ${migration.id}: ${migration.description}`);
    await migration.up(db);
    await ledger.insertOne({
      migration_id: migration.id,
      description: migration.description,
      applied_at: new Date(),
    });
    console.log(`✓ Applied ${migration.id}`);
  }

  console.log('\nDatabase migrations complete.');
}

migrate()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase?.();
  });
