/*
# Social Accounts and Integrations

1. Purpose
Stores OAuth-connected social media accounts (Facebook, Instagram, LinkedIn, Pinterest,
YouTube, X/Twitter, Telegram, Threads) and third-party integrations (Shopify, WooCommerce,
Google Ads, Meta Ads, etc.). OAuth tokens are stored encrypted. Never stores passwords.

2. New Tables
- `social_accounts`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `platform` (text) — facebook, instagram, linkedin, pinterest, youtube, x, telegram, threads
  - `account_name` (text) — display name of the connected page/channel
  - `account_id` (text) — platform-specific account/page ID
  - `access_token` (text) — encrypted OAuth access token
  - `refresh_token` (text) — encrypted OAuth refresh token
  - `token_expires_at` (timestamptz)
  - `scopes` (text[]) — granted OAuth scopes
  - `health_status` (text: healthy, expired, error, disconnected)
  - `last_health_check_at` (timestamptz)
  - `metadata` (jsonb) — platform-specific info (follower count, page category, etc.)
  - `is_connected` (boolean, default true)
  - `created_at`, `updated_at`

- `integrations`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `type` (text) — shopify, woocommerce, magento, bigcommerce, google_ads, meta_ads, linkedin_ads, pinterest_ads, x_ads, stripe, openai, anthropic
  - `name` (text) — display name
  - `status` (text: connected, disconnected, error)
  - `credentials` (jsonb) — encrypted credentials (API keys, store domain, etc.)
  - `metadata` (jsonb) — integration-specific metadata
  - `last_synced_at` (timestamptz)
  - `created_at`, `updated_at`
  - Unique (organization_id, type)

3. Security
- RLS enabled on both tables.
- SELECT for org members; INSERT/UPDATE/DELETE for org admins only.
- Tokens and credentials are stored in the database; encryption should be applied at the
  application layer (edge functions) before writing. This is a defense-in-depth measure.
*/

-- =========================================================
-- SOCIAL ACCOUNTS
-- =========================================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform text NOT NULL
    CHECK (platform IN ('facebook','instagram','linkedin','pinterest','youtube','x','telegram','threads')),
  account_name text NOT NULL,
  account_id text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT '{}',
  health_status text NOT NULL DEFAULT 'healthy'
    CHECK (health_status IN ('healthy','expired','error','disconnected')),
  last_health_check_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_connected boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_social_accounts_org_id ON social_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);

DROP POLICY IF EXISTS "select_org_social_accounts" ON social_accounts;
CREATE POLICY "select_org_social_accounts"
  ON social_accounts FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_social_accounts" ON social_accounts;
CREATE POLICY "insert_org_social_accounts"
  ON social_accounts FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "update_org_social_accounts" ON social_accounts;
CREATE POLICY "update_org_social_accounts"
  ON social_accounts FOR UPDATE
  TO authenticated
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "delete_org_social_accounts" ON social_accounts;
CREATE POLICY "delete_org_social_accounts"
  ON social_accounts FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_social_accounts_updated_at ON social_accounts;
CREATE TRIGGER trg_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- INTEGRATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('shopify','woocommerce','magento','bigcommerce','google_ads','meta_ads','linkedin_ads','pinterest_ads','x_ads','stripe','openai','anthropic')),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected','disconnected','error')),
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, type)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_integrations_org_id ON integrations(organization_id);

DROP POLICY IF EXISTS "select_org_integrations" ON integrations;
CREATE POLICY "select_org_integrations"
  ON integrations FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_integrations" ON integrations;
CREATE POLICY "insert_org_integrations"
  ON integrations FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "update_org_integrations" ON integrations;
CREATE POLICY "update_org_integrations"
  ON integrations FOR UPDATE
  TO authenticated
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "delete_org_integrations" ON integrations;
CREATE POLICY "delete_org_integrations"
  ON integrations FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_integrations_updated_at ON integrations;
CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();