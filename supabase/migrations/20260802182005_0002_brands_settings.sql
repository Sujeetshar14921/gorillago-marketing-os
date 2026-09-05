/*
# Brands and Organization Settings

1. Purpose
Stores brand identity (logo, colors, fonts, tone, language) per organization
and org-level configuration (timezone, AI settings, API keys references, integrations toggles).

2. New Tables
- `brands`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `name` (text) — brand name
  - `logo_url` (text) — stored in Supabase Storage
  - `primary_color` (text) — hex color
  - `secondary_color` (text)
  - `accent_color` (text)
  - `font_family` (text)
  - `tone_of_voice` (text) — e.g. professional, playful, luxury
  - `language` (text, default 'en')
  - `description` (text)
  - `is_active` (boolean, default true)
  - `created_at`, `updated_at`

- `organization_settings`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations, unique)
  - `timezone` (text, default 'UTC')
  - `default_language` (text, default 'en')
  - `ai_tone` (text) — default AI tone override
  - `ai_model` (text, default 'gpt-4o') — preferred AI model
  - `auto_pilot_enabled` (boolean, default false)
  - `auto_pilot_auto_publish` (boolean, default false) — auto-publish organic posts
  - `auto_pilot_auto_ads` (boolean, default false) — auto-launch paid ads (requires explicit opt-in)
  - `notification_email` (boolean, default true)
  - `notification_push` (boolean, default true)
  - `created_at`, `updated_at`

3. Security
- RLS enabled on both tables, scoped to org membership via is_org_member().
- Only org admins can INSERT/UPDATE/DELETE brand and settings rows.
*/

-- =========================================================
-- BRANDS
-- =========================================================
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  primary_color text,
  secondary_color text,
  accent_color text,
  font_family text,
  tone_of_voice text,
  language text NOT NULL DEFAULT 'en',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_brands_org_id ON brands(organization_id);

DROP POLICY IF EXISTS "select_org_brands" ON brands;
CREATE POLICY "select_org_brands"
  ON brands FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_brands" ON brands;
CREATE POLICY "insert_org_brands"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "update_org_brands" ON brands;
CREATE POLICY "update_org_brands"
  ON brands FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "delete_org_brands" ON brands;
CREATE POLICY "delete_org_brands"
  ON brands FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_brands_updated_at ON brands;
CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- ORGANIZATION SETTINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'UTC',
  default_language text NOT NULL DEFAULT 'en',
  ai_tone text,
  ai_model text NOT NULL DEFAULT 'gpt-4o',
  auto_pilot_enabled boolean NOT NULL DEFAULT false,
  auto_pilot_auto_publish boolean NOT NULL DEFAULT false,
  auto_pilot_auto_ads boolean NOT NULL DEFAULT false,
  notification_email boolean NOT NULL DEFAULT true,
  notification_push boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_org_settings" ON organization_settings;
CREATE POLICY "select_org_settings"
  ON organization_settings FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_settings" ON organization_settings;
CREATE POLICY "insert_org_settings"
  ON organization_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "update_org_settings" ON organization_settings;
CREATE POLICY "update_org_settings"
  ON organization_settings FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "delete_org_settings" ON organization_settings;
CREATE POLICY "delete_org_settings"
  ON organization_settings FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_org_settings_updated_at ON organization_settings;
CREATE TRIGGER trg_org_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();