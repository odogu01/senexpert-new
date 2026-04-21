import type { Db, Collection, MongoClient as MongoClientType } from 'mongodb';

let mongoClientModule: Promise<typeof import('mongodb')> | null = null;
let client: MongoClientType | null = null;
let db: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = 'senexpert';

async function getMongoClient(): Promise<typeof import('mongodb')> {
  if (!mongoClientModule) {
    mongoClientModule = import('mongodb');
  }
  return mongoClientModule;
}

/**
 * Connect to MongoDB
 */
export async function connectToDatabase(): Promise<void> {
  if (db) return;
  
  const mongodb = await getMongoClient();
  client = new mongodb.MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log('Connected to MongoDB');
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
export function getCollection(name: string): Collection {
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