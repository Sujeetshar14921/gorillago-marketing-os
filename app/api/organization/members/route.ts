import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized, apiBadRequest } from '@/server/http/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const { data: members, error: memError } = await context.supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', context.orgId)
      .order('created_at', { ascending: true });

    if (memError) throw memError;

    const userIds = (members ?? []).map((m) => m.user_id);
    if (userIds.length === 0) {
      return apiSuccess([]);
    }

    const { data: profiles } = await context.supabase
      .from('user_profiles')
      .select('user_id, email, full_name')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p])
    );

    const membersWithProfile = (members ?? []).map((m) => ({
      ...m,
      email: profileMap.get(m.user_id)?.email,
      full_name: profileMap.get(m.user_id)?.full_name,
    }));

    return apiSuccess(membersWithProfile);
  } catch (err: any) {
    console.error('API /api/organization/members GET error:', err);
    return apiError(err?.message || 'Failed to fetch members');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, email, role } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    if (!email) {
      return apiBadRequest('Email is required');
    }

    const { data: existingUser } = await context.supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!existingUser) {
      return apiBadRequest('No user found with that email. Ask them to sign up first.');
    }

    const { data: existingMember } = await context.supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', context.orgId)
      .eq('user_id', existingUser.user_id)
      .maybeSingle();

    if (existingMember) {
      return apiBadRequest('This user is already a member of your organization.');
    }

    const { data, error: insertError } = await context.supabase
      .from('organization_members')
      .insert({
        organization_id: context.orgId,
        user_id: existingUser.user_id,
        role: role || 'member',
        status: 'active',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return apiSuccess(data);
  } catch (err: any) {
    console.error('API /api/organization/members POST error:', err);
    return apiError(err?.message || 'Failed to invite member');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, memberId, role } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const { data, error: updateError } = await context.supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId)
      .eq('organization_id', context.orgId)
      .select()
      .single();

    if (updateError) throw updateError;

    return apiSuccess(data);
  } catch (err: any) {
    console.error('API /api/organization/members PATCH error:', err);
    return apiError(err?.message || 'Failed to update member role');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');
    const memberId = searchParams.get('memberId');

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    if (!memberId) {
      return apiBadRequest('memberId is required');
    }

    const { error: deleteError } = await context.supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', context.orgId);

    if (deleteError) throw deleteError;

    return apiSuccess({ success: true });
  } catch (err: any) {
    console.error('API /api/organization/members DELETE error:', err);
    return apiError(err?.message || 'Failed to remove member');
  }
}
