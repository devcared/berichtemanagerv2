-- =============================================
-- Platform settings table (global branding etc.)
-- =============================================
CREATE TABLE IF NOT EXISTS platform_settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can read settings
CREATE POLICY "public_read_platform_settings"
  ON platform_settings FOR SELECT
  USING (true);

-- Only admins can insert / update / delete
CREATE POLICY "admins_write_platform_settings"
  ON platform_settings FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Seed default branding row so GET always returns something
INSERT INTO platform_settings (key, value)
VALUES (
  'branding',
  '{"name":"AzubiHub","logoUrl":"","accentColor":"#4285f4"}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- Join code for companies
-- =============================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;
