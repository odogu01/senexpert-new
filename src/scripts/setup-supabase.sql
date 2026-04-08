-- =====================================================
-- Supabase Database Setup for SenExpert Global
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to set up:
-- 1. profiles table with RLS
-- 2. Row Level Security policies
-- 3. Default test users
-- =====================================================

-- =====================================================
-- STEP 1: Create the profiles table
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'hr', 'manager');
    END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT 'User',
    role user_role NOT NULL DEFAULT 'manager',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase Auth';
COMMENT ON COLUMN public.profiles.id IS 'Primary key and foreign key to auth.users';
COMMENT ON COLUMN public.profiles.full_name IS 'User''s full name';
COMMENT ON COLUMN public.profiles.role IS 'User role for access control';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp when profile was created';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp when profile was last updated';

-- =====================================================
-- STEP 2: Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Create RLS Policies
-- =====================================================

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Policy: Only super_admin can read all profiles
CREATE POLICY "Super admins can read all profiles"
ON public.profiles FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- Policy: Only super_admin can update any profile
CREATE POLICY "Super admins can update any profile"
ON public.profiles FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- Policy: Only super_admin can insert new profiles
CREATE POLICY "Super admins can insert profiles"
ON public.profiles FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- Policy: Only super_admin can delete profiles
CREATE POLICY "Super admins can delete profiles"
ON public.profiles FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- =====================================================
-- STEP 4: Create Function to Auto-Create Profile
-- =====================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'manager')::user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 5: Create Helper Views
-- =====================================================

-- View to get user info with profile data
CREATE OR REPLACE VIEW public.user_with_profile AS
SELECT 
    au.id,
    au.email,
    au.created_at as user_created_at,
    au.email_confirmed_at,
    p.full_name,
    p.role,
    p.created_at as profile_created_at,
    p.updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;

-- =====================================================
-- STEP 6: Seed Default Test Users
-- =====================================================
-- Note: Run these commands manually or use the Admin API
-- to create users with specific passwords
-- =====================================================

-- To create test users, use Supabase Admin API or run:
-- Note: You cannot insert directly into auth.users table
-- Use Supabase Dashboard > Authentication > Users > Add User
-- Or use the Supabase CLI: supabase auth sign-up
-- Or use the Admin API in your application

/*
-- Example: Create users via SQL (requires service role key)
-- These are placeholder comments - see documentation below
*/

-- =====================================================
-- INSTRUCTIONS FOR CREATING TEST USERS
-- =====================================================
-- 
-- Option 1: Using Supabase Dashboard
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Go to Authentication > Users
-- 4. Click "Add user" and create these users:
--
--    Email                  | Password      | Role
--    --------------------- | ------------- | -----------
--    superadmin@test.com    | SuperAdmin123! | super_admin
--    admin@test.com         | Admin123!     | admin
--    hr@test.com            | Hr123!        | hr
--    manager@test.com       | Manager123!   | manager
--
-- Option 2: Using Supabase CLI
-- supabase auth sign-up --email superadmin@test.com --password SuperAdmin123!
-- (Then manually update role in profiles table)
--
-- Option 3: Using Admin API in your application
-- See: src/scripts/seedUsers.ts for programmatic seeding
-- =====================================================

-- =====================================================
-- STEP 7: Update User Roles (After Creating Users)
-- =====================================================

-- Run this AFTER creating the users to set their roles:
-- (Replace the UUIDs with actual user IDs from auth.users)

-- UPDATE public.profiles 
-- SET role = 'super_admin'::user_role 
-- WHERE id = 'uuid-of-superadmin-user';

-- UPDATE public.profiles 
-- SET role = 'admin'::user_role 
-- WHERE id = 'uuid-of-admin-user';

-- UPDATE public.profiles 
-- SET role = 'hr'::user_role 
-- WHERE id = 'uuid-of-hr-user';

-- UPDATE public.profiles 
-- SET role = 'manager'::user_role 
-- WHERE id = 'uuid-of-manager-user';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if profiles table exists and has correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if trigger exists
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
