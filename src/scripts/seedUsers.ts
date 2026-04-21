/**
 * Seed Script - Create test users in MongoDB
 * Run with: npx tsx src/scripts/seedUsers.ts
 */

import 'dotenv/config';
import { connectToDatabase, getCollection } from '../lib/mongodb';
import type { User, Profile, UserRole } from '../lib/database.types';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

interface SeedUser {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

const seedUsers: SeedUser[] = [
  {
    email: 'superadmin@test.com',
    password: 'Test@123',
    full_name: 'Super Admin',
    role: 'super_admin',
  },
  {
    email: 'admin@test.com',
    password: 'Test@123',
    full_name: 'Admin User',
    role: 'admin',
  },
  {
    email: 'hr@test.com',
    password: 'Test@123',
    full_name: 'HR Manager',
    role: 'hr',
  },
  {
    email: 'manager@test.com',
    password: 'Test@123',
    full_name: 'Operations Manager',
    role: 'manager',
  },
  {
    email: 'operator@test.com',
    password: 'Test@123',
    full_name: 'Field Operator',
    role: 'operator',
  },
];

async function seed() {
  console.log('🌱 Starting seed process...\n');

  try {
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    const usersCollection = getCollection<User>('users');
    const profilesCollection = getCollection<Profile>('profiles');

    for (const seedUser of seedUsers) {
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email: seedUser.email.toLowerCase() });

      if (existingUser) {
        console.log(`⚠️  User ${seedUser.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const password_hash = await bcrypt.hash(seedUser.password, 12);

      // Create user
      const user: User = {
        _id: new ObjectId(),
        email: seedUser.email.toLowerCase(),
        password_hash,
        full_name: seedUser.full_name,
        role: seedUser.role,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await usersCollection.insertOne(user);
      console.log(`✅ Created user: ${seedUser.email} (${seedUser.role})`);

      // Create profile
      const profile: Profile = {
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await profilesCollection.insertOne(profile);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Test Users:');
    for (const user of seedUsers) {
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seed();