/**
 * Wipe ALL data collections — empty slate for production.
 * Run: npx tsx -r dotenv/config src/scripts/wipeAll.ts dotenv_config_path=.env.local
 *
 * Keeps: users + profiles (so login still works)
 * Removes: tools, tool_requests, financial_requests, maintenance, alerts, audit_logs
 */
require('dotenv').config();
const { connectToDatabase, getCollection } = require('../lib/mongodb');

const DATA_COLLECTIONS = ['tools', 'tool_requests', 'financial_requests', 'maintenance', 'alerts', 'audit_logs'];

async function wipe() {
  console.log('🗑️  Wiping all data collections...\n');
  await connectToDatabase();
  console.log('✅ Connected to MongoDB\n');

  let total = 0;
  for (const name of DATA_COLLECTIONS) {
    const col = getCollection(name);
    const count = await col.countDocuments();
    if (count > 0) {
      await col.deleteMany({});
      console.log(`  🧹 Cleared ${name} (${count} documents)`);
      total += count;
    } else {
      console.log(`  ➖ ${name} already empty`);
    }
  }

  console.log(`\n✅ Done. Removed ${total} documents total.`);
  console.log('📊 Remaining:');
  console.log(`   - users: ${await getCollection('users').countDocuments()}`);
  console.log(`   - profiles: ${await getCollection('profiles').countDocuments()}`);
  console.log('\n🌱 Ready for fresh inventory!');
}

wipe().catch((err: Error) => {
  console.error('❌ Wipe failed:', err);
  process.exit(1);
});
