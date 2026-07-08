// @ts-nocheck
/**
 * Database backup script.
 * Run: npx tsx src/scripts/backup.ts
 * Scheduled via cron (Linux/Mac) or Task Scheduler (Windows).
 *
 * Backup strategy:
 * - Full mongodump to timestamped directory
 * - Retains last 30 backups, purges older ones
 * - Logs success/failure to backup.log
 */
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, appendFileSync } from 'fs';
import { join } from 'path';

const BACKUP_DIR = join(process.cwd(), 'backups');
const RETENTION_COUNT = 30;
const LOG_FILE = join(BACKUP_DIR, 'backup.log');

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
    appendFileSync(LOG_FILE, line + '\n');
  } catch { /* silent fail on log write */ }
}

async function runBackup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    log('ERROR: MONGODB_URI environment variable not set');
    process.exit(1);
  }

  // Parse DB name from URI
  const dbMatch = uri.match(/\/([^/?]+)(\?|$)/);
  const dbName = dbMatch ? dbMatch[1] : 'senexpert';

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dumpDir = join(BACKUP_DIR, `mongodump-${dbName}-${timestamp}`);

  try {
    if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

    log(`Starting backup of database "${dbName}"...`);

    execSync(
      `mongodump --uri="${uri}" --out="${dumpDir}" --gzip`,
      { stdio: 'pipe', timeout: 300_000 }, // 5 min timeout
    );

    log(`Backup complete: ${dumpDir}`);

    // Rotate old backups
    const entries = readdirSync(BACKUP_DIR)
      .filter((e) => e.startsWith('mongodump-'))
      .sort()
      .reverse();

    if (entries.length > RETENTION_COUNT) {
      const toRemove = entries.slice(RETENTION_COUNT);
      for (const entry of toRemove) {
        const fullPath = join(BACKUP_DIR, entry);
        rmSync(fullPath, { recursive: true, force: true });
        log(`Purged old backup: ${entry}`);
      }
    }

    log(`Backup finished successfully. ${entries.length} backup(s) retained.`);
  } catch (err) {
    log(`ERROR: Backup failed — ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

runBackup();
