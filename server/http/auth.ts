import { createServerClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export interface AuthenticatedContext {
  user: User;
  userId: string;
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  orgId: string;
  role: string;
}

/**
 * Authenticates the current server request and verifies user session.
 */
export async function authenticateServerRequest() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase, error: error?.message || 'Unauthorized' };
  }

  return { user, supabase, error: null };
}

/**
 * Authenticates user and resolves their active organization.
 */
export async function getAuthenticatedOrg(
  requestedOrgId?: string | null
): Promise<{ context: AuthenticatedContext | null; error: string | null; status: number }> {
  const { user, supabase, error: authError } = await authenticateServerRequest();

  if (authError || !user) {
    return { context: null, error: 'Unauthorized: Please log in', status: 401 };
  }

  // 1. If explicit orgId requested, verify membership
  if (requestedOrgId) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('organization_id', requestedOrgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (membership) {
      return {
        context: {
          user,
          userId: user.id,
          supabase,
          orgId: requestedOrgId,
          role: membership.role,
        },
        error: null,
        status: 200,
      };
    }

    // Check direct ownership fallback
    const { data: ownedOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', requestedOrgId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (ownedOrg) {
      return {
        context: {
          user,
          userId: user.id,
          supabase,
          orgId: requestedOrgId,
          role: 'business_owner',
        },
        error: null,
        status: 200,
      };
    }
  }

  // 2. Default lookup: Find first active organization membership for user
  const { data: defaultMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (defaultMember) {
    return {
      context: {
        user,
        userId: user.id,
        supabase,
        orgId: defaultMember.organization_id,
        role: defaultMember.role,
      },
      error: null,
      status: 200,
    };
  }

  // 3. Direct ownership lookup
  const { data: ownedOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (ownedOrg) {
    return {
      context: {
        user,
        userId: user.id,
        supabase,
        orgId: ownedOrg.id,
        role: 'business_owner',
      },
      error: null,
      status: 200,
    };
  }

  // 4. Auto-create default organization on server if user has none
  const orgName =
    user.user_metadata?.org_name ||
    (user.user_metadata?.full_name ? `${user.user_metadata.full_name}'s Workspace` : 'My Organization');
  const slug = `org-${user.id.slice(0, 8)}-${Math.random().toString(36).substring(2, 7)}`;
  const newOrgId = crypto.randomUUID();

  const { error: createError } = await supabase.from('organizations').insert({
    id: newOrgId,
    name: orgName,
    slug,
    owner_id: user.id,
    plan: 'free',
  });

  if (!createError) {
    try {
      await supabase.from('organization_members').insert({
        organization_id: newOrgId,
        user_id: user.id,
        role: 'business_owner',
        status: 'active',
      });
    } catch {}

    return {
      context: {
        user,
        userId: user.id,
        supabase,
        orgId: newOrgId,
        role: 'business_owner',
      },
      error: null,
      status: 200,
    };
  }

  return { context: null, error: 'No active organization found for user', status: 403 };
}
