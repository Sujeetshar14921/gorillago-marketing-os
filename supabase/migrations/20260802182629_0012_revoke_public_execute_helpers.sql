/*
# Fix: Revoke EXECUTE from PUBLIC on RLS helper functions

The previous REVOKE from anon/authenticated was insufficient because Postgres
grants EXECUTE to PUBLIC by default when a function is created. We must revoke
from PUBLIC to fully prevent direct API calls to these internal helper functions.
RLS policy evaluation still works because it runs in the definer's security context.
*/

REVOKE EXECUTE ON FUNCTION is_org_member(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_org_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_org_editor(uuid) FROM PUBLIC;