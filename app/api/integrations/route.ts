import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const { data, error: dbError } = await context.supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', context.orgId)
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    return apiSuccess(data ?? []);
  } catch (err: any) {
    console.error('API /api/integrations GET error:', err);
    return apiError(err?.message || 'Failed to fetch integrations');
  }
}
