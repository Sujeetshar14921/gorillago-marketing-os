/*
# Fix RLS helper function permissions and organization_members SELECT policy

1. Problem:
   Migrations 0011 and 0012 revoked EXECUTE from `anon`, `authenticated`, and `PUBLIC`
   on internal RLS helper functions:
     - is_org_member(uuid)
     - is_org_admin(uuid)
     - is_org_editor(uuid)

   In PostgreSQL, Row-Level Security (RLS) expressions are evaluated using the privileges
   of the executing user (the `authenticated` role). When `authenticated` lacks EXECUTE
   privilege on these functions, PostgreSQL throws:
     ERROR: permission denied for function is_org_member (SQLSTATE 42501)
   which Supabase's PostgREST converts to an HTTP 403 (Forbidden) response whenever any
   query evaluates RLS policies referencing these functions (e.g. on organization_members).

2. Solution:
   - GRANT EXECUTE on `is_org_member(uuid)`, `is_org_admin(uuid)`, and `is_org_editor(uuid)`
     to the `authenticated` role.
   - Update the `select_org_members` policy on `organization_members` to also allow users to
     directly read their own membership record (user_id = auth.uid()) in addition to checking
     org membership, preventing circular dependency and optimizing the lookup.
   - Update the `select_own_orgs` policy on `organizations` to also allow owners (owner_id = auth.uid())
     to read their own organization.
*/

-- 1. Grant EXECUTE to authenticated role on all RLS helper functions
GRANT EXECUTE ON FUNCTION is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_editor(uuid) TO authenticated;

-- 2. Update organization_members SELECT policy
DROP POLICY IF EXISTS "select_org_members" ON organization_members;
CREATE POLICY "select_org_members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_org_member(organization_id)
  );

-- 3. Update organizations SELECT policy
DROP POLICY IF EXISTS "select_own_orgs" ON organizations;
CREATE POLICY "select_own_orgs"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR is_org_member(id)
  );
