import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');
    const includeDisconnected = searchParams.get('includeDisconnected') === 'true';

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    let query = context.supabase
      .from('social_accounts')
      .select('*')
      .eq('organization_id', context.orgId);

    if (!includeDisconnected) {
      query = query.eq('is_connected', true);
    }

    const { data, error: dbError } = await query.order('created_at', { ascending: false });
    if (dbError) throw dbError;

    return apiSuccess(data ?? []);
  } catch (err: any) {
    console.error('API /api/social-accounts GET error:', err);
    return apiError(err?.message || 'Failed to fetch social accounts');
  }
}
