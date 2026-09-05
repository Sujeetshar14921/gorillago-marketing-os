import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { orgId, ...updates } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const updateFields: Record<string, unknown> = {};
    if (updates.content !== undefined) updateFields.content = updates.content;
    if (updates.hashtags !== undefined) updateFields.hashtags = updates.hashtags;
    if (updates.mediaUrls !== undefined) updateFields.media_urls = updates.mediaUrls;
    if (updates.status !== undefined) updateFields.status = updates.status;
    if (updates.scheduledAt !== undefined) updateFields.scheduled_at = updates.scheduledAt;

    const { data, error: updateError } = await context.supabase
      .from('campaign_posts')
      .update(updateFields)
      .eq('id', id)
      .eq('organization_id', context.orgId)
      .select()
      .single();

    if (updateError) throw updateError;

    return apiSuccess(data);
  } catch (err: any) {
    console.error(`API /api/posts/[id] PATCH error:`, err);
    return apiError(err?.message || 'Failed to update post');
  }
}

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

    const { error: deleteError } = await context.supabase
      .from('campaign_posts')
      .delete()
      .eq('id', id)
      .eq('organization_id', context.orgId);

    if (deleteError) throw deleteError;

    return apiSuccess({ success: true });
  } catch (err: any) {
    console.error(`API /api/posts/[id] DELETE error:`, err);
    return apiError(err?.message || 'Failed to delete post');
  }
}
