-- Migration: Fix profiles RLS – ensure users can always read their own profile
-- Run this in the Supabase SQL editor if profiles are not loading after login

-- Enable RLS on profiles (safe if already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow every authenticated user to read their OWN profile row
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow every authenticated user to update their OWN profile row
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow every authenticated user to insert their OWN profile row
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
