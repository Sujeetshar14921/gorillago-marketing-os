/*
# Security Hardening: Revoke public EXECUTE on RLS helper functions

1. Purpose
The SECURITY DEFINER helper functions (is_org_member, is_org_admin, is_org_editor) are used
internally by RLS policy predicates. They must NOT be callable directly via the REST API
by the anon or authenticated roles — only RLS evaluation should invoke them.

2. Changes
- REVOKE EXECUTE on is_org_member, is_org_admin, is_org_editor from anon and authenticated.
- GRANT EXECUTE only to the authenticated role is intentionally NOT done — these are internal.
  Supabase's RLS engine uses the table owner / definer context, not role grants, to evaluate
  policy predicates, so revoking public execute does not break RLS.
- Fix set_updated_at trigger function: add SET search_path = public to address the
  mutable search_path linter warning.
*/

-- Revoke execute from anon and authenticated on all helper functions
REVOKE EXECUTE ON FUNCTION is_org_member(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_org_admin(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_org_editor(uuid) FROM anon, authenticated;

-- Fix set_updated_at to have an explicit search_path
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;