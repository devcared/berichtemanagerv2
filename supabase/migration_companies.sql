-- Migration: Companies table and profile company assignment
-- Run this in the Supabase SQL editor

-- 1. Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  logo_url     TEXT,
  accent_color TEXT DEFAULT '#4285f4',
  website      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add company_id to profiles (with IF NOT EXISTS check via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- 3. Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Drop existing policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "Anyone authenticated can read companies" ON companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON companies;

-- Anyone authenticated can read companies
CREATE POLICY "Anyone authenticated can read companies"
  ON companies
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage companies (uses the existing security definer function)
CREATE POLICY "Admins can manage companies"
  ON companies
  FOR ALL
  USING (get_my_role() = 'admin');
