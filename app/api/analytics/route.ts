import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');
    const entityType = searchParams.get('entityType') || 'organization';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const latestInsight = searchParams.get('latestInsight') === 'true';

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    if (latestInsight) {
      const { data, error: dbError } = await context.supabase
        .from('analytics_snapshots')
        .select('ai_suggestion')
        .eq('organization_id', context.orgId)
        .eq('entity_type', 'organization')
        .not('ai_suggestion', 'is', null)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbError) throw dbError;
      return apiSuccess({ aiSuggestion: data?.ai_suggestion ?? null });
    }

    let query = context.supabase
      .from('analytics_snapshots')
      .select('*')
      .eq('organization_id', context.orgId)
      .eq('entity_type', entityType);

    if (from) {
      query = query.gte('date', from);
    }
    if (to) {
      query = query.lte('date', to);
    }

    const { data, error: dbError } = await query.order('date', { ascending: true });
    if (dbError) throw dbError;

    return apiSuccess(data ?? []);
  } catch (err: any) {
    console.error('API /api/analytics GET error:', err);
    return apiError(err?.message || 'Failed to fetch analytics');
  }
}
