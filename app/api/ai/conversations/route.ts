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
      .from('ai_conversations')
      .select('*')
      .eq('organization_id', context.orgId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (dbError) throw dbError;

    return apiSuccess(data ?? []);
  } catch (err: any) {
    console.error('API /api/ai/conversations GET error:', err);
    return apiError(err?.message || 'Failed to fetch conversations');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, title } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const { data, error: insertError } = await context.supabase
      .from('ai_conversations')
      .insert({
        organization_id: context.orgId,
        title: title ?? 'New Conversation',
        created_by: context.userId,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return apiSuccess(data);
  } catch (err: any) {
    console.error('API /api/ai/conversations POST error:', err);
    return apiError(err?.message || 'Failed to create conversation');
  }
}
