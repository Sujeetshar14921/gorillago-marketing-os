import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/server/http/response';
import { ContentService } from '@/server/services/content.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new ContentService(context.supabase);
    const content = await service.getContentById(params.id, context.orgId);
    if (!content) {
      return apiNotFound('Content record not found');
    }

    return apiSuccess(content);
  } catch (err: any) {
    console.error('API /api/content/[id] GET error:', err);
    return apiError(err?.message || 'Failed to fetch content record');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { orgId, ...updates } = body;

    const { context, error } = await getAuthenticatedOrg(orgId);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new ContentService(context.supabase);
    const updated = await service.updateContent(params.id, context.orgId, updates);

    return apiSuccess(updated);
  } catch (err: any) {
    console.error('API /api/content/[id] PUT error:', err);
    return apiError(err?.message || 'Failed to update content record');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('orgId');

    const { context, error } = await getAuthenticatedOrg(orgIdParam);
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const service = new ContentService(context.supabase);
    await service.deleteContent(params.id, context.orgId);

    return apiSuccess({ deleted: true });
  } catch (err: any) {
    console.error('API /api/content/[id] DELETE error:', err);
    return apiError(err?.message || 'Failed to delete content record');
  }
}
