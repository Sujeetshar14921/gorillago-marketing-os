/*
# Organizations, Members, and RBAC Foundation

1. Purpose
This migration establishes the multi-tenant foundation for AI-MOS.
Every business feature table will be scoped to an organization via `organization_id`,
and Row Level Security policies will enforce that users can only access data
belonging to organizations they are a member of.

2. New Tables
- `organizations`
  - `id` (uuid, primary key)
  - `name` (text, not null) — display name of the org/agency/business
  - `slug` (text, unique, not null) — URL-friendly identifier
  - `plan` (text, default 'free') — billing plan tier
  - `owner_id` (uuid, references auth.users) — the user who created the org
  - `created_at`, `updated_at` (timestamptz)

- `organization_members`
  - `id` (uuid, primary key)
  - `organization_id` (uuid, references organizations, cascade delete)
  - `user_id` (uuid, references auth.users, cascade delete)
  - `role` (text, not null) — one of: super_admin, agency_owner, business_owner, marketing_manager, content_manager, viewer
  - `status` (text, default 'active') — active | invited | revoked
  - `created_at`, `updated_at` (timestamptz)
  - Unique constraint on (organization_id, user_id)

3. Indexes
- `organization_members` on `user_id` (fast membership lookups during RLS)
- `organization_members` on `organization_id` (fast member listing)
- `organizations` on `owner_id`

4. Security
- RLS enabled on both tables.
- `organizations`: a user can SELECT/UPDATE an org they are a member of; only the owner can DELETE.
- `organization_members`: members of an org can SELECT all members of that org;
  only org owners (or super_admin) can INSERT/UPDATE/DELETE membership rows.
- A SECURITY DEFINER helper `is_org_member(org_uuid)` is created for reuse in RLS
  across feature tables. It checks whether `auth.uid()` is an active member of the org.

5. Notes
- `is_org_member` is intentionally SECURITY DEFINER so it can be called inside RLS
  policy predicates on other tables without needing a direct join every time.
- Role hierarchy: super_admin > agency_owner > business_owner > marketing_manager > content_manager > viewer.
- The `role` column on organization_members is the source of truth for RBAC.
*/

-- =========================================================
-- ORGANIZATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- =========================================================
-- ORGANIZATION MEMBERS
-- =========================================================
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('super_admin','agency_owner','business_owner','marketing_manager','content_manager','viewer')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','invited','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);

-- =========================================================
-- HELPER: is_org_member
-- SECURITY DEFINER so it can be used inside RLS predicates on any table.
-- Returns true if the current authenticated user is an ACTIVE member of the given org.
-- =========================================================
CREATE OR REPLACE FUNCTION is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- Helper to check if current user is an org owner or super_admin
CREATE OR REPLACE FUNCTION is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('super_admin','agency_owner','business_owner')
  );
$$;

-- =========================================================
-- RLS: ORGANIZATIONS
-- =========================================================
DROP POLICY IF EXISTS "select_own_orgs" ON organizations;
CREATE POLICY "select_own_orgs"
  ON organizations FOR SELECT
  TO authenticated
  USING (is_org_member(id));

DROP POLICY IF EXISTS "update_own_orgs" ON organizations;
CREATE POLICY "update_own_orgs"
  ON organizations FOR UPDATE
  TO authenticated
  USING (is_org_member(id))
  WITH CHECK (is_org_member(id));

DROP POLICY IF EXISTS "insert_own_orgs" ON organizations;
CREATE POLICY "insert_own_orgs"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_orgs" ON organizations;
CREATE POLICY "delete_own_orgs"
  ON organizations FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =========================================================
-- RLS: ORGANIZATION MEMBERS
-- =========================================================
DROP POLICY IF EXISTS "select_org_members" ON organization_members;
CREATE POLICY "select_org_members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_members" ON organization_members;
CREATE POLICY "insert_org_members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "update_org_members" ON organization_members;
CREATE POLICY "update_org_members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "delete_org_members" ON organization_members;
CREATE POLICY "delete_org_members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));

-- =========================================================
-- updated_at triggers
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_org_members_updated_at ON organization_members;
CREATE TRIGGER trg_org_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();