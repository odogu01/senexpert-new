// @ts-nocheck
import type { Db, Collection, MongoClient as MongoClientType, Document } from 'mongodb';

let mongoClientModule: Promise<typeof import('mongodb')> | null = null;
let client: MongoClientType | null = null;
let db: Db | null = null;
let connecting: Promise<void> | null = null;

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = 'senexpert';

async function getMongoClient(): Promise<typeof import('mongodb')> {
  if (!mongoClientModule) {
    mongoClientModule = import('mongodb');
  }
  return mongoClientModule;
}

/**
 * Connect to MongoDB (with connection lock to prevent race conditions)
 */
export async function connectToDatabase(): Promise<void> {
  if (db) return;
  if (connecting) return connecting;

  connecting = (async () => {
    const mongodb = await getMongoClient();
    client = new mongodb.MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      retryReads: true,
    });
    try {
      await client.connect();
      db = client.db(DB_NAME);
      console.log('Connected to MongoDB');
    } catch (err) {
      // Reset so the next caller can retry
      client = null;
      connecting = null;
      throw err;
    }
  })();

  return connecting;
}

/**
 * Get database instance
 */
export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

/**
 * Get a collection from the database
 */
export function getCollection<T extends Document = Document>(name: string): Collection<T> {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db.collection(name) as any;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}