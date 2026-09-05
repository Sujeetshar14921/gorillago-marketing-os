import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const { data, error: dbError } = await context.supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (dbError) throw dbError;

    return apiSuccess(data ?? []);
  } catch (err: any) {
    console.error('API /api/ai/conversations/[id]/messages GET error:', err);
    return apiError(err?.message || 'Failed to fetch messages');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { orgId, messageId, actionStatus } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const { data, error: updateError } = await context.supabase
      .from('ai_messages')
      .update({ action_status: actionStatus })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) throw updateError;

    return apiSuccess(data);
  } catch (err: any) {
    console.error('API /api/ai/conversations/[id]/messages PATCH error:', err);
    return apiError(err?.message || 'Failed to update message action');
  }
}
