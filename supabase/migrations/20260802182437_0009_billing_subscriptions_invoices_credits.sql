/*
# Billing: Subscriptions, Invoices, Credits, Coupons

1. Purpose
Manages subscription plans, invoicing, AI credits, and coupon/discount tracking per organization.

2. New Tables
- `billing_subscriptions`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations, unique)
  - `plan` (text: free, starter, growth, agency, enterprise)
  - `status` (text: active, trialing, past_due, canceled, unpaid)
  - `stripe_customer_id` (text)
  - `stripe_subscription_id` (text)
  - `current_period_start` (timestamptz)
  - `current_period_end` (timestamptz)
  - `cancel_at_period_end` (boolean, default false)
  - `seats` (integer, default 1)
  - `created_at`, `updated_at`

- `billing_invoices`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `subscription_id` (uuid, fk → billing_subscriptions, nullable)
  - `stripe_invoice_id` (text)
  - `amount` (numeric(12,2))
  - `currency` (text, default 'USD')
  - `status` (text: draft, open, paid, void, uncollectible)
  - `invoice_url` (text) — Stripe-hosted invoice URL
  - `invoice_pdf` (text)
  - `period_start` (timestamptz)
  - `period_end` (timestamptz)
  - `paid_at` (timestamptz)
  - `created_at`

- `billing_credits`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations, unique)
  - `ai_content_credits` (integer, default 0) — text generation credits
  - `ai_image_credits` (integer, default 0) — image generation credits
  - `ai_video_credits` (integer, default 0) — video generation credits
  - `total_used_content` (integer, default 0)
  - `total_used_image` (integer, default 0)
  - `total_used_video` (integer, default 0)
  - `created_at`, `updated_at`

- `billing_credit_transactions`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `type` (text: purchase, usage, refund, grant)
  - `credit_type` (text: content, image, video)
  - `amount` (integer) — positive for additions, negative for usage
  - `balance_after` (integer)
  - `description` (text)
  - `reference_id` (uuid, nullable) — linked entity (content_generation, media_asset, etc.)
  - `created_at`

- `coupons`
  - `id` (uuid, pk)
  - `code` (text, unique) — coupon code
  - `description` (text)
  - `discount_type` (text: percentage, fixed)
  - `discount_value` (numeric(12,2))
  - `max_redemptions` (integer)
  - `redemptions_count` (integer, default 0)
  - `starts_at` (timestamptz)
  - `expires_at` (timestamptz)
  - `is_active` (boolean, default true)
  - `created_at`, `updated_at`

- `coupon_redemptions`
  - `id` (uuid, pk)
  - `coupon_id` (uuid, fk → coupons, cascade)
  - `organization_id` (uuid, fk → organizations)
  - `redeemed_at` (timestamptz)
  - UNIQUE (coupon_id, organization_id)

3. Indexes
- billing_subscriptions on organization_id
- billing_invoices on organization_id, created_at
- billing_credits on organization_id
- billing_credit_transactions on organization_id, created_at
- coupons on code

4. Security
- RLS enabled. SELECT for org members; INSERT/UPDATE/DELETE for org admins only.
- Coupons are admin-only (org admin can create; any member can read to validate a code).
*/

-- =========================================================
-- BILLING SUBSCRIPTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','starter','growth','agency','enterprise')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','trialing','past_due','canceled','unpaid')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  seats integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_billing_subs_org_id ON billing_subscriptions(organization_id);

DROP POLICY IF EXISTS "select_org_billing_subs" ON billing_subscriptions;
CREATE POLICY "select_org_billing_subs"
  ON billing_subscriptions FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_billing_subs" ON billing_subscriptions;
CREATE POLICY "insert_org_billing_subs"
  ON billing_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "update_org_billing_subs" ON billing_subscriptions;
CREATE POLICY "update_org_billing_subs"
  ON billing_subscriptions FOR UPDATE
  TO authenticated
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "delete_org_billing_subs" ON billing_subscriptions;
CREATE POLICY "delete_org_billing_subs"
  ON billing_subscriptions FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_billing_subs_updated_at ON billing_subscriptions;
CREATE TRIGGER trg_billing_subs_updated_at
  BEFORE UPDATE ON billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- BILLING INVOICES
-- =========================================================
CREATE TABLE IF NOT EXISTS billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES billing_subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id text,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','open','paid','void','uncollectible')),
  invoice_url text,
  invoice_pdf text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_billing_invoices_org_id ON billing_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_created_at ON billing_invoices(created_at DESC);

DROP POLICY IF EXISTS "select_org_billing_invoices" ON billing_invoices;
CREATE POLICY "select_org_billing_invoices"
  ON billing_invoices FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_billing_invoices" ON billing_invoices;
CREATE POLICY "insert_org_billing_invoices"
  ON billing_invoices FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "update_org_billing_invoices" ON billing_invoices;
CREATE POLICY "update_org_billing_invoices"
  ON billing_invoices FOR UPDATE
  TO authenticated
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "delete_org_billing_invoices" ON billing_invoices;
CREATE POLICY "delete_org_billing_invoices"
  ON billing_invoices FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

-- =========================================================
-- BILLING CREDITS
-- =========================================================
CREATE TABLE IF NOT EXISTS billing_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ai_content_credits integer NOT NULL DEFAULT 0,
  ai_image_credits integer NOT NULL DEFAULT 0,
  ai_video_credits integer NOT NULL DEFAULT 0,
  total_used_content integer NOT NULL DEFAULT 0,
  total_used_image integer NOT NULL DEFAULT 0,
  total_used_video integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

ALTER TABLE billing_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_org_billing_credits" ON billing_credits;
CREATE POLICY "select_org_billing_credits"
  ON billing_credits FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_billing_credits" ON billing_credits;
CREATE POLICY "insert_org_billing_credits"
  ON billing_credits FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "update_org_billing_credits" ON billing_credits;
CREATE POLICY "update_org_billing_credits"
  ON billing_credits FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "delete_org_billing_credits" ON billing_credits;
CREATE POLICY "delete_org_billing_credits"
  ON billing_credits FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_billing_credits_updated_at ON billing_credits;
CREATE TRIGGER trg_billing_credits_updated_at
  BEFORE UPDATE ON billing_credits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- BILLING CREDIT TRANSACTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS billing_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('purchase','usage','refund','grant')),
  credit_type text NOT NULL CHECK (credit_type IN ('content','image','video')),
  amount integer NOT NULL,
  balance_after integer,
  description text,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE billing_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_credit_tx_org_id ON billing_credit_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created_at ON billing_credit_transactions(created_at DESC);

DROP POLICY IF EXISTS "select_org_credit_tx" ON billing_credit_transactions;
CREATE POLICY "select_org_credit_tx"
  ON billing_credit_transactions FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_credit_tx" ON billing_credit_transactions;
CREATE POLICY "insert_org_credit_tx"
  ON billing_credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "update_org_credit_tx" ON billing_credit_transactions;
CREATE POLICY "update_org_credit_tx"
  ON billing_credit_transactions FOR UPDATE
  TO authenticated
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "delete_org_credit_tx" ON billing_credit_transactions;
CREATE POLICY "delete_org_credit_tx"
  ON billing_credit_transactions FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

-- =========================================================
-- COUPONS
-- =========================================================
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric(12,2) NOT NULL,
  max_redemptions integer,
  redemptions_count integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_org_coupons" ON coupons;
CREATE POLICY "select_org_coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_org_coupons" ON coupons;
CREATE POLICY "insert_org_coupons"
  ON coupons FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(
    (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() LIMIT 1)
  ));

DROP POLICY IF EXISTS "update_org_coupons" ON coupons;
CREATE POLICY "update_org_coupons"
  ON coupons FOR UPDATE
  TO authenticated
  USING (is_org_admin(
    (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() LIMIT 1)
  ))
  WITH CHECK (is_org_admin(
    (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() LIMIT 1)
  ));

DROP POLICY IF EXISTS "delete_org_coupons" ON coupons;
CREATE POLICY "delete_org_coupons"
  ON coupons FOR DELETE
  TO authenticated
  USING (is_org_admin(
    (SELECT organization_members.organization_id FROM organization_members WHERE organization_members.user_id = auth.uid() LIMIT 1)
  ));

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON coupons;
CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- COUPON REDEMPTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, organization_id)
);

ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_org_coupon_redemptions" ON coupon_redemptions;
CREATE POLICY "select_org_coupon_redemptions"
  ON coupon_redemptions FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_coupon_redemptions" ON coupon_redemptions;
CREATE POLICY "insert_org_coupon_redemptions"
  ON coupon_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "update_org_coupon_redemptions" ON coupon_redemptions;
CREATE POLICY "update_org_coupon_redemptions"
  ON coupon_redemptions FOR UPDATE
  TO authenticated
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "delete_org_coupon_redemptions" ON coupon_redemptions;
CREATE POLICY "delete_org_coupon_redemptions"
  ON coupon_redemptions FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));