import { createClient } from '@supabase/supabase-js';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * This file creates and exports the Supabase client instance.
 * It uses environment variables for configuration:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key
 * 
 * These should be set in your .env.local file.
 */

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Helper function to validate URL
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Validate configuration before creating client
const isConfigured = supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl);

if (!isConfigured) {
  console.warn(
    '⚠️  Supabase configuration missing or invalid!\n' +
    'Please add the following to your .env.local file:\n' +
    'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key\n\n' +
    'Get these from: https://app.supabase.com/project/_/settings/api'
  );
}

// Create and export the Supabase client (only if configured)
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Type definitions for better TypeScript support
 */
export type UserRole = 'super_admin' | 'admin' | 'hr' | 'manager';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: AuthError | null;
}

// Re-export types from Supabase
export type { Session, User };
