/*
# Publishing Schedule and Analytics Snapshots

1. Purpose
`publishing_schedule` provides a unified calendar view of all scheduled organic posts across platforms.
`analytics_snapshots` stores periodic metric snapshots for campaigns, posts, ads, and social accounts.

2. New Tables
- `publishing_schedule`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `campaign_post_id` (uuid, fk → campaign_posts, nullable)
  - `platform` (text)
  - `scheduled_at` (timestamptz)
  - `status` (text: scheduled, published, failed, cancelled)
  - `created_at`

- `analytics_snapshots`
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk → organizations)
  - `entity_type` (text: campaign, post, ad, social_account, organization)
  - `entity_id` (uuid) — references the entity (campaign, post, ad, or social_account ID)
  - `platform` (text, nullable) — for platform-specific metrics
  - `date` (date) — the day these metrics represent
  - `metrics` (jsonb) — flexible metrics: impressions, clicks, reach, engagement, spend,
              conversions, revenue, roas, ctr, cpc, cpm, followers, orders, etc.
  - `ai_suggestion` (text) — AI-generated insight for this snapshot
  - `created_at`

3. Indexes
- publishing_schedule on organization_id, scheduled_at, status
- analytics_snapshots on organization_id, entity_type, entity_id, date

4. Security
- RLS enabled. SELECT for org members; INSERT/UPDATE for org editors; DELETE for org admins.
*/

-- =========================================================
-- PUBLISHING SCHEDULE
-- =========================================================
CREATE TABLE IF NOT EXISTS publishing_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_post_id uuid REFERENCES campaign_posts(id) ON DELETE CASCADE,
  platform text NOT NULL
    CHECK (platform IN ('facebook','instagram','linkedin','pinterest','youtube','x','telegram','threads')),
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','published','failed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE publishing_schedule ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_publishing_schedule_org_id ON publishing_schedule(organization_id);
CREATE INDEX IF NOT EXISTS idx_publishing_schedule_scheduled_at ON publishing_schedule(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_publishing_schedule_status ON publishing_schedule(status);

DROP POLICY IF EXISTS "select_org_publishing_schedule" ON publishing_schedule;
CREATE POLICY "select_org_publishing_schedule"
  ON publishing_schedule FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_publishing_schedule" ON publishing_schedule;
CREATE POLICY "insert_org_publishing_schedule"
  ON publishing_schedule FOR INSERT
  TO authenticated
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "update_org_publishing_schedule" ON publishing_schedule;
CREATE POLICY "update_org_publishing_schedule"
  ON publishing_schedule FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "delete_org_publishing_schedule" ON publishing_schedule;
CREATE POLICY "delete_org_publishing_schedule"
  ON publishing_schedule FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

-- =========================================================
-- ANALYTICS SNAPSHOTS
-- =========================================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL
    CHECK (entity_type IN ('campaign','post','ad','social_account','organization')),
  entity_id uuid NOT NULL,
  platform text,
  date date NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_suggestion text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_analytics_org_id ON analytics_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_entity ON analytics_snapshots(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_snapshots(date);

DROP POLICY IF EXISTS "select_org_analytics" ON analytics_snapshots;
CREATE POLICY "select_org_analytics"
  ON analytics_snapshots FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_analytics" ON analytics_snapshots;
CREATE POLICY "insert_org_analytics"
  ON analytics_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "update_org_analytics" ON analytics_snapshots;
CREATE POLICY "update_org_analytics"
  ON analytics_snapshots FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "delete_org_analytics" ON analytics_snapshots;
CREATE POLICY "delete_org_analytics"
  ON analytics_snapshots FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));