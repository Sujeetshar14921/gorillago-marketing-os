/*
# Background Scheduler & Social Publishing: Due Post Claiming & Publishing RPCs

1. Purpose:
   - Provide atomic row-level locking for scheduled social media posts using `FOR UPDATE SKIP LOCKED`.
   - Ensure concurrent background workers / crons never double-post.
   - Atomically transition claimed posts from 'scheduled' -> 'publishing'.
   - Record delivery results (published_at, external_post_id, error_message).
*/

-- =========================================================
-- 1. FUNCTION: claim_due_scheduled_posts
-- Selects and locks posts whose scheduled_at <= now()
-- and status = 'scheduled', updating them to 'publishing'.
-- =========================================================
CREATE OR REPLACE FUNCTION claim_due_scheduled_posts(
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  campaign_id uuid,
  social_account_id uuid,
  platform text,
  content text,
  media_urls jsonb,
  hashtags text[],
  scheduled_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH due_posts AS (
    SELECT cp.id
    FROM campaign_posts cp
    WHERE cp.status = 'scheduled'
      AND cp.scheduled_at IS NOT NULL
      AND cp.scheduled_at <= now()
    ORDER BY cp.scheduled_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE campaign_posts cp
  SET status = 'publishing',
      updated_at = now()
  FROM due_posts dp
  WHERE cp.id = dp.id
  RETURNING
    cp.id,
    cp.organization_id,
    cp.campaign_id,
    cp.social_account_id,
    cp.platform,
    cp.content,
    cp.media_urls,
    cp.hashtags,
    cp.scheduled_at;
END;
$$;

-- =========================================================
-- 2. FUNCTION: mark_post_published
-- Atomically writes publish confirmation or failure details.
-- =========================================================
CREATE OR REPLACE FUNCTION mark_post_published(
  p_post_id uuid,
  p_external_id text DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post campaign_posts%ROWTYPE;
BEGIN
  SELECT * INTO v_post
  FROM campaign_posts
  WHERE id = p_post_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'POST_NOT_FOUND');
  END IF;

  IF p_error IS NOT NULL AND p_error != '' THEN
    UPDATE campaign_posts
    SET status = 'failed',
        error_message = p_error,
        updated_at = now()
    WHERE id = p_post_id;

    RETURN jsonb_build_object('success', true, 'status', 'failed', 'error', p_error);
  ELSE
    UPDATE campaign_posts
    SET status = 'published',
        published_at = now(),
        external_post_id = COALESCE(p_external_id, 'pub_' || gen_random_uuid()),
        error_message = NULL,
        updated_at = now()
    WHERE id = p_post_id;

    RETURN jsonb_build_object('success', true, 'status', 'published', 'external_post_id', p_external_id);
  END IF;
END;
$$;

-- =========================================================
-- 3. GRANT PERMISSIONS
-- =========================================================
GRANT EXECUTE ON FUNCTION claim_due_scheduled_posts(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_due_scheduled_posts(integer) TO service_role;

GRANT EXECUTE ON FUNCTION mark_post_published(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_post_published(uuid, text, text) TO service_role;
