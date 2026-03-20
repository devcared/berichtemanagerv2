-- Migration: Add pending company assignment fields to profiles
-- Allows admins to "invite" users to a company; user must confirm before being assigned.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pending_company_id   UUID  REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pending_company_name TEXT;
