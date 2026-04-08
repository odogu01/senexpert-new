/**
 * Seed Users Script
 * 
 * This script creates default test users in Supabase Auth
 * and assigns their roles in the profiles table.
 * 
 * Usage:
 * 1. Update the SUPABASE_SERVICE_ROLE_KEY in .env.local
 * 2. Run: pnpm exec tsx src/scripts/seedUsers.ts
 * 
 * Or import the function and call seedTestUsers() from your code.
 */

import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/supabase';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

// ============================================
// Configuration
// ============================================

// Get from your Supabase project: Settings > API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration!');
  console.log('Please add to .env.local:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create admin client with service role (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================
// Test Users Configuration
// ============================================

interface TestUser {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
}

const testUsers: TestUser[] = [
  {
    email: 'superadmin@test.com',
    password: 'SuperAdmin123!',
    role: 'super_admin',
    fullName: 'Super Admin',
  },
  {
    email: 'admin@test.com',
    password: 'Admin123!',
    role: 'admin',
    fullName: 'Admin User',
  },
  {
    email: 'hr@test.com',
    password: 'Hr123!',
    role: 'hr',
    fullName: 'HR Manager',
  },
  {
    email: 'manager@test.com',
    password: 'Manager123!',
    role: 'manager',
    fullName: 'Team Manager',
  },
];

// ============================================
// Helper Functions
// ============================================

async function createUser(user: TestUser): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Check if user already exists by listing users and filtering
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = usersList?.users.find(u => u.email === user.email);
    
    if (existingUser) {
      console.log(`  User already exists: ${user.email}`);
      
      // Update existing user's role in profiles
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          role: user.role,
          full_name: user.fullName,
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.log(`  ⚠️  Failed to update role: ${updateError.message}`);
      } else {
        console.log(`  ✓  Updated role for existing user: ${user.email}`);
      }
      return { success: true, userId: existingUser.id };
    }

    // Create new user using the admin API with explicit options
    console.log(`  Creating user: ${user.email}...`);
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        role: user.role,
      },
    });

    if (error) {
      console.log(`  ❌ Error creating user: ${error.message}`);
      return { success: false, error: error.message };
    }

    if (!data.user) {
      console.log(`  ❌ No user data returned`);
      return { success: false, error: 'No user data returned' };
    }

    console.log(`  ✓ User created in auth.users: ${data.user.id}`);

    // Wait a moment for the trigger to fire
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if profile was created by trigger
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (existingProfile) {
      console.log(`  ✓ Profile created by trigger`);
      
      // Update the role if needed
      if (existingProfile.role !== user.role) {
        await supabaseAdmin
          .from('profiles')
          .update({ role: user.role })
          .eq('id', data.user.id);
        console.log(`  ✓ Role updated to: ${user.role}`);
      }
    } else {
      // Create profile manually if trigger didn't work
      console.log(`  Creating profile manually...`);
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: user.fullName,
          role: user.role,
        });

      if (profileError) {
        console.log(`  ❌ Error creating profile: ${profileError.message}`);
        return { success: false, error: profileError.message };
      }
      console.log(`  ✓ Profile created manually`);
    }

    console.log(`  ✓  Created user: ${user.email} (${user.role})`);
    return { success: true, userId: data.user.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.log(`  ❌ Exception: ${message}`);
    return { success: false, error: message };
  }
}

// ============================================
// Main Seeding Function
// ============================================

export async function seedTestUsers(): Promise<void> {
  console.log('\n🌱 Starting user seeding...\n');

  const results = await Promise.all(
    testUsers.map(async (user) => {
      const result = await createUser(user);
      return { ...user, ...result };
    })
  );

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log('\n📊 Seeding Summary:');
  console.log(`  ✓ Successful: ${successful}/${testUsers.length}`);
  console.log(`  ✗ Failed: ${failed}/${testUsers.length}`);

  if (failed > 0) {
    console.log('\n❌ Failed users:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`    - ${r.email}: ${r.error}`);
      });
  } else {
    console.log('\n✅ All test users created successfully!');
    console.log('\n📝 Login credentials:');
    console.log('┌─────────────────────┬──────────────────┬──────────────┐');
    console.log('│ Email               │ Password         │ Role         │');
    console.log('├─────────────────────┼──────────────────┼──────────────┤');
    testUsers.forEach((u) => {
      console.log(`│ ${u.email.padEnd(19)} │ ${u.password.padEnd(16)} │ ${u.role.padEnd(12)} │`);
    });
    console.log('└─────────────────────┴──────────────────┴──────────────┘');
  }

  console.log('\n');
}

// ============================================
// CLI Execution
// ============================================

// Only run if executed directly (not imported)
if (require.main === module) {
  seedTestUsers()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}
