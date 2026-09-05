/*
# Campaigns, Organic Posts, and Paid Ads

1. Purpose
The core marketing execution tables. Campaigns can be organic, paid, or hybrid.
Organic posts are scheduled/published to social platforms. Paid ads are launched on ad platforms.

2. New Tables
- `campaigns`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `product_id` (uuid, fk → products, nullable)
  - `name` (text)
  - `type` (text: organic, paid, hybrid)
  - `status` (text: draft, scheduled, active, paused, completed, archived, failed)
  - `goal` (text: awareness, engagement, traffic, leads, sales, followers)
  - `budget` (numeric(12,2)) — total budget (paid/hybrid)
  - `currency` (text, default 'USD')
  - `start_date` (date)
  - `end_date` (date)
  - `target_country` (text[])
  - `target_language` (text)
  - `ai_generated` (boolean, default false)
  - `ai_estimated_performance` (jsonb) — AI forecast (impressions, clicks, conversions)
  - `approved_by` (uuid, fk → auth.users)
  - `approved_at` (timestamptz)
  - `created_by` (uuid, fk → auth.users)
  - `metadata` (jsonb)
  - `created_at`, `updated_at`

- `campaign_posts` (organic posts within a campaign)
  - `id` (uuid, pk)
  - `campaign_id` (uuid, fk → campaigns, cascade)
  - `organization_id` (uuid, fk → organizations) — denormalized for direct RLS
  - `social_account_id` (uuid, fk → social_accounts, nullable)
  - `platform` (text) — target platform
  - `content` (text) — caption/post text
  - `media_urls` (jsonb) — array of image/video URLs
  - `hashtags` (text[])
  - `status` (text: draft, pending_approval, approved, scheduled, publishing, published, failed, recurring)
  - `scheduled_at` (timestamptz)
  - `published_at` (timestamptz)
  - `external_post_id` (text) — ID returned by the platform
  - `error_message` (text)
  - `is_recurring` (boolean, default false)
  - `recurrence_rule` (jsonb) — rrule-style config
  - `created_by` (uuid, fk → auth.users)
  - `created_at`, `updated_at`

- `campaign_ads` (paid ad configurations within a campaign)
  - `id` (uuid, pk)
  - `campaign_id` (uuid, fk → campaigns, cascade)
  - `organization_id` (uuid, fk → organizations) — denormalized for direct RLS
  - `platform` (text) — meta_ads, google_ads, linkedin_ads, pinterest_ads, x_ads
  - `ad_account_id` (text) — external ad account ID
  - `objective` (text: awareness, reach, traffic, engagement, leads, app_installs, video_views, conversions, store_traffic, sales)
  - `audience` (jsonb) — { age_min, age_max, genders, locations, languages, interests, behaviors, custom_audiences }
  - `placements` (jsonb) — array of placement configs
  - `daily_budget` (numeric(12,2))
  - `lifetime_budget` (numeric(12,2))
  - `bid_strategy` (text: lowest_cost, cost_cap, bid_cap, target_cost)
  - `creative` (jsonb) — { headline, primary_text, description, cta, media_urls, call_to_action }
  - `status` (text: draft, pending_approval, approved, active, paused, archived, failed)
  - `external_ad_id` (text) — ID from ad platform
  - `error_message` (text)
  - `approved_by` (uuid, fk → auth.users)
  - `approved_at` (timestamptz)
  - `created_by` (uuid, fk → auth.users)
  - `created_at`, `updated_at`

- `ab_test_variants` (A/B testing for ads and posts)
  - `id` (uuid, pk)
  - `parent_type` (text: post, ad)
  - `parent_id` (uuid) — references campaign_posts or campaign_ads
  - `variant_label` (text) — A, B, C
  - `content` (jsonb) — variant content
  - `metrics` (jsonb) — performance metrics for this variant
  - `is_winner` (boolean)
  - `created_at`

3. Indexes
- campaigns on organization_id, status, type, created_at
- campaign_posts on campaign_id, organization_id, status, scheduled_at
- campaign_ads on campaign_id, organization_id, status
- ab_test_variants on parent_type, parent_id

4. Security
- RLS enabled on all tables, scoped to org membership.
- campaign_posts and campaign_ads carry denormalized organization_id for direct RLS
  (avoids expensive join to campaigns on every query).
*/

-- =========================================================
-- CAMPAIGNS
-- =========================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'organic'
    CHECK (type IN ('organic','paid','hybrid')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','active','paused','completed','archived','failed')),
  goal text
    CHECK (goal IS NULL OR goal IN ('awareness','engagement','traffic','leads','sales','followers')),
  budget numeric(12,2),
  currency text NOT NULL DEFAULT 'USD',
  start_date date,
  end_date date,
  target_country text[] NOT NULL DEFAULT '{}',
  target_language text,
  ai_generated boolean NOT NULL DEFAULT false,
  ai_estimated_performance jsonb,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_campaigns_org_id ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

DROP POLICY IF EXISTS "select_org_campaigns" ON campaigns;
CREATE POLICY "select_org_campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_campaigns" ON campaigns;
CREATE POLICY "insert_org_campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "update_org_campaigns" ON campaigns;
CREATE POLICY "update_org_campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "delete_org_campaigns" ON campaigns;
CREATE POLICY "delete_org_campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON campaigns;
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- CAMPAIGN POSTS (organic)
-- =========================================================
CREATE TABLE IF NOT EXISTS campaign_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  social_account_id uuid REFERENCES social_accounts(id) ON DELETE SET NULL,
  platform text NOT NULL
    CHECK (platform IN ('facebook','instagram','linkedin','pinterest','youtube','x','telegram','threads')),
  content text,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  hashtags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','approved','scheduled','publishing','published','failed','recurring')),
  scheduled_at timestamptz,
  published_at timestamptz,
  external_post_id text,
  error_message text,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_rule jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaign_posts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_campaign_posts_campaign_id ON campaign_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_posts_org_id ON campaign_posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_posts_status ON campaign_posts(status);
CREATE INDEX IF NOT EXISTS idx_campaign_posts_scheduled_at ON campaign_posts(scheduled_at);

DROP POLICY IF EXISTS "select_org_campaign_posts" ON campaign_posts;
CREATE POLICY "select_org_campaign_posts"
  ON campaign_posts FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_campaign_posts" ON campaign_posts;
CREATE POLICY "insert_org_campaign_posts"
  ON campaign_posts FOR INSERT
  TO authenticated
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "update_org_campaign_posts" ON campaign_posts;
CREATE POLICY "update_org_campaign_posts"
  ON campaign_posts FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "delete_org_campaign_posts" ON campaign_posts;
CREATE POLICY "delete_org_campaign_posts"
  ON campaign_posts FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_campaign_posts_updated_at ON campaign_posts;
CREATE TRIGGER trg_campaign_posts_updated_at
  BEFORE UPDATE ON campaign_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- CAMPAIGN ADS (paid)
-- =========================================================
CREATE TABLE IF NOT EXISTS campaign_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform text NOT NULL
    CHECK (platform IN ('meta_ads','google_ads','linkedin_ads','pinterest_ads','x_ads')),
  ad_account_id text,
  objective text NOT NULL DEFAULT 'traffic'
    CHECK (objective IN ('awareness','reach','traffic','engagement','leads','app_installs','video_views','conversions','store_traffic','sales')),
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  placements jsonb NOT NULL DEFAULT '[]'::jsonb,
  daily_budget numeric(12,2),
  lifetime_budget numeric(12,2),
  bid_strategy text DEFAULT 'lowest_cost'
    CHECK (bid_strategy IN ('lowest_cost','cost_cap','bid_cap','target_cost')),
  creative jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','approved','active','paused','archived','failed')),
  external_ad_id text,
  error_message text,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaign_ads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_campaign_ads_campaign_id ON campaign_ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_ads_org_id ON campaign_ads(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_ads_status ON campaign_ads(status);

DROP POLICY IF EXISTS "select_org_campaign_ads" ON campaign_ads;
CREATE POLICY "select_org_campaign_ads"
  ON campaign_ads FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_campaign_ads" ON campaign_ads;
CREATE POLICY "insert_org_campaign_ads"
  ON campaign_ads FOR INSERT
  TO authenticated
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "update_org_campaign_ads" ON campaign_ads;
CREATE POLICY "update_org_campaign_ads"
  ON campaign_ads FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "delete_org_campaign_ads" ON campaign_ads;
CREATE POLICY "delete_org_campaign_ads"
  ON campaign_ads FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

DROP TRIGGER IF EXISTS trg_campaign_ads_updated_at ON campaign_ads;
CREATE TRIGGER trg_campaign_ads_updated_at
  BEFORE UPDATE ON campaign_ads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- A/B TEST VARIANTS
-- =========================================================
CREATE TABLE IF NOT EXISTS ab_test_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_type text NOT NULL CHECK (parent_type IN ('post','ad')),
  parent_id uuid NOT NULL,
  variant_label text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_winner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ab_variants_parent ON ab_test_variants(parent_type, parent_id);
CREATE INDEX IF NOT EXISTS idx_ab_variants_org_id ON ab_test_variants(organization_id);

DROP POLICY IF EXISTS "select_org_ab_variants" ON ab_test_variants;
CREATE POLICY "select_org_ab_variants"
  ON ab_test_variants FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_ab_variants" ON ab_test_variants;
CREATE POLICY "insert_org_ab_variants"
  ON ab_test_variants FOR INSERT
  TO authenticated
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "update_org_ab_variants" ON ab_test_variants;
CREATE POLICY "update_org_ab_variants"
  ON ab_test_variants FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "delete_org_ab_variants" ON ab_test_variants;
CREATE POLICY "delete_org_ab_variants"
  ON ab_test_variants FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));