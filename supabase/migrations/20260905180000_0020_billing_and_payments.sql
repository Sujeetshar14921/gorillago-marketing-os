/*
# Billing, Payments & Topup Credits Migration

1. Purpose:
   - Atomic RPC functions for purchasing extra AI credits (Content, Image, Video topup packs).
   - Atomic RPC function for recording paid invoices from Stripe, Razorpay, or Sandbox simulator.
   - Atomic RPC function for managing subscription lifecycle and status transitions.

2. Functions:
   - grant_topup_credits
   - record_paid_invoice
   - update_subscription_status
*/

-- =========================================================
-- 1. FUNCTION: grant_topup_credits
-- Adds extra credits purchased as add-on packs.
-- =========================================================
CREATE OR REPLACE FUNCTION grant_topup_credits(
  p_org_id uuid,
  p_credit_type text,
  p_amount integer,
  p_description text DEFAULT 'Extra AI credit pack purchase',
  p_reference_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits_row billing_credits%ROWTYPE;
  v_new_balance integer := 0;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  END IF;

  IF p_credit_type NOT IN ('content', 'image', 'video') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_CREDIT_TYPE');
  END IF;

  -- Lock row for update
  SELECT * INTO v_credits_row
  FROM billing_credits
  WHERE organization_id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO billing_credits (
      organization_id,
      ai_content_credits,
      ai_image_credits,
      ai_video_credits
    )
    VALUES (p_org_id, 10, 2, 0)
    RETURNING * INTO v_credits_row;
  END IF;

  IF p_credit_type = 'content' THEN
    v_new_balance := COALESCE(v_credits_row.ai_content_credits, 0) + p_amount;
    UPDATE billing_credits
    SET ai_content_credits = v_new_balance,
        updated_at = now()
    WHERE organization_id = p_org_id;
  ELSIF p_credit_type = 'image' THEN
    v_new_balance := COALESCE(v_credits_row.ai_image_credits, 0) + p_amount;
    UPDATE billing_credits
    SET ai_image_credits = v_new_balance,
        updated_at = now()
    WHERE organization_id = p_org_id;
  ELSIF p_credit_type = 'video' THEN
    v_new_balance := COALESCE(v_credits_row.ai_video_credits, 0) + p_amount;
    UPDATE billing_credits
    SET ai_video_credits = v_new_balance,
        updated_at = now()
    WHERE organization_id = p_org_id;
  END IF;

  -- Record audit transaction
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
    'purchase',
    p_credit_type,
    p_amount,
    v_new_balance,
    p_description,
    p_reference_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'credit_type', p_credit_type,
    'added', p_amount,
    'new_balance', v_new_balance
  );
END;
$$;

-- =========================================================
-- 2. FUNCTION: record_paid_invoice
-- Records authentic invoice on payment completion.
-- =========================================================
CREATE OR REPLACE FUNCTION record_paid_invoice(
  p_org_id uuid,
  p_subscription_id uuid DEFAULT NULL,
  p_amount numeric DEFAULT 0,
  p_currency text DEFAULT 'USD',
  p_stripe_invoice_id text DEFAULT NULL,
  p_invoice_url text DEFAULT NULL,
  p_period_start timestamptz DEFAULT now(),
  p_period_end timestamptz DEFAULT (now() + interval '1 month')
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_id uuid;
BEGIN
  INSERT INTO billing_invoices (
    organization_id,
    subscription_id,
    amount,
    currency,
    status,
    stripe_invoice_id,
    invoice_url,
    period_start,
    period_end,
    paid_at,
    created_at
  )
  VALUES (
    p_org_id,
    p_subscription_id,
    p_amount,
    p_currency,
    'paid',
    p_stripe_invoice_id,
    p_invoice_url,
    p_period_start,
    p_period_end,
    now(),
    now()
  )
  RETURNING id INTO v_invoice_id;

  RETURN v_invoice_id;
END;
$$;

-- =========================================================
-- 3. FUNCTION: update_subscription_status
-- Syncs subscription plan and lifecycle status.
-- =========================================================
CREATE OR REPLACE FUNCTION update_subscription_status(
  p_org_id uuid,
  p_plan text,
  p_status text,
  p_stripe_customer_id text DEFAULT NULL,
  p_stripe_subscription_id text DEFAULT NULL,
  p_period_start timestamptz DEFAULT now(),
  p_period_end timestamptz DEFAULT (now() + interval '1 month')
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_id uuid;
BEGIN
  INSERT INTO billing_subscriptions (
    organization_id,
    plan,
    status,
    stripe_customer_id,
    stripe_subscription_id,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    updated_at
  )
  VALUES (
    p_org_id,
    p_plan,
    p_status,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_period_start,
    p_period_end,
    false,
    now()
  )
  ON CONFLICT (organization_id)
  DO UPDATE SET
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, billing_subscriptions.stripe_customer_id),
    stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, billing_subscriptions.stripe_subscription_id),
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = false,
    updated_at = now()
  RETURNING id INTO v_sub_id;

  -- If plan was upgraded and status is active, grant quota automatically
  IF p_status = 'active' THEN
    PERFORM grant_plan_credits(p_org_id, p_plan);
  END IF;

  RETURN v_sub_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION grant_topup_credits TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION record_paid_invoice TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_subscription_status TO authenticated, service_role;
