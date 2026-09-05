/*
# AI Guardrails & Credit System: Atomic Deductions, Pre-checks & Organization Provisioning

1. Purpose:
   - Enforce credit quotas on AI generation (Content, Image, Video) before calling AI providers.
   - Provide atomic RPC functions (`check_ai_credits`, `deduct_ai_credits`, `grant_plan_credits`)
     preventing race conditions and negative balances using row-level locking.
   - Automatically initialize free-tier subscriptions and credits for newly registered organizations.
   - Retroactively backfill existing organizations that lack a `billing_credits` or `billing_subscriptions` record.

2. Credits Allotment per Plan:
   - Free: 10 Content, 2 Image, 0 Video
   - Starter: 100 Content, 20 Image, 5 Video
   - Growth: 500 Content, 100 Image, 20 Video
   - Agency: 2000 Content, 500 Image, 100 Video
   - Enterprise: 10000 Content, 3000 Image, 500 Video
*/

-- =========================================================
-- 1. FUNCTION: check_ai_credits
-- Checks if an organization has enough credits without mutating state.
-- Automatically creates default free credits if no record exists.
-- =========================================================
CREATE OR REPLACE FUNCTION check_ai_credits(
  p_org_id uuid,
  p_credit_type text,
  p_amount integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer := 0;
  v_credits_row billing_credits%ROWTYPE;
BEGIN
  -- Validate credit type
  IF p_credit_type NOT IN ('content', 'image', 'video') THEN
    RETURN jsonb_build_object(
      'has_enough', false,
      'error', 'INVALID_CREDIT_TYPE',
      'remaining', 0,
      'required', p_amount
    );
  END IF;

  -- Fetch existing credits row
  SELECT * INTO v_credits_row
  FROM billing_credits
  WHERE organization_id = p_org_id;

  -- Auto-provision free tier credits if record does not exist
  IF NOT FOUND THEN
    INSERT INTO billing_credits (
      organization_id,
      ai_content_credits,
      ai_image_credits,
      ai_video_credits
    )
    VALUES (p_org_id, 10, 2, 0)
    ON CONFLICT (organization_id) DO UPDATE
      SET updated_at = now()
    RETURNING * INTO v_credits_row;

    INSERT INTO billing_credit_transactions (
      organization_id,
      type,
      credit_type,
      amount,
      balance_after,
      description
    )
    VALUES
      (p_org_id, 'grant', 'content', 10, 10, 'Welcome Free tier content credits'),
      (p_org_id, 'grant', 'image', 2, 2, 'Welcome Free tier image credits');
  END IF;

  -- Determine balance based on requested credit type
  IF p_credit_type = 'content' THEN
    v_balance := COALESCE(v_credits_row.ai_content_credits, 0);
  ELSIF p_credit_type = 'image' THEN
    v_balance := COALESCE(v_credits_row.ai_image_credits, 0);
  ELSIF p_credit_type = 'video' THEN
    v_balance := COALESCE(v_credits_row.ai_video_credits, 0);
  END IF;

  RETURN jsonb_build_object(
    'has_enough', (v_balance >= p_amount),
    'remaining', v_balance,
    'required', p_amount
  );
END;
$$;

-- =========================================================
-- 2. FUNCTION: deduct_ai_credits
-- Atomically locks the organization row, validates balance,
-- deducts credits, and writes an audit log in billing_credit_transactions.
-- =========================================================
CREATE OR REPLACE FUNCTION deduct_ai_credits(
  p_org_id uuid,
  p_credit_type text,
  p_amount integer DEFAULT 1,
  p_description text DEFAULT 'AI asset generation',
  p_reference_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits_row billing_credits%ROWTYPE;
  v_current_balance integer := 0;
  v_new_balance integer := 0;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  END IF;

  IF p_credit_type NOT IN ('content', 'image', 'video') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_CREDIT_TYPE');
  END IF;

  -- Lock row for update to prevent concurrent race condition deductions
  SELECT * INTO v_credits_row
  FROM billing_credits
  WHERE organization_id = p_org_id
  FOR UPDATE;

  -- If not found, initialize first
  IF NOT FOUND THEN
    INSERT INTO billing_credits (
      organization_id,
      ai_content_credits,
      ai_image_credits,
      ai_video_credits
    )
    VALUES (p_org_id, 10, 2, 0)
    ON CONFLICT (organization_id) DO UPDATE
      SET updated_at = now()
    RETURNING * INTO v_credits_row;

    INSERT INTO billing_credit_transactions (
      organization_id,
      type,
      credit_type,
      amount,
      balance_after,
      description
    )
    VALUES
      (p_org_id, 'grant', 'content', 10, 10, 'Welcome Free tier content credits'),
      (p_org_id, 'grant', 'image', 2, 2, 'Welcome Free tier image credits');
  END IF;

  -- Read balance
  IF p_credit_type = 'content' THEN
    v_current_balance := COALESCE(v_credits_row.ai_content_credits, 0);
  ELSIF p_credit_type = 'image' THEN
    v_current_balance := COALESCE(v_credits_row.ai_image_credits, 0);
  ELSIF p_credit_type = 'video' THEN
    v_current_balance := COALESCE(v_credits_row.ai_video_credits, 0);
  END IF;

  -- Check sufficiency
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS',
      'remaining', v_current_balance,
      'required', p_amount
    );
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- Apply atomic deduction
  IF p_credit_type = 'content' THEN
    UPDATE billing_credits
    SET ai_content_credits = v_new_balance,
        total_used_content = total_used_content + p_amount,
        updated_at = now()
    WHERE organization_id = p_org_id;
  ELSIF p_credit_type = 'image' THEN
    UPDATE billing_credits
    SET ai_image_credits = v_new_balance,
        total_used_image = total_used_image + p_amount,
        updated_at = now()
    WHERE organization_id = p_org_id;
  ELSIF p_credit_type = 'video' THEN
    UPDATE billing_credits
    SET ai_video_credits = v_new_balance,
        total_used_video = total_used_video + p_amount,
        updated_at = now()
    WHERE organization_id = p_org_id;
  END IF;

  -- Record transaction audit entry
  INSERT INTO billing_credit_transactions (
    organization_id,
    type,
    credit_type,
    amount,
    balance_after,
    description,
    reference_id
  )
  VALUES (
    p_org_id,
    'usage',
    p_credit_type,
    -p_amount,
    v_new_balance,
    p_description,
    p_reference_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'credit_type', p_credit_type,
    'deducted', p_amount,
    'remaining', v_new_balance
  );
END;
$$;

-- =========================================================
-- 3. FUNCTION: grant_plan_credits
-- Grants/refreshes quota when a plan is switched or seeded.
-- =========================================================
CREATE OR REPLACE FUNCTION grant_plan_credits(
  p_org_id uuid,
  p_plan text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content integer := 10;
  v_image integer := 2;
  v_video integer := 0;
BEGIN
  IF p_plan = 'starter' THEN
    v_content := 100; v_image := 20; v_video := 5;
  ELSIF p_plan = 'growth' THEN
    v_content := 500; v_image := 100; v_video := 20;
  ELSIF p_plan = 'agency' THEN
    v_content := 2000; v_image := 500; v_video := 100;
  ELSIF p_plan = 'enterprise' THEN
    v_content := 10000; v_image := 3000; v_video := 500;
  ELSE
    -- free default
    v_content := 10; v_image := 2; v_video := 0;
  END IF;

  INSERT INTO billing_credits (
    organization_id,
    ai_content_credits,
    ai_image_credits,
    ai_video_credits
  )
  VALUES (p_org_id, v_content, v_image, v_video)
  ON CONFLICT (organization_id) DO UPDATE
    SET ai_content_credits = v_content,
        ai_image_credits = v_image,
        ai_video_credits = v_video,
        updated_at = now();

  INSERT INTO billing_credit_transactions (
    organization_id,
    type,
    credit_type,
    amount,
    balance_after,
    description
  )
  VALUES
    (p_org_id, 'grant', 'content', v_content, v_content, initcap(p_plan) || ' plan quota grant (Content)'),
    (p_org_id, 'grant', 'image', v_image, v_image, initcap(p_plan) || ' plan quota grant (Image)'),
    (p_org_id, 'grant', 'video', v_video, v_video, initcap(p_plan) || ' plan quota grant (Video)');

  RETURN jsonb_build_object(
    'success', true,
    'plan', p_plan,
    'content_credits', v_content,
    'image_credits', v_image,
    'video_credits', v_video
  );
END;
$$;

-- =========================================================
-- 4. GRANT PERMISSIONS TO AUTHENTICATED AND SERVICE_ROLE
-- =========================================================
GRANT EXECUTE ON FUNCTION check_ai_credits(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION check_ai_credits(uuid, text, integer) TO service_role;

GRANT EXECUTE ON FUNCTION deduct_ai_credits(uuid, text, integer, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_ai_credits(uuid, text, integer, text, uuid) TO service_role;

GRANT EXECUTE ON FUNCTION grant_plan_credits(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_plan_credits(uuid, text) TO service_role;

-- =========================================================
-- 5. UPDATE TRIGGER: handle_new_organization
-- Auto-provision billing subscription & credits for new orgs
-- =========================================================
CREATE OR REPLACE FUNCTION handle_new_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO organization_members (organization_id, user_id, role, status)
    VALUES (NEW.id, NEW.owner_id, 'business_owner', 'active')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;

  INSERT INTO organization_settings (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;

  INSERT INTO brands (organization_id, name)
  VALUES (NEW.id, NEW.name)
  ON CONFLICT DO NOTHING;

  -- Provision default Free subscription
  INSERT INTO billing_subscriptions (
    organization_id,
    plan,
    status,
    current_period_start,
    current_period_end
  )
  VALUES (
    NEW.id,
    'free',
    'active',
    now(),
    now() + interval '1 month'
  )
  ON CONFLICT (organization_id) DO NOTHING;

  -- Provision default Free credits
  INSERT INTO billing_credits (
    organization_id,
    ai_content_credits,
    ai_image_credits,
    ai_video_credits
  )
  VALUES (NEW.id, 10, 2, 0)
  ON CONFLICT (organization_id) DO NOTHING;

  -- Log welcome grant transactions
  INSERT INTO billing_credit_transactions (
    organization_id,
    type,
    credit_type,
    amount,
    balance_after,
    description
  )
  VALUES
    (NEW.id, 'grant', 'content', 10, 10, 'Welcome Free tier content credits'),
    (NEW.id, 'grant', 'image', 2, 2, 'Welcome Free tier image credits');

  RETURN NEW;
END;
$$;

-- =========================================================
-- 6. RETROACTIVELY SEED MISSING SUBSCRIPTIONS & CREDITS
-- For any existing organizations in database
-- =========================================================
INSERT INTO billing_subscriptions (
  organization_id,
  plan,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  o.id,
  'free',
  'active',
  now(),
  now() + interval '1 month'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM billing_subscriptions bs WHERE bs.organization_id = o.id
)
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO billing_credits (
  organization_id,
  ai_content_credits,
  ai_image_credits,
  ai_video_credits
)
SELECT 
  o.id,
  10,
  2,
  0
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM billing_credits bc WHERE bc.organization_id = o.id
)
ON CONFLICT (organization_id) DO NOTHING;
