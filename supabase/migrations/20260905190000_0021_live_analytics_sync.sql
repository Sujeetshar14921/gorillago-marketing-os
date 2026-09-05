/*
# Live Analytics Synchronization Migration

1. Purpose:
   - Adds unique constraint on (organization_id, entity_type, entity_id, date, COALESCE(platform, 'all')) to prevent duplicate daily snapshots.
   - Provides atomic RPC function upsert_analytics_snapshot for fast daily metric sync.

2. Functions:
   - upsert_analytics_snapshot
*/

-- 1. Unique index for daily snapshot idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_snapshots_unique 
  ON analytics_snapshots(organization_id, entity_type, entity_id, date, COALESCE(platform, 'all'));

-- 2. Upsert Analytics Snapshot RPC
CREATE OR REPLACE FUNCTION upsert_analytics_snapshot(
  p_org_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_platform text,
  p_date date,
  p_metrics jsonb DEFAULT '{}'::jsonb,
  p_ai_suggestion text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO analytics_snapshots (
    organization_id,
    entity_type,
    entity_id,
    platform,
    date,
    metrics,
    ai_suggestion,
    created_at
  )
  VALUES (
    p_org_id,
    p_entity_type,
    p_entity_id,
    p_platform,
    p_date,
    p_metrics,
    p_ai_suggestion,
    now()
  )
  ON CONFLICT (organization_id, entity_type, entity_id, date, COALESCE(platform, 'all'))
  DO UPDATE SET
    metrics = EXCLUDED.metrics,
    ai_suggestion = COALESCE(EXCLUDED.ai_suggestion, analytics_snapshots.ai_suggestion)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_analytics_snapshot TO authenticated, service_role;
