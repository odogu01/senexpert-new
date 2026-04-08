-- =====================================================
-- Manual User Creation SQL
-- Run this in Supabase SQL Editor to create test users
-- =====================================================

-- First, let's disable the trigger temporarily so we can create users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now create users using Admin API - but we need to use the dashboard UI
-- Since we can't insert directly into auth.users, let's check if users exist

-- This SQL will help you check existing users
SELECT id, email, created_at FROM auth.users WHERE email IN (
  'superadmin@test.com',
  'admin@test.com', 
  'hr@test.com',
  'manager@test.com'
);

-- =====================================================
-- After creating users in Dashboard, run this to set roles:
-- =====================================================

-- Update roles (replace the UUIDs with actual user IDs from auth.users)
-- UPDATE public.profiles SET role = 'super_admin'::user_role WHERE email = 'superadmin@test.com';
-- UPDATE public.profiles SET role = 'admin'::user_role WHERE email = 'admin@test.com';
-- UPDATE public.profiles SET role = 'hr'::user_role WHERE email = 'hr@test.com';
-- UPDATE public.profiles SET role = 'manager'::user_role WHERE email = 'manager@test.com';

-- =====================================================
-- Quick fix: Recreate the trigger function properly
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'manager')::public.user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
