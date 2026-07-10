// @ts-nocheck
/**
 * Seed script to import tools from CSV spreadsheet into MongoDB
 *
 * Run: npx tsx src/scripts/seedFromCSV.ts
 *
 * CSV columns: TOOL NAME, W/O, SIZE & THREAD, MATERIAL, MODEL, MATERIAL NO, PART NUMBER, QUANTITY, LOCATION
 *
 * Rules:
 *   Empty cells → "N/A"
 *   Category    → "Saleable"
 *   Status      → "available"
 *   min_quantity = 1
 *   initial_quantity = quantity
 *   Empty quantity → 1
 */

// ─────────────── Dependencies ───────────────
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') });
const fs = require('fs');
const path = require('path');

// ─────────────── Configuration ───────────────
const CSV_PATH = path.resolve(__dirname, '../../senexpert-tool-sheet.csv');
const BATCH_SIZE = 100;

// ─────────────── CSV Parser ───────────────

/**
 * Parse CSV text into array of field arrays.
 * Handles quoted fields with embedded commas and escaped double-quotes ("").
 */
/**
 * Parse CSV text into array of field arrays.
 * Splits on newlines, then handles quoted fields per line.
 * Handles: quoted fields with commas, escaped quotes (""), empty fields.
 */
function parseCSV(text) {
  // Split on newlines — lines themselves contain all quoting
  const rawLines = text.split(/\r?\n/);
  // Filter: skip truly empty lines, keep header and data
  const lines = rawLines.filter((l) => l.trim().length > 0);

  return lines.map((line) => {
    const fields = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && i + 1 < line.length && line[i + 1] === '"') {
          field += '"';
          i++; // skip escaped quote
        } else {
          inQ = !inQ; // toggle quote state
        }
      } else if (ch === ',' && !inQ) {
        fields.push(field.trim());
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  });
}

// ─────────────── Helpers ───────────────

const NA = 'N/A';

function norm(val) {
  const t = (val || '').trim();
  return t.length === 0 ? NA : t;
}

function parseQty(val) {
  const t = (val || '').trim();
  if (t.length === 0) return 1;
  const n = parseInt(t, 10);
  return isNaN(n) || n < 0 ? 1 : n;
}

// ─────────────── Main ───────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║    SenExpert CSV Tool Import             ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 1. Read CSV
  console.log(`📂 Reading: ${CSV_PATH}`);
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ File not found: ${CSV_PATH}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  console.log(`   ${(raw.length / 1024).toFixed(1)} KB read\n`);

  // 2. Parse CSV
  const rows = parseCSV(raw);
  console.log(`📋 Parsed ${rows.length} lines`);
  if (rows.length < 2) {
    console.error('❌ CSV has no data rows (need header + at least 1 data row)');
    process.exit(1);
  }

  const header = rows[0];
  const dataRows = rows.slice(1);
  console.log(`   Header: ${header.join(' | ')}`);
  console.log(`   Data rows: ${dataRows.length}\n`);

  // 3. Build tool documents
  const toolDocs = dataRows.map((row) => ({
    name: norm(row[0]),
    work_order_number: norm(row[1]),
    size_thread: norm(row[2]),
    material: norm(row[3]),
    model: norm(row[4]),
    material_no: norm(row[5]),
    part_number: norm(row[6]),
    quantity: parseQty(row[7]),
    location: norm(row[8]),
    category: 'Saleable',
    status: 'available',
    min_quantity: 1,
    initial_quantity: parseQty(row[7]),
  }));

  // 4. Print summary
  const totalQty = toolDocs.reduce((sum, t) => sum + t.quantity, 0);
  const locMap = {};
  for (const t of toolDocs) {
    locMap[t.location] = (locMap[t.location] || 0) + t.quantity;
  }

  console.log('📊 Import Summary');
  console.log(`   Items (rows):  ${toolDocs.length}`);
  console.log(`   Units (total): ${totalQty}`);
  console.log(`   Locations:     ${Object.keys(locMap).length}`);
  const sortedLocs = Object.entries(locMap).sort((a, b) => b[1] - a[1]);
  for (const [loc, count] of sortedLocs) {
    console.log(`     ${loc.padEnd(15)} ${count} units`);
  }
  console.log('');

  // 5. Connect to MongoDB
  console.log('🔌 Connecting to MongoDB...');
  const { connectToDatabase, getCollection } = require('../lib/mongodb');
  const { ObjectId } = require('mongodb');
  await connectToDatabase();
  const collection = getCollection('tools');
  console.log('   Connected ✓\n');

  // 5b. Optionally clear existing tools
  const shouldClear = process.argv.includes('--clear');
  if (shouldClear) {
    const before = await collection.countDocuments({});
    await collection.deleteMany({});
    console.log(`   🧹 Cleared ${before} existing tools\n`);
  }

  // 6. Insert in batches
  let success = 0;
  let errors = 0;
  let skipped = 0;

  console.log(`💾 Inserting ${toolDocs.length} tools in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < toolDocs.length; i += BATCH_SIZE) {
    const batch = toolDocs.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toolDocs.length / BATCH_SIZE);
    const rangeStart = i + 1;
    const rangeEnd = Math.min(i + BATCH_SIZE, toolDocs.length);

    // Build docs with ObjectId and timestamps
    const docs = batch.map((doc) => ({
      _id: new ObjectId(),
      ...doc,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    try {
      const result = await collection.insertMany(docs, { ordered: false });
      success += result.insertedCount;
      const skippedInBatch = batch.length - result.insertedCount;
      skipped += skippedInBatch;
      process.stdout.write(`  Batch ${batchNum}/${totalBatches} (rows ${rangeStart}-${rangeEnd}): ${result.insertedCount} inserted`);
      if (skippedInBatch > 0) process.stdout.write(`, ${skippedInBatch} skipped`);
      process.stdout.write('\n');
    } catch (err) {
      // ordered: false may throw but partial results are applied
      if (err.insertedDocs) {
        success += err.insertedDocs.length;
      }
      errors++;
      console.error(`  ✗ Batch ${batchNum} failed: ${err.message}`);
    }
  }

  // 7. Final summary
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║             IMPORT COMPLETE              ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`   ✅ Inserted:  ${success}`);
  console.log(`   ⏭️  Skipped:   ${skipped}`);
  console.log(`   ❌ Batches:   ${errors}`);
  console.log(`   📦 Items:     ${toolDocs.length}`);
  console.log(`   📊 Units:     ${totalQty}`);

  // 8. Verify
  const totalDocs = await collection.countDocuments({});
  const today = new Date().toISOString().split('T')[0];
  const todayImports = await collection.countDocuments({
    created_at: { $gte: new Date(today) },
  });
  console.log(`\n🔍 Verification:`);
  console.log(`   Total tools in DB: ${totalDocs}`);
  console.log(`   Imported today:    ${todayImports}`);
  console.log('');

  // 9. Show sample
  const sample = await collection.find({}).sort({ created_at: -1 }).limit(3).toArray();
  console.log('📝 Sample of imported tools:');
  for (const doc of sample) {
    console.log(`   ${doc._id} | ${doc.name} | ${doc.part_number} | ${doc.quantity}x | ${doc.location}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
