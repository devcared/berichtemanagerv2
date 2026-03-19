-- =============================================================
-- FIX: Infinite recursion in profiles RLS policies
-- Run this in the Supabase SQL editor
-- =============================================================

-- Step 1: Drop all recursive policies that query profiles from within profiles RLS
DROP POLICY IF EXISTS "Admins can read all profiles"   ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile"     ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile"   ON profiles;

-- Step 2: Create a SECURITY DEFINER function to check role WITHOUT triggering RLS
-- SECURITY DEFINER = runs as the postgres superuser, bypasses RLS → no recursion
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Step 3: Re-create clean, non-recursive policies

-- Every user can always read their own profile row (auth.uid() = id → no table query, no recursion)
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Trainers and admins can read ALL profiles (uses SECURITY DEFINER function → no recursion)
CREATE POLICY "Trainers and admins can read all profiles" ON profiles
  FOR SELECT USING (get_my_role() IN ('trainer', 'admin'));

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update any profile (uses SECURITY DEFINER function)
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (get_my_role() = 'admin');

-- Users can insert their own profile (needed for setup page)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 4: Also fix the same recursion in other tables that check profiles.role
-- These query profiles from within report_comments/weekly_reports RLS, which is fine
-- (querying a DIFFERENT table doesn't cause recursion on profiles)
-- But they also need to work correctly now that profiles RLS is fixed.

-- Verify: enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
