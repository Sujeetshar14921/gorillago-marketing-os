import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/server/http/response';
import { MediaService } from '@/server/services/media.service';

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

    const service = new MediaService(context.supabase);
    const asset = await service.getMediaById(params.id, context.orgId);
    if (!asset) {
      return apiNotFound('Media asset not found');
    }

    return apiSuccess(asset);
  } catch (err: any) {
    console.error('API /api/media/[id] GET error:', err);
    return apiError(err?.message || 'Failed to fetch media asset');
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

    const service = new MediaService(context.supabase);
    await service.deleteMedia(params.id, context.orgId);

    return apiSuccess({ deleted: true });
  } catch (err: any) {
    console.error('API /api/media/[id] DELETE error:', err);
    return apiError(err?.message || 'Failed to delete media asset');
  }
}
