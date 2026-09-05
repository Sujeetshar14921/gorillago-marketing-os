/*
# OAuth and Integrations Engine Migration

1. Purpose:
   - Adds unique constraint on (organization_id, platform, account_id) to prevent duplicate social accounts.
   - Provides atomic RPC functions for upserting, disconnecting, and testing health of social accounts.
   - Provides atomic RPC function for upserting third-party integrations (Google Ads, Meta Ads, etc.).

2. Functions:
   - upsert_social_account
   - disconnect_social_account
   - update_social_account_health
   - upsert_integration
   - disconnect_integration
*/

-- 1. Unique constraint to ensure idempotency when syncing pages/profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_accounts_org_platform_account 
  ON social_accounts(organization_id, platform, account_id);

-- 2. Upsert Social Account RPC
CREATE OR REPLACE FUNCTION upsert_social_account(
  p_org_id uuid,
  p_platform text,
  p_account_name text,
  p_account_id text,
  p_access_token text DEFAULT NULL,
  p_refresh_token text DEFAULT NULL,
  p_token_expires_at timestamptz DEFAULT NULL,
  p_scopes text[] DEFAULT '{}',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO social_accounts (
    organization_id,
    platform,
    account_name,
    account_id,
    access_token,
    refresh_token,
    token_expires_at,
    scopes,
    health_status,
    last_health_check_at,
    metadata,
    is_connected,
    updated_at
  )
  VALUES (
    p_org_id,
    p_platform,
    p_account_name,
    p_account_id,
    p_access_token,
    p_refresh_token,
    p_token_expires_at,
    p_scopes,
    'healthy',
    now(),
    p_metadata,
    true,
    now()
  )
  ON CONFLICT (organization_id, platform, account_id)
  DO UPDATE SET
    account_name = EXCLUDED.account_name,
    access_token = COALESCE(EXCLUDED.access_token, social_accounts.access_token),
    refresh_token = COALESCE(EXCLUDED.refresh_token, social_accounts.refresh_token),
    token_expires_at = COALESCE(EXCLUDED.token_expires_at, social_accounts.token_expires_at),
    scopes = CASE WHEN array_length(EXCLUDED.scopes, 1) > 0 THEN EXCLUDED.scopes ELSE social_accounts.scopes END,
    health_status = 'healthy',
    last_health_check_at = now(),
    metadata = social_accounts.metadata || EXCLUDED.metadata,
    is_connected = true,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 3. Disconnect Social Account RPC
CREATE OR REPLACE FUNCTION disconnect_social_account(
  p_account_id uuid,
  p_org_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE social_accounts
  SET is_connected = false,
      health_status = 'disconnected',
      updated_at = now()
  WHERE id = p_account_id AND organization_id = p_org_id;

  RETURN FOUND;
END;
$$;

-- 4. Update Health Status RPC
CREATE OR REPLACE FUNCTION update_social_account_health(
  p_account_id uuid,
  p_org_id uuid,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE social_accounts
  SET health_status = p_status,
      last_health_check_at = now(),
      updated_at = now()
  WHERE id = p_account_id AND organization_id = p_org_id;

  RETURN FOUND;
END;
$$;

-- 5. Upsert Integration RPC (for Google Ads, Meta Ads, etc.)
CREATE OR REPLACE FUNCTION upsert_integration(
  p_org_id uuid,
  p_type text,
  p_name text,
  p_credentials jsonb DEFAULT '{}'::jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO integrations (
    organization_id,
    type,
    name,
    status,
    credentials,
    metadata,
    last_synced_at,
    updated_at
  )
  VALUES (
    p_org_id,
    p_type,
    p_name,
    'connected',
    p_credentials,
    p_metadata,
    now(),
    now()
  )
  ON CONFLICT (organization_id, type)
  DO UPDATE SET
    name = EXCLUDED.name,
    status = 'connected',
    credentials = integrations.credentials || EXCLUDED.credentials,
    metadata = integrations.metadata || EXCLUDED.metadata,
    last_synced_at = now(),
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 6. Disconnect Integration RPC
CREATE OR REPLACE FUNCTION disconnect_integration(
  p_type text,
  p_org_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE integrations
  SET status = 'disconnected',
      updated_at = now()
  WHERE type = p_type AND organization_id = p_org_id;

  RETURN FOUND;
END;
$$;

-- Grant execution to authenticated users and service_role
GRANT EXECUTE ON FUNCTION upsert_social_account TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION disconnect_social_account TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_social_account_health TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION upsert_integration TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION disconnect_integration TO authenticated, service_role;
