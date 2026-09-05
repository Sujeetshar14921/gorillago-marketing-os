/*
# Fix: Auto Organization Membership, Admin Fallback, and Brands RLS

1. Purpose:
   - Fix "Failed to save brand settings" caused by RLS check failures on `is_org_admin`
     or missing organization memberships for newly registered users.
   - Update `is_org_member` and `is_org_admin` helper functions to also recognize the
     organization owner (`owner_id = auth.uid()`), avoiding chicken-and-egg RLS locks.
   - Create an automated trigger on `organizations` so any created organization immediately
     adds the owner to `organization_members` as `business_owner` and initializes default
     settings and brand records.
   - Ensure EXECUTE permissions on all helper functions are granted to `authenticated`.
*/

-- 1. Update is_org_member to check membership OR direct ownership
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
  ) OR EXISTS (
    SELECT 1
    FROM organizations
    WHERE id = p_org_id
      AND owner_id = auth.uid()
  );
$$;

-- 2. Update is_org_admin to check admin roles OR direct ownership
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
  ) OR EXISTS (
    SELECT 1
    FROM organizations
    WHERE id = p_org_id
      AND owner_id = auth.uid()
  );
$$;

-- 3. Ensure permissions are granted to authenticated users
GRANT EXECUTE ON FUNCTION is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_editor(uuid) TO authenticated;

-- 4. Automated trigger: whenever an organization is created, attach owner as business_owner
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_organization ON organizations;
CREATE TRIGGER trg_new_organization
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION handle_new_organization();

-- 5. Update Brands RLS policies
DROP POLICY IF EXISTS "select_org_brands" ON brands;
CREATE POLICY "select_org_brands"
  ON brands FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "insert_org_brands" ON brands;
CREATE POLICY "insert_org_brands"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "update_org_brands" ON brands;
CREATE POLICY "update_org_brands"
  ON brands FOR UPDATE
  TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_admin(organization_id));

-- 6. Retroactively add any missing memberships for existing organization owners
INSERT INTO organization_members (organization_id, user_id, role, status)
SELECT id, owner_id, 'business_owner', 'active'
FROM organizations
WHERE owner_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;
