import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';

export async function DELETE(
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

    const { error: dbError } = await context.supabase
      .from('ai_conversations')
      .delete()
      .eq('id', id)
      .eq('organization_id', context.orgId);

    if (dbError) throw dbError;

    return apiSuccess({ success: true });
  } catch (err: any) {
    console.error('API /api/ai/conversations/[id] DELETE error:', err);
    return apiError(err?.message || 'Failed to delete conversation');
  }
}
